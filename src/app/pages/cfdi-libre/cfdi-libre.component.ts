import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { NgxXml2jsonService } from 'ngx-xml2json';
import * as Notiflix from 'notiflix';
import { Subscription } from 'rxjs';
import { GeneralService } from 'src/app/services/general.service';

@Component({
  selector: 'app-cfdi-libre',
  templateUrl: './cfdi-libre.component.html',
  styleUrls: ['./cfdi-libre.component.css']
})
export class CfdiLibreComponent implements OnInit, OnDestroy {
  idUser: string = '';
  user: any = {};
  idCompany: string = '';
  idProject: string = '';
  rfcSeleccionado: string = '';

  arrCFDIsDirectos: any[] = [];
  cargando: boolean = true;
  cargandoDirecto: boolean = false;

  cfdiDirectoNuevo: any = {
    xmlData: null,
    xmlFile: null,
    pdfFile: null,
    xmlNombre: '',
    pdfNombre: ''
  };

  private subUser: Subscription | undefined;
  private subCFDIs: Subscription | undefined;

  constructor(
    private generalService: GeneralService,
    private ngxXml2jsonService: NgxXml2jsonService,
    public storage: AngularFireStorage,
    private router: Router
  ) {}

  ngOnInit(): void {
    const rfc = this.router.url.split('/')[2];
    this.rfcSeleccionado = rfc;

    this.idUser = window.sessionStorage.getItem('id') || '';
    this.idCompany = window.sessionStorage.getItem('idCompany') || '';
    this.idProject = window.sessionStorage.getItem('idProject') || '';

    if (this.idUser) {
      this.getUser(this.idUser);
    } else if (this.rfcSeleccionado) {
      this.getUserByRFC(this.rfcSeleccionado);
    }
  }

  getUser(idUser: string): void {
    if (!idUser) return;
    this.subUser?.unsubscribe();
    this.subUser = this.generalService.getUserId(idUser).subscribe((res: any) => {
      if (!res) return;
      this.user = res;
      this.user.id = idUser;
      if (!this.idCompany) {
        this.idCompany = res.empresa?.idCompany || '';
      }
      if (!this.idProject) {
        this.idProject = res.proyecto?.idProject || '';
      }
      this.cargarCFDIsDirectos();
    });
  }

  getUserByRFC(rfc: string): void {
    this.subUser?.unsubscribe();
    this.subUser = this.generalService.getUserByRFC(rfc).subscribe((users: any[]) => {
      if (users && users.length > 0) {
        this.user = users[0];
        this.idUser = users[0].id;
        if (!this.idCompany) {
          this.idCompany = this.user.empresa?.idCompany || '';
        }
        if (!this.idProject) {
          this.idProject = this.user.proyecto?.idProject || '';
        }
        this.cargarCFDIsDirectos();
      }
    });
  }

  cargarCFDIsDirectos(): void {
    const rfcConsulta = this.user.rfc || this.rfcSeleccionado;
    if (!this.idCompany || !this.idProject || !rfcConsulta) {
      this.cargando = false;
      return;
    }

    this.subCFDIs?.unsubscribe();
    this.subCFDIs = this.generalService
      .getCFDIsDirectos(this.idCompany, this.idProject, rfcConsulta)
      .subscribe((cfdis: any[]) => {
        this.arrCFDIsDirectos = cfdis.sort((a, b) => {
          const fA = a.cargado?.toDate ? a.cargado.toDate() : new Date(a.cargado || 0);
          const fB = b.cargado?.toDate ? b.cargado.toDate() : new Date(b.cargado || 0);
          return fB.getTime() - fA.getTime();
        });
        this.cargando = false;
      });
  }

  onFileChangeXMLDirecto(ev: any): void {
    const file = ev.target.files[0];
    if (!file) return;

    if (file.type !== 'text/xml' && !file.name.toLowerCase().endsWith('.xml')) {
      Notiflix.Notify.failure(`El archivo ${file.name} no es un archivo XML.`);
      return;
    }

    const lector = new FileReader();
    lector.onload = (e: any) => {
      const res = e.target.result;
      const parser = new DOMParser();
      const xml = parser.parseFromString(res, 'text/xml');
      const obj: any = this.ngxXml2jsonService.xmlToJson(xml);

      try {
        const comprobante = obj['cfdi:Comprobante'];
        if (!comprobante) {
          throw new Error('El XML no contiene la estructura esperada de CFDI');
        }

        const emisor = comprobante['cfdi:Emisor']?.['@attributes'] || {};
        const receptor = comprobante['cfdi:Receptor']?.['@attributes'] || {};
        const timbre = comprobante['cfdi:Complemento']?.['tfd:TimbreFiscalDigital']?.['@attributes'] || {};

        const rfcEmisor = emisor.Rfc || '';
        const uuid = timbre.UUID || '';

        const rfcUsuario = (this.user.rfc || this.rfcSeleccionado || '').trim().toUpperCase();
        if (rfcEmisor.trim().toUpperCase() !== rfcUsuario) {
          Notiflix.Notify.failure(`El RFC emisor del CFDI (${rfcEmisor}) no coincide con tu RFC registrado (${rfcUsuario}).`);
          return;
        }

        if (!uuid) {
          Notiflix.Notify.failure('El archivo XML no cuenta con UUID / Timbre Fiscal Digital.');
          return;
        }

        let descripcionConcepto = '';
        let claveProdServ = '';
        let claveUnidad = '';
        const conceptos = comprobante['cfdi:Conceptos']?.['cfdi:Concepto'];
        if (Array.isArray(conceptos)) {
          descripcionConcepto = conceptos[0]?.['@attributes']?.Descripcion || '';
          claveProdServ = conceptos[0]?.['@attributes']?.ClaveProdServ || '';
          claveUnidad = conceptos[0]?.['@attributes']?.ClaveUnidad || '';
        } else if (conceptos) {
          descripcionConcepto = conceptos['@attributes']?.Descripcion || '';
          claveProdServ = conceptos['@attributes']?.ClaveProdServ || '';
          claveUnidad = conceptos['@attributes']?.ClaveUnidad || '';
        }

        // Impuestos (Traslados y Retenciones)
        let iva = 0;
        let otrasCont = 0;
        let retIVA = 0;
        let retISR = 0;

        const impuestos = comprobante['cfdi:Impuestos'];
        if (impuestos) {
          // Traslados
          if (impuestos['cfdi:Traslados']?.['cfdi:Traslado']) {
            const traslados = impuestos['cfdi:Traslados']['cfdi:Traslado'];
            if (Array.isArray(traslados)) {
              traslados.forEach((element: any) => {
                const impuestoTipo = element?.['@attributes']?.Impuesto;
                const importe = parseFloat(element?.['@attributes']?.Importe || '0');
                if (impuestoTipo === '002') {
                  iva += importe;
                } else if (impuestoTipo === '003') {
                  otrasCont += importe;
                }
              });
            } else if (traslados?.['@attributes']) {
              const impuestoTipo = traslados['@attributes'].Impuesto;
              const importe = parseFloat(traslados['@attributes'].Importe || '0');
              if (impuestoTipo === '002' || !impuestoTipo) {
                iva = importe;
              } else if (impuestoTipo === '003') {
                otrasCont = importe;
              }
            }
          }

          // Retenciones
          if (impuestos['cfdi:Retenciones']?.['cfdi:Retencion']) {
            const retenciones = impuestos['cfdi:Retenciones']['cfdi:Retencion'];
            if (Array.isArray(retenciones)) {
              retenciones.forEach((element: any) => {
                const impuestoTipo = element?.['@attributes']?.Impuesto;
                const importe = parseFloat(element?.['@attributes']?.Importe || '0');
                if (impuestoTipo === '002') {
                  retIVA += importe;
                } else if (impuestoTipo === '001') {
                  retISR += importe;
                }
              });
            } else if (retenciones?.['@attributes']) {
              const impuestoTipo = retenciones['@attributes'].Impuesto;
              const importe = parseFloat(retenciones['@attributes'].Importe || '0');
              if (impuestoTipo === '002') {
                retIVA = importe;
              } else if (impuestoTipo === '001') {
                retISR = importe;
              }
            }
          }
        }

        const subtotal = parseFloat(comprobante['@attributes']?.SubTotal || '0');
        const descuento = parseFloat(comprobante['@attributes']?.Descuento || '0');
        const total = parseFloat(comprobante['@attributes']?.Total || '0');
        const moneda = comprobante['@attributes']?.Moneda || 'MXN';
        const fecha = comprobante['@attributes']?.Fecha || '';
        const tipoComprobante = comprobante['@attributes']?.TipoDeComprobante || 'I';
        const metodoPago = comprobante['@attributes']?.MetodoPago || '';
        const formaPago = comprobante['@attributes']?.FormaPago || '';
        const regimen = emisor.RegimenFiscal || '';
        const usoCFDI = receptor.UsoCFDI || '';

        this.cfdiDirectoNuevo.xmlFile = file;
        this.cfdiDirectoNuevo.xmlNombre = file.name;
        this.cfdiDirectoNuevo.xmlData = {
          asociado: false,
          folioComprobante: uuid,
          rfc: rfcEmisor,
          rfcEmisor: rfcEmisor,
          proveedor: emisor.Nombre || '',
          nombreEmisor: emisor.Nombre || '',
          regimen: regimen,
          rfcReceptor: receptor.Rfc || '',
          nombreReceptor: receptor.Nombre || '',
          usoCFDI: usoCFDI,
          fecha: fecha,
          subtotal: subtotal,
          descuento: descuento,
          tipoComprobante: tipoComprobante,
          tipoDeComprobante: tipoComprobante,
          metodoPago: metodoPago,
          formaPago: formaPago,
          moneda: moneda,
          total: total,
          concepto: descripcionConcepto,
          claveProdServ: claveProdServ,
          claveUnidad: claveUnidad,
          iva: iva,
          otrasCont: otrasCont,
          retIVA: retIVA,
          retISR: retISR,
          inventario: 'No',
          partida: 'PENDIENTE'
        };

        Notiflix.Notify.success(`XML cargado correctamente: ${file.name}`);
      } catch (err: any) {
        console.error('Error parseando XML directo:', err);
        Notiflix.Notify.failure('No se pudo interpretar el archivo XML. Verifica que sea un CFDI válido.');
      }
    };
    lector.readAsText(file);
  }

  onFileChangePDFDirecto(ev: any): void {
    const file = ev.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf') || file.size >= 5000000) {
      Notiflix.Notify.failure('Por favor selecciona un archivo .pdf no mayor a 5MB.');
      return;
    }

    this.cfdiDirectoNuevo.pdfFile = file;
    this.cfdiDirectoNuevo.pdfNombre = file.name;
    Notiflix.Notify.success(`PDF seleccionado: ${file.name}`);
  }

  guardarCFDIDirecto(): void {
    if (!this.cfdiDirectoNuevo.xmlFile || !this.cfdiDirectoNuevo.xmlData) {
      Notiflix.Notify.failure('Por favor carga el archivo XML de la factura.');
      return;
    }

    if (!this.cfdiDirectoNuevo.pdfFile) {
      Notiflix.Notify.failure('Por favor adjunta también el archivo PDF correspondiente.');
      return;
    }

    const uuid = this.cfdiDirectoNuevo.xmlData.folioComprobante;

    const yaExiste = this.arrCFDIsDirectos.some((c: any) => c.uuid === uuid);
    if (yaExiste) {
      Notiflix.Notify.failure(`La factura con folio fiscal UUID ${uuid} ya fue cargada anteriormente.`);
      return;
    }

    this.cargandoDirecto = true;
    Notiflix.Loading.standard('Subiendo y registrando factura...');

    const rfcUsuario = this.user.rfc || this.rfcSeleccionado;
    const rutaBase = `CFDIsDirectos/${this.idProject}/${rfcUsuario}/${uuid}`;
    const rutaXML = `${rutaBase}/${uuid}.xml`;
    const rutaPDF = `${rutaBase}/${uuid}.pdf`;

    const taskXML = this.storage.upload(rutaXML, this.cfdiDirectoNuevo.xmlFile);
    const taskPDF = this.storage.upload(rutaPDF, this.cfdiDirectoNuevo.pdfFile);

    Promise.all([taskXML, taskPDF])
      .then(() => {
        const data = this.cfdiDirectoNuevo.xmlData;
        const xmlItem = {
          asociado: false,
          folioComprobante: uuid,
          rfc: data.rfcEmisor || rfcUsuario,
          rfcEmisor: data.rfcEmisor || rfcUsuario,
          proveedor: data.nombreEmisor || this.user.nombre || '',
          nombreEmisor: data.nombreEmisor || this.user.nombre || '',
          regimen: data.regimen || '',
          rfcReceptor: data.rfcReceptor || '',
          nombreReceptor: data.nombreReceptor || '',
          usoCFDI: data.usoCFDI || '',
          fecha: data.fecha,
          subtotal: data.subtotal,
          descuento: data.descuento || 0,
          tipoComprobante: data.tipoComprobante,
          tipoDeComprobante: data.tipoComprobante,
          metodoPago: data.metodoPago || '',
          formaPago: data.formaPago || '',
          moneda: data.moneda,
          total: data.total,
          concepto: data.concepto,
          claveProdServ: data.claveProdServ || '',
          claveUnidad: data.claveUnidad || '',
          iva: data.iva || 0,
          otrasCont: data.otrasCont || 0,
          retIVA: data.retIVA || 0,
          retISR: data.retISR || 0,
          inventario: 'No',
          partida: 'PENDIENTE',
          pathXML: rutaXML,
          pathPDF: rutaPDF,
          cargado: new Date(),
          idProject: this.idProject,
          nombreProyecto: this.user.nombreProyecto || this.user.proyecto?.nameProject || '',
          sobre: this.user.sobre || 1
        };

        const nuevoRegistroCFDI: any = {
          uuid: uuid,
          rfc: rfcUsuario,
          nombreProveedor: this.user.nombre || data.nombreEmisor,
          idCompany: this.idCompany,
          idProject: this.idProject,
          nombreProyecto: this.user.nombreProyecto || this.user.proyecto?.nameProject || '',
          cargado: new Date(),
          pathXML: rutaXML,
          pathPDF: rutaPDF,
          nombreArchivoXML: this.cfdiDirectoNuevo.xmlNombre,
          nombreArchivoPDF: this.cfdiDirectoNuevo.pdfNombre,
          estatus: 'EN REVISION',
          aprobadoXML: null,
          aprobadoPDF: null,
          // Desglose fiscal extraído del XML
          subtotal: data.subtotal,
          descuento: data.descuento || 0,
          iva: data.iva || 0,
          otrasCont: data.otrasCont || 0,
          retIVA: data.retIVA || 0,
          retISR: data.retISR || 0,
          total: data.total,
          moneda: data.moneda,
          fechaFactura: data.fecha,
          concepto: data.concepto,
          claveProdServ: data.claveProdServ || '',
          claveUnidad: data.claveUnidad || '',
          regimen: data.regimen || '',
          rfcReceptor: data.rfcReceptor,
          nombreReceptor: data.nombreReceptor || '',
          metodoPago: data.metodoPago || '',
          formaPago: data.formaPago || '',
          tipoComprobante: data.tipoComprobante,
          // Objeto XML completo estructurado
          xml: xmlItem
        };

        // 1. Guardar en el array 'xml' del documento del proveedor en 'usersPublic'
        const arrXmlUsuario: any[] = Array.isArray(this.user.xml) ? [...this.user.xml] : [];
        const indexExistente = arrXmlUsuario.findIndex(
          (x: any) => x.folioComprobante === uuid
        );
        if (indexExistente > -1) {
          arrXmlUsuario[indexExistente] = xmlItem;
        } else {
          arrXmlUsuario.push(xmlItem);
        }

        const guardarEnUsersPublic = this.idUser
          ? this.generalService.saveUserDB({ xml: arrXmlUsuario }, this.idUser)
          : Promise.resolve();

        // 2. Guardar en subcolección CFDIsDirectos para administración
        const guardarEnCFDIsDirectos = this.generalService.addCFDIDirecto(
          this.idCompany,
          this.idProject,
          nuevoRegistroCFDI
        );

        return Promise.all([guardarEnCFDIsDirectos, guardarEnUsersPublic]);
      })
      .then(() => {
        this.cargandoDirecto = false;
        Notiflix.Loading.remove();
        Notiflix.Notify.success('Factura CFDI cargada y guardada en el perfil del proveedor correctamente.');

        this.cfdiDirectoNuevo = {
          xmlData: null,
          xmlFile: null,
          pdfFile: null,
          xmlNombre: '',
          pdfNombre: ''
        };
      })
      .catch((err) => {
        this.cargandoDirecto = false;
        Notiflix.Loading.remove();
        console.error('Error al guardar CFDI directo:', err);
        Notiflix.Notify.failure('Ocurrió un error al guardar la factura: ' + err.message);
      });
  }

  downloadFile(path: any): void {
    if (!path) return;
    this.storage
      .ref(path)
      .getDownloadURL()
      .subscribe(url => {
        window.open(url, '_blank');
      });
  }

  eliminarCFDIDirecto(cfdi: any): void {
    Notiflix.Confirm.show(
      'Eliminar Factura',
      `¿Estás seguro de eliminar el CFDI con folio ${cfdi.uuid}?`,
      'Sí, eliminar',
      'Cancelar',
      () => {
        Notiflix.Loading.standard('Eliminando factura...');
        const delXML = cfdi.pathXML ? this.storage.ref(cfdi.pathXML).delete().toPromise() : Promise.resolve();
        const delPDF = cfdi.pathPDF ? this.storage.ref(cfdi.pathPDF).delete().toPromise() : Promise.resolve();

        const arrXmlFiltrado = (this.user?.xml && Array.isArray(this.user.xml))
          ? this.user.xml.filter((x: any) => x.folioComprobante !== cfdi.uuid)
          : null;
        const delUsersPublic = (this.idUser && arrXmlFiltrado)
          ? this.generalService.saveUserDB({ xml: arrXmlFiltrado }, this.idUser)
          : Promise.resolve();

        Promise.all([delXML, delPDF])
          .then(() => {
            return Promise.all([
              this.generalService.deleteCFDIDirecto(this.idCompany, this.idProject, cfdi.id),
              delUsersPublic
            ]);
          })
          .then(() => {
            Notiflix.Loading.remove();
            Notiflix.Notify.success('Factura eliminada correctamente.');
          })
          .catch(() => {
            Notiflix.Loading.remove();
            this.generalService.deleteCFDIDirecto(this.idCompany, this.idProject, cfdi.id).then(() => {
              Notiflix.Notify.success('Registro eliminado.');
            });
          });
      }
    );
  }

  ngOnDestroy(): void {
    this.subUser?.unsubscribe();
    this.subCFDIs?.unsubscribe();
  }
}
