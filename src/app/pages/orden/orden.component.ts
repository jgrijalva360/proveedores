import { Component } from '@angular/core';
import { GeneralService } from 'src/app/services/general.service';
import * as Notiflix from 'notiflix';
import { NgxXml2jsonService } from 'ngx-xml2json';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { Router } from '@angular/router';

declare var bootstrap: any;

@Component({
  selector: 'app-orden',
  templateUrl: './orden.component.html',
  styleUrls: ['./orden.component.css']
})
export class OrdenComponent {
  idUser: any;
  user = {} as any;
  idCompany: any;
  idProject: any;
  xml = {} as any;
  arrProviders = [] as any[];
  arrAllOC = [] as any[];
  arrOC = [] as any[];
  today: Date = new Date();
  arrErrorsXML = [] as any[];
  totales = [] as any[];
  rfcSeleccionado: string = '';
  nombreProyecto: string = '';
  nombreEmpresa: string = '';
  rfcEmpresa: string = '';
  rfcProyecto: string = '';
  companyData: any = null;
  projectData: any = null;

  constructor(
    private generalService: GeneralService,
    private ngxXml2jsonService: NgxXml2jsonService,
    public storage: AngularFireStorage,
    private router: Router
  ) { }

  ngOnInit(): void {
    console.log('Se inicia order');
    const rfc = this.router.url.split('/')[2];
    this.rfcSeleccionado = rfc;

    this.idUser = window.sessionStorage.getItem('id') || '';
    this.idCompany = window.sessionStorage.getItem('idCompany') || '';
    this.idProject = window.sessionStorage.getItem('idProject') || '';
    this.nombreProyecto = window.sessionStorage.getItem('nombreProyecto') || '';
    this.nombreEmpresa = window.sessionStorage.getItem('nombreEmpresa') || '';
    this.rfcEmpresa = window.sessionStorage.getItem('rfcEmpresa') || '';
    this.rfcProyecto = window.sessionStorage.getItem('rfcProyecto') || '';

    this.cargarDatosEmpresaYProyecto();

    // this.today = new Date('2025-10-18T15:00:00'); // Solo para pruebas
    this.today = new Date(); // Fecha actual
    this.getUser(this.idUser);
  }

  cargarDatosEmpresaYProyecto(): void {
    const idCompany = this.idCompany || window.sessionStorage.getItem('idCompany') || '';
    const idProject = this.idProject || window.sessionStorage.getItem('idProject') || '';

    if (idCompany) {
      this.generalService.getCompany(idCompany).subscribe((comp: any) => {
        if (comp) {
          this.companyData = comp;
          const rfc = (comp.rfc || comp.RFC || comp.rfcCompany || comp.rfcEmpresa || '').toString().trim().toUpperCase();
          if (rfc) {
            this.rfcEmpresa = rfc;
            window.sessionStorage.setItem('rfcEmpresa', rfc);
          }
          const nombre = comp.nameCompany || comp.nombre || comp.razonSocial || comp.name || '';
          if (nombre) {
            this.nombreEmpresa = nombre;
            window.sessionStorage.setItem('nombreEmpresa', nombre);
          }
        }
      });
    }

    if (idCompany && idProject) {
      this.generalService.getproject(idCompany, idProject).subscribe((proj: any) => {
        if (proj) {
          this.projectData = proj;
          const rfcP = (proj.rfc || proj.RFC || proj.rfcProyecto || proj.rfcReceptor || '').toString().trim().toUpperCase();
          if (rfcP) {
            this.rfcProyecto = rfcP;
            window.sessionStorage.setItem('rfcProyecto', rfcP);
          }
          const nombreP = proj.nameProject || proj.nombreProyecto || proj.nombre || proj.name || '';
          if (nombreP) {
            this.nombreProyecto = nombreP;
            window.sessionStorage.setItem('nombreProyecto', nombreP);
          }
        }
      });
    }
  }

  getUser(idUser: string) {
    if (!idUser) return;
    // pdfMake.createPdf({}).open();
    this.generalService.getUserId(idUser).subscribe((res: any) => {
      if (!res) return;
      this.user = res;
      console.log('User', this.user);
      let recargarContexto = false;
      if (!this.idCompany && (res.empresa?.idCompany || res.idCompany)) {
        this.idCompany = res.empresa?.idCompany || res.idCompany || '';
        recargarContexto = true;
      }
      if (!this.idProject && (res.proyecto?.idProject || res.idProject)) {
        this.idProject = res.proyecto?.idProject || res.idProject || '';
        recargarContexto = true;
      }
      if (!this.nombreProyecto) {
        this.nombreProyecto = res.nombreProyecto || res.proyecto?.nameProject || res.proyecto?.nombre || '';
      }
      if (recargarContexto) {
        this.cargarDatosEmpresaYProyecto();
      }
      if (!this.nombreProyecto && this.idCompany && this.idProject) {
        this.generalService.getproject(this.idCompany, this.idProject).subscribe((proj: any) => {
          if (proj) {
            this.nombreProyecto = proj.nameProject || proj.nombreProyecto || proj.name || '';
            if (this.nombreProyecto) {
              window.sessionStorage.setItem('nombreProyecto', this.nombreProyecto);
            }
          }
        });
      }

      if (this.user.tipo === 'jefeDepartamento') {
        this.getOrdenes('departamento', this.user.depto);
      } else if (this.user.tipo === 'proveedor') {
        this.getOrdenes('rfc', this.user.rfc);
      } else if (this.user.tipo === 'admin') {
        this.getOrdenesAdmin();
      }
    });
  }

  getOrdenes(tipo: string, propiedad: string) {
    this.generalService
      .getOrdenes(this.idCompany, this.idProject, tipo, propiedad)
      .subscribe((orden: any) => {
        console.log(orden);
        this.totales = [];

        orden = orden.sort((a: any, b: any) => a.orderCounter - b.orderCounter);

        this.totales = [];
        this.arrOC = orden;
        this.generalService.calcularResumenPagos(this.arrOC, this.today);
        orden.forEach((element: any) => {
          let objTotales = {
            importe: 0,
            iva: 0,
            total: 0
          };
          element.comprometidos.forEach((comprometido: any, index: number) => {
            comprometido.id = 'OC-' + element.orderCounter + '-' + (index + 1);
            objTotales.importe += comprometido.importe;
            objTotales.iva += comprometido.iva;
            objTotales.total += comprometido.total;
          });
          this.totales.push(objTotales);
        });
        // filtrar las ordenes que su fecha de inicio no sea mayor a la fecha actual
        // console.log('Ordenes', this.arrOC);
      });
  }

  getOrdenesAdmin() {
    this.generalService
      .getOrdenesAdmin(this.idCompany, this.idProject)
      .subscribe((ordenes: any) => {
        // console.log(ordenes);
        this.totales = [];

        let ordenesFiltradas = ordenes.filter(
          (orden: any) => orden.rfc === this.rfcSeleccionado
        );

        // console.log('OC Filtradas', ordenesFiltradas);

        ordenesFiltradas = ordenesFiltradas.sort(
          (a: any, b: any) => a.orderCounter - b.orderCounter
        );

        ordenesFiltradas.forEach((element: any) => {
          let objTotales = {
            importe: 0,
            iva: 0,
            total: 0
          };
          element.comprometidos.forEach((comprometido: any, index: number) => {
            comprometido.id = 'OC-' + element.orderCounter + '-' + (index + 1);

            objTotales.importe += comprometido.importe;
            objTotales.iva += comprometido.iva;
            objTotales.total += comprometido.total;
          });
          this.totales.push(objTotales);
        });
        // filtrar las ordenes que su fecha de inicio no sea mayor a la fecha actual
        this.arrOC = ordenesFiltradas;
        this.generalService.calcularResumenPagos(this.arrOC, this.today);
        // console.log('Ordenes', this.arrOC);
      });
  }

  onFileChangeXML(ev: any, pago: any, orden: any) {
    for (let index = 0; index < ev.target.files.length; index++) {
      const archivo = ev.target.files[index];
      if (archivo.type === 'text/xml') {
        const lector = new FileReader();
        lector.onload = e => {
          this.xmlToJson(e, archivo, pago, orden);
        };
        lector.readAsText(archivo);
      } else {
        Notiflix.Notify.failure(
          `El archivo ${archivo.name} no es un archivo XML`
        );
      }
    }
  }

  xmlToJson(lector: any, file: any, pago: any, orden: any) {
    const res = lector.target.result;
    const parser = new DOMParser();
    const xml = parser.parseFromString(res, 'text/xml');
    const obj = this.ngxXml2jsonService.xmlToJson(xml);
    this.assignData(obj, file, pago, orden);
  }

  assignData(obj: any, file: any, pago: any, orden: any) {
    // console.log('XML', obj);
    if (obj['cfdi:Comprobante']) {
      // console.log(obj);
      // try {
      this.xml.asociado = false;
      this.xml.proveedor =
        obj['cfdi:Comprobante']['cfdi:Emisor']['@attributes'].Nombre;

      this.xml.rfc = obj['cfdi:Comprobante']['cfdi:Emisor']['@attributes'].Rfc;

      this.xml.regimen =
        obj['cfdi:Comprobante']['cfdi:Emisor']['@attributes'].RegimenFiscal;

      this.xml.rfcReceptor =
        obj['cfdi:Comprobante']['cfdi:Receptor']['@attributes'].Rfc;

      this.xml.tipoDeComprobante =
        obj['cfdi:Comprobante']['@attributes'].TipoDeComprobante;

      this.xml.formaPago =
        obj['cfdi:Comprobante']['@attributes'].FormaPago || '';

      this.xml.metodoPago =
        obj['cfdi:Comprobante']['@attributes'].MetodoPago || '';

      // Valido si es array o un objeto
      if (
        Array.isArray(
          obj['cfdi:Comprobante']['cfdi:Conceptos']['cfdi:Concepto']
        )
      ) {
        this.xml.concepto =
          obj['cfdi:Comprobante']['cfdi:Conceptos']['cfdi:Concepto'][0 || 1][
            '@attributes'
          ].Descripcion;

        this.xml.claveProdServ =
          obj['cfdi:Comprobante']['cfdi:Conceptos']['cfdi:Concepto'][0 || 1][
            '@attributes'
          ].ClaveProdServ;

        this.xml.claveUnidad =
          obj['cfdi:Comprobante']['cfdi:Conceptos']['cfdi:Concepto'][0 || 1][
            '@attributes'
          ].ClaveUnidad;
      } else {
        this.xml.concepto =
          obj['cfdi:Comprobante']['cfdi:Conceptos']['cfdi:Concepto'][
            '@attributes'
          ].Descripcion;

        this.xml.claveProdServ =
          obj['cfdi:Comprobante']['cfdi:Conceptos']['cfdi:Concepto'][
            '@attributes'
          ].ClaveProdServ;

        this.xml.claveUnidad =
          obj['cfdi:Comprobante']['cfdi:Conceptos']['cfdi:Concepto'][
            '@attributes'
          ].ClaveUnidad;
      }
      // -------------------------------------

      this.xml.folioComprobante =
        obj['cfdi:Comprobante']['cfdi:Complemento']['tfd:TimbreFiscalDigital'][
          '@attributes'
        ].UUID;

      this.xml.fecha = obj['cfdi:Comprobante']['@attributes'].Fecha;

      this.xml.subtotal = parseFloat(
        obj['cfdi:Comprobante']['@attributes'].SubTotal
      );

      this.xml.descuento =
        parseFloat(obj['cfdi:Comprobante']['@attributes'].Descuento) || 0;

      this.xml.tipoComprobante =
        obj['cfdi:Comprobante']['@attributes'].TipoDeComprobante;

      this.xml.metodoPago =
        obj['cfdi:Comprobante']['@attributes'].MetodoPago || '';

      this.xml.formaPago =
        obj['cfdi:Comprobante']['@attributes'].FormaPago || '';

      this.xml.usoCFDI =
        obj['cfdi:Comprobante']['cfdi:Receptor']['@attributes'].UsoCFDI;

      this.xml.moneda = obj['cfdi:Comprobante']['@attributes'].Moneda;

      this.xml.total = parseFloat(obj['cfdi:Comprobante']['@attributes'].Total);

      // Validacion si tiene impuestos
      if (obj['cfdi:Comprobante']['cfdi:Impuestos']) {
        // impuestos trasladados
        if (obj['cfdi:Comprobante']['cfdi:Impuestos']['cfdi:Traslados']) {
          const traslados =
            obj['cfdi:Comprobante']['cfdi:Impuestos']['cfdi:Traslados'][
            'cfdi:Traslado'
            ];
          const esArrayTraslados = Array.isArray(traslados);
          this.xml.iva = 0; // Inicializar iva a 0
          this.xml.otrasCont = 0; // Inicializar otrasCont a 0
          if (esArrayTraslados) {
            traslados.forEach(element => {
              if (element['@attributes'].Impuesto === '002') {
                this.xml.iva += parseFloat(element['@attributes'].Importe);
              } else if (element['@attributes'].Impuesto === '003') {
                this.xml.otrasCont = parseFloat(element['@attributes'].Importe);
              }
            });
          } else {
            this.xml.iva = parseFloat(traslados['@attributes'].Importe);
          }
        }

        // retenciones
        if (obj['cfdi:Comprobante']['cfdi:Impuestos']['cfdi:Retenciones']) {
          const retenciones =
            obj['cfdi:Comprobante']['cfdi:Impuestos']['cfdi:Retenciones'][
            'cfdi:Retencion'
            ];
          const esArrayRetenciones = Array.isArray(retenciones);
          if (esArrayRetenciones) {
            retenciones.forEach(element => {
              if (element['@attributes'].Impuesto === '002') {
                this.xml.retIVA = parseFloat(element['@attributes'].Importe);
              } else if (element['@attributes'].Impuesto === '001') {
                this.xml.retISR = parseFloat(element['@attributes'].Importe);
              }
            });
          } else {
            if (retenciones['@attributes'].Impuesto === '002') {
              this.xml.retIVA = parseFloat(retenciones['@attributes'].Importe);
            } else if (retenciones['@attributes'].Impuesto === '001') {
              this.xml.retISR = parseFloat(retenciones['@attributes'].Importe);
            }
          }
        }
      }
      // Aqui tenemos que mandar a llamar la funcion que validara los datos del CFDI
      console.log(this.user);
      const proyNombre = this.obtenerNombreProyecto(orden);
      const rfc = this.obtenerRFC(orden);
      this.xml.pathXML = `CFDIs_PROVEEDORES/${proyNombre}/${rfc}/${pago.id}/${this.xml.folioComprobante}.xml`;
      this.xml.inventario = 'No';
      this.xml.partida = 'PENDIENTE';
      this.xml.cargado = new Date();
      // console.log(this.xml);
      this.validaciones(this.xml, pago, file, orden);
    }
  }

  validaciones(xml: any, pago: any, file: any, orden: any) {
    // console.log(pago);
    this.arrErrorsXML = [];

    let validacion = true;

    // 1. Validar que el RFC emisor del XML coincida con el del proveedor
    const rfcEmisorXML = (xml.rfc || '').toString().trim().toUpperCase();
    const rfcProveedor = (this.obtenerRFC(orden) || '').toString().trim().toUpperCase();
    if (rfcProveedor && rfcEmisorXML !== rfcProveedor) {
      validacion = false;
      const mensaje = `El RFC emisor del CFDI (${rfcEmisorXML}) no coincide con el RFC del proveedor (${rfcProveedor}).`;
      this.arrErrorsXML.push(mensaje);
    }

    // 2. Validar que el RFC receptor del XML corresponda al del proyecto o empresa
    const rfcReceptorXML = (xml.rfcReceptor || this.xml.rfcReceptor || '').toString().trim().toUpperCase();
    const rfcsValidosReceptor = this.obtenerRFCsReceptoresValidos(orden);

    if (!rfcReceptorXML) {
      validacion = false;
      const mensaje = 'El CFDI no contiene un RFC receptor válido.';
      this.arrErrorsXML.push(mensaje);
    } else if (rfcsValidosReceptor.length > 0) {
      const coincideRFCReceptor = rfcsValidosReceptor.includes(rfcReceptorXML);
      if (!coincideRFCReceptor) {
        validacion = false;
        const nombreEntidad = this.obtenerNombreEmpresaOProyecto(orden);
        const rfcsEsperados = rfcsValidosReceptor.join(', ');
        const mensaje = `El RFC receptor del CFDI (${rfcReceptorXML}) no corresponde al RFC de la empresa o proyecto (${rfcsEsperados}${nombreEntidad ? ' - ' + nombreEntidad : ''}).`;
        this.arrErrorsXML.push(mensaje);
      }
    } else {
      console.warn('No se encontraron RFCs registrados de la empresa o proyecto para validar el receptor.');
    }

    // 3. Validar que el importe corresponda al mismo importe del pago pendiente
    const subtotalXML = Number(xml.subtotal) || 0;
    const totalXML = Number(xml.total) || 0;
    const importePago = Number(pago.importe) || 0;

    const diffSubtotal = Math.abs(subtotalXML - importePago);
    const diffTotal = Math.abs(totalXML - importePago);

    // Valida coincidencia con el importe del pago con tolerancia de $0.01 para evitar fallos de precisión en punto flotante
    if (diffSubtotal > 0.01 && diffTotal > 0.01) {
      validacion = false;
      const mensaje = `El importe del CFDI (${this.formatearMoneda(subtotalXML)}) no coincide con el importe del pago pendiente (${this.formatearMoneda(importePago)}).`;
      this.arrErrorsXML.push(mensaje);
    }

    // 4. Validar que el folio no exista en los archivos de la orden
    this.arrOC.forEach(element => {
      if (element.xml && element.xml.folioComprobante === xml.folioComprobante) {
        validacion = false;
        const mensaje = `El folio ${xml.folioComprobante} ya se encuentra cargado en esta orden u otra orden`;
        this.arrErrorsXML.push(mensaje);
      }
      // Aqui valido en los comprometidos de la orden actual
      element.comprometidos.forEach((elementComp: any) => {
        if (
          elementComp.xml &&
          elementComp.xml.folioComprobante === xml.folioComprobante
        ) {
          validacion = false;
          const mensaje = `El folio ${xml.folioComprobante} ya se encuentra cargado en otro pago`;
          this.arrErrorsXML.push(mensaje);
        }
      });
    });

    // 5. Tipo de comprobante (Ingreso)
    if (this.xml.tipoDeComprobante !== 'I') {
      validacion = false;
      const mensaje = `El tipo de comprobante debe ser Ingreso (I) y el CDFI es ${this.xml.tipoDeComprobante}`;
      this.arrErrorsXML.push(mensaje);
    }

    // 6. Validar que el uso de CFDI sea G03
    if (this.xml.usoCFDI !== 'G03') {
      validacion = false;
      const mensaje = `El uso de CFDI debe ser G03 y el XML es ${this.xml.usoCFDI}`;
      this.arrErrorsXML.push(mensaje);
    }

    // 7. Validar que la moneda sea igual al de la orden
    if (this.xml.moneda !== orden.moneda) {
      validacion = false;
      const mensaje = `La moneda del CFDI ${this.xml.moneda} no coincide con la moneda de la orden ${orden.moneda}`;
      this.arrErrorsXML.push(mensaje);
    }

    // 8. Validar que la forma de pago sea 03
    if (this.xml.formaPago !== '03') {
      validacion = false;
      const mensaje = `La forma de pago del CFDI ${this.xml.formaPago} no coincide con la forma de pago 03`;
      this.arrErrorsXML.push(mensaje);
    }

    // 9. Validar que el metodo de pago sea PUE
    if (this.xml.metodoPago !== 'PUE') {
      validacion = false;
      const mensaje = `El método de pago del CFDI ${this.xml.metodoPago} no coincide con el método de pago PUE`;
      this.arrErrorsXML.push(mensaje);
    }

    // -------------------------------

    if (validacion) {
      pago.xml = this.xml;
      this.updateOrderXML(file, pago);
    } else {
      this.xml = {} as any;
      delete pago.xml;
      const modal = <any>document.getElementById('errorXMLModal');
      new bootstrap.Modal(modal).show();
      Notiflix.Notify.failure('El CFDI no cumple con los requisitos');
    }
  }

  updateOrderXML(file: any, obj: any) {
    this.arrOC.forEach(element => {
      this.generalService
        .updateOrden(this.idCompany, this.idProject, element.id, {
          comprometidos: element.comprometidos
        })
        .then(() => {
          Notiflix.Notify.success('Se actualizo correctamente la orden');
          this.saveFilesXML(file, obj);
        });
    });
  }

  saveFilesXML(file: any, pago: any) {
    const proyNombre = this.obtenerNombreProyecto();
    const rfc = this.obtenerRFC();
    const filePath =
      pago.xml?.pathXML ||
      this.xml.pathXML ||
      `CFDIs_PROVEEDORES/${proyNombre}/${rfc}/${pago.id}/${this.xml.folioComprobante}.xml`;
    const path: any = {};
    path.pathImageProfile = filePath;
    const task = this.storage.upload(filePath, file);
    task.then(res => {
      Notiflix.Notify.success('Se guardo correctamente el archivo XML');
      this.xml = {} as any;
    });
  }

  onFileChangePDF(ev: any, pago: any) {
    const element = ev.target.files[0];
    const fileInput = element;
    const fileType = fileInput.type;
    const fileSize = fileInput.size;
    const allowedExtensions = /(.pdf)$/i;
    if (!allowedExtensions.exec(fileType) || fileSize >= 2000000) {
      alert(
        'Por favor agrega unicamente archivos con extension .pdf y tamaño maximo de 2MB '
      );
    } else {
      const proyNombre = this.obtenerNombreProyecto();
      const rfc = this.obtenerRFC();
      const filePath = `CFDIs_PROVEEDORES/${proyNombre}/${rfc}/${pago.id}/${element.name}`;
      pago.pathPDF = filePath;
      pago.cargadoPDF = new Date();
      const task = this.storage.upload(filePath, element);
      task.then(() => {
        Notiflix.Notify.success('Se guardo correctamente el PDF');
        this.updateOrderPDF();
      });
    }
  }

  updateOrderPDF() {
    this.arrOC.forEach(element => {
      this.generalService
        .updateOrden(this.idCompany, this.idProject, element.id, {
          comprometidos: element.comprometidos
        })
        .then(() => {
          Notiflix.Notify.success('Se actualizo correctamente la orden');
        });
    });
  }

  downloadFile(path: any) {
    this.storage
      .ref(path)
      .getDownloadURL()
      .subscribe(url => {
        window.open(url, '_blank');
      });
  }

  deleteFile(pago: any, tipo: string) {
    Notiflix.Confirm.show(
      'Eliminar archivo',
      '¿Estás seguro de eliminar este archivo?',
      'Sí',
      'No',
      () => {
        if (tipo === 'PDF') {
          this.storage
            .ref(pago.pathPDF)
            .delete()
            .subscribe(() => {
              Notiflix.Notify.success('Se elimino correctamente el archivo');
            });
          delete pago.pathPDF;
          delete pago.aprobadoPDF;
          delete pago.motivoPDF;
          delete pago.cargadoPDF;
        } else if (tipo === 'XML') {
          this.storage
            .ref(pago.xml.pathXML)
            .delete()
            .subscribe(() => {
              Notiflix.Notify.success('Se elimino correctamente el archivo');
            });
          delete pago.pathXML;
          delete pago.xml;
          delete pago.aprobadoXML;
          delete pago.motivoXML;
          delete pago.cargadoXML;
        }
        //
        this.updateOrderPDF();
      },
      () => { }
    );
  }

  convertirAFecha(fechaString: string): Date {
    const date = new Date(fechaString); // Agrega una hora para evitar problemas de zona horaria
    return date;
  }

  ultimoViernes(fecha: string): Date {
    const fechaDate = this.convertirAFecha(fecha);
    // Obtener el ultimo viernes del mes de la fecha dada
    const diaSemana = fechaDate.getDay(); // 0 (Domingo) a 6 (Sábado)
    const diasParaViernes = (diaSemana + 2) % 7; // Días para retroceder al viernes
    fechaDate.setDate(fechaDate.getDate() - diasParaViernes);
    const ultimoViernes = new Date(fechaDate);
    // console.log(ultimoViernes);
    return ultimoViernes;
  }

  fechaFinal(fecha: string): Date {
    const ultimoViernes = this.ultimoViernes(fecha);
    // Restar 3 días
    const tresDiasAntes = new Date(ultimoViernes);
    tresDiasAntes.setDate(ultimoViernes.getDate() - 3);
    const primerDiaDelMes = new Date(
      ultimoViernes.getFullYear(),
      ultimoViernes.getMonth(),
      1
    );

    if (tresDiasAntes.getMonth() !== ultimoViernes.getMonth()) {
      tresDiasAntes.setTime(primerDiaDelMes.getTime());
    }

    tresDiasAntes.setHours(23, 59, 59, 999);
    return tresDiasAntes;
  }

  fechaInicial(fecha: string): Date {
    const ultimoViernes = this.fechaFinal(fecha);

    // restar 10 días al último viernes siempre y cuando no se pase al mes anterior
    const onceDiasAntes = new Date(ultimoViernes);
    onceDiasAntes.setDate(ultimoViernes.getDate() - 10);
    const primerDiaDelMes = new Date(
      ultimoViernes.getFullYear(),
      ultimoViernes.getMonth(),
      1
    );
    if (onceDiasAntes.getMonth() !== ultimoViernes.getMonth()) {
      onceDiasAntes.setTime(primerDiaDelMes.getTime());
    }

    onceDiasAntes.setHours(0, 0, 0, 0);
    return onceDiasAntes;
  }

  estatus(pago: any): string {
    return this.generalService.estatusPago(pago, this.today);
  }

  obtenerNombreProyecto(orden?: any): string {
    return (
      this.nombreProyecto ||
      this.projectData?.nameProject ||
      this.projectData?.nombreProyecto ||
      this.projectData?.nombre ||
      this.projectData?.name ||
      window.sessionStorage.getItem('nombreProyecto') ||
      orden?.nombreProyecto ||
      orden?.nameProject ||
      this.user?.nombreProyecto ||
      this.user?.proyecto?.nameProject ||
      this.user?.proyecto?.nombreProyecto ||
      this.idProject ||
      'Proyecto'
    );
  }

  obtenerNombreEmpresa(orden?: any): string {
    return (
      this.nombreEmpresa ||
      this.companyData?.nameCompany ||
      this.companyData?.nombre ||
      this.companyData?.razonSocial ||
      this.companyData?.name ||
      window.sessionStorage.getItem('nombreEmpresa') ||
      orden?.nombreEmpresa ||
      orden?.filmadora?.name ||
      this.user?.nombreEmpresa ||
      this.user?.empresa?.nameCompany ||
      this.user?.empresa?.nombre ||
      ''
    );
  }

  obtenerNombreEmpresaOProyecto(orden?: any): string {
    return (
      orden?.filmadora?.name ||
      this.obtenerNombreProyecto(orden) ||
      this.obtenerNombreEmpresa(orden) ||
      ''
    );
  }

  obtenerRFC(orden?: any): string {
    return (
      orden?.rfc ||
      this.user?.rfc ||
      this.rfcSeleccionado ||
      'PROV'
    );
  }

  obtenerRFCsReceptoresValidos(orden?: any): string[] {
    const rfcs = new Set<string>();

    const agregar = (val: any) => {
      if (val && typeof val === 'string') {
        const limpio = val.trim().toUpperCase();
        if (limpio.length >= 9 && limpio.length <= 14) {
          rfcs.add(limpio);
        }
      }
    };

    // 1. De la orden de compra (filmadora seleccionada al crear la OC)
    if (orden) {
      agregar(orden.filmadora?.rfc);
      agregar(orden.filmadora?.RFC);
      agregar(orden.rfcReceptor);
      agregar(orden.rfcEmpresa);
      agregar(orden.rfcFilmadora);
      agregar(orden.empresa?.rfc);
      agregar(orden.empresa?.RFC);
      agregar(orden.proyecto?.rfc);
      agregar(orden.proyecto?.RFC);
    }

    // 2. De la empresa cargada de Firestore
    if (this.companyData) {
      agregar(this.companyData.rfc);
      agregar(this.companyData.RFC);
      agregar(this.companyData.rfcCompany);
      agregar(this.companyData.rfcEmpresa);
      if (Array.isArray(this.companyData.filmadoras)) {
        this.companyData.filmadoras.forEach((f: any) => {
          agregar(f?.rfc);
          agregar(f?.RFC);
        });
      }
    }

    // 3. Del proyecto cargado de Firestore
    if (this.projectData) {
      agregar(this.projectData.rfc);
      agregar(this.projectData.RFC);
      agregar(this.projectData.rfcProyecto);
      agregar(this.projectData.rfcReceptor);
      if (Array.isArray(this.projectData.filmadoras)) {
        this.projectData.filmadoras.forEach((f: any) => {
          agregar(f?.rfc);
          agregar(f?.RFC);
        });
      }
    }

    // 4. Variables de sesión / usuario
    agregar(this.rfcEmpresa);
    agregar(this.rfcProyecto);
    if (this.user) {
      agregar(this.user.empresa?.rfc);
      agregar(this.user.empresa?.RFC);
      agregar(this.user.proyecto?.rfc);
      agregar(this.user.proyecto?.RFC);
      if (Array.isArray(this.user.empresas)) {
        this.user.empresas.forEach((e: any) => {
          agregar(e?.rfc);
          agregar(e?.RFC);
        });
      }
    }

    // 5. De sessionStorage
    agregar(window.sessionStorage.getItem('rfcEmpresa'));
    agregar(window.sessionStorage.getItem('rfcProyecto'));
    try {
      const projRaw = window.sessionStorage.getItem('projectSelected');
      if (projRaw) {
        const p = JSON.parse(projRaw);
        agregar(p.rfc);
        agregar(p.RFC);
        agregar(p.rfcEmpresa);
        agregar(p.rfcProyecto);
        agregar(p.rfcReceptor);
        agregar(p.filmadora?.rfc);
        agregar(p.empresa?.rfc);
        agregar(p.proyecto?.rfc);
      }
    } catch (e) {
      // Ignorar si no es JSON válido
    }

    return Array.from(rfcs);
  }

  formatearMoneda(valor: number): string {
    return (valor || 0).toLocaleString('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  ngOnDestroy(): void { }
}
