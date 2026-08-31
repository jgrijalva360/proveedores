import { Component, OnInit, OnDestroy } from '@angular/core';
import { GeneralService } from 'src/app/services/general.service';
import { NgxXml2jsonService } from 'ngx-xml2json';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import * as Notiflix from 'notiflix';
import { Subscription } from 'rxjs';

declare var bootstrap: any;

@Component({
  selector: 'app-comprobaciones',
  templateUrl: './comprobaciones.component.html',
  styleUrls: ['./comprobaciones.component.css']
})
export class ComprobacionesComponent implements OnInit, OnDestroy {
  idUser: string = '';
  user: any = {};
  idCompany: string = '';
  idProject: string = '';
  nombreProyecto: string = '';

  solicitudesGXC: any[] = [];
  solicitudSeleccionada: any = null;
  cargando: boolean = true;
  arrErrorsXML: string[] = [];

  // Totales
  totalOtorgado: number = 0;
  totalComprobado: number = 0;
  saldoDisponible: number = 0;

  private subscriptionUser: Subscription | undefined;
  private subscriptionGXC: Subscription | undefined;

  constructor(
    private generalService: GeneralService,
    private ngxXml2jsonService: NgxXml2jsonService,
    public storage: AngularFireStorage
  ) {}

  ngOnInit(): void {
    this.idUser = window.sessionStorage.getItem('id') || '';
    this.idCompany = window.sessionStorage.getItem('idCompany') || '';
    this.idProject = window.sessionStorage.getItem('idProject') || '';
    this.nombreProyecto = window.sessionStorage.getItem('nombreProyecto') || 'Proyecto';

    if (this.idUser) {
      this.getUserData();
    }
  }

  getUserData(): void {
    this.cargando = true;
    this.subscriptionUser = this.generalService
      .getUserId(this.idUser)
      .subscribe((res: any) => {
        if (!res) return;
        this.user = res;
        if (!this.idCompany && res.empresa?.idCompany) {
          this.idCompany = res.empresa.idCompany;
        }
        if (!this.idProject && res.proyecto?.idProject) {
          this.idProject = res.proyecto.idProject;
        }
        this.cargarSolicitudesGXC();
      });
  }

  cargarSolicitudesGXC(): void {
    if (!this.idCompany || !this.idProject || !this.user.rfc) {
      this.cargando = false;
      return;
    }

    this.subscriptionGXC = this.generalService
      .getSolicitudesGXC(this.idCompany, this.idProject, this.user.rfc)
      .subscribe((solicitudes: any[]) => {
        this.solicitudesGXC = solicitudes;
        this.calcularResumenGXC();
        this.cargando = false;
      });
  }

  calcularResumenGXC(): void {
    this.totalOtorgado = 0;
    this.totalComprobado = 0;

    this.solicitudesGXC.forEach((sol) => {
      this.totalOtorgado += sol.importe || sol.total || 0;
      if (sol.arrXML && Array.isArray(sol.arrXML)) {
        sol.arrXML.forEach((xml: any) => {
          this.totalComprobado += xml.total || xml.importe || 0;
        });
      }
    });

    this.saldoDisponible = this.totalOtorgado - this.totalComprobado;
  }

  seleccionarSolicitud(sol: any): void {
    this.solicitudSeleccionada = sol;
    if (!this.solicitudSeleccionada.arrXML) {
      this.solicitudSeleccionada.arrXML = [];
    }
  }

  onFileChangeXML(ev: any): void {
    if (!this.solicitudSeleccionada) {
      Notiflix.Notify.warning('Primero selecciona una solicitud GXC.');
      return;
    }

    const files: FileList = ev.target.files;
    for (let index = 0; index < files.length; index++) {
      const archivo = files[index];
      if (archivo.type === 'text/xml' || archivo.name.endsWith('.xml')) {
        const lector = new FileReader();
        lector.onload = (e: any) => {
          this.procesarXML(e, archivo);
        };
        lector.readAsText(archivo);
      } else {
        Notiflix.Notify.failure(`El archivo ${archivo.name} no es un archivo XML válido.`);
      }
    }
  }

  procesarXML(lector: any, file: File): void {
    const res = lector.target.result;
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(res, 'text/xml');
    const obj = this.ngxXml2jsonService.xmlToJson(xmlDoc);

    const parsedXML = this.extraerDatosCFDI(obj);
    if (!parsedXML) {
      Notiflix.Notify.failure('El archivo XML no tiene formato de CFDI válido.');
      return;
    }

    const esValido = this.validarCFDI(parsedXML);
    if (esValido) {
      this.guardarComprobanteXML(file, parsedXML);
    } else {
      const modalEl = document.getElementById('errorGXCModal');
      if (modalEl) {
        new bootstrap.Modal(modalEl).show();
      }
    }
  }

  extraerDatosCFDI(obj: any): any {
    const root = obj['cfdi:Comprobante'];
    if (!root) return null;

    const emisor = root['cfdi:Emisor'] ? root['cfdi:Emisor']['@attributes'] : {};
    const receptor = root['cfdi:Receptor'] ? root['cfdi:Receptor']['@attributes'] : {};
    const timbre = root['cfdi:Complemento']?.['tfd:TimbreFiscalDigital']?.['@attributes'] || {};
    const attrs = root['@attributes'] || {};

    let iva = 0;
    let retIVA = 0;
    let retISR = 0;

    if (root['cfdi:Impuestos']) {
      // Traslados
      if (root['cfdi:Impuestos']['cfdi:Traslados']) {
        const traslados = root['cfdi:Impuestos']['cfdi:Traslados']['cfdi:Traslado'];
        const arrTraslados = Array.isArray(traslados) ? traslados : [traslados];
        arrTraslados.forEach((t: any) => {
          if (t && t['@attributes']) {
            if (t['@attributes'].Impuesto === '002') {
              iva += parseFloat(t['@attributes'].Importe || 0);
            }
          }
        });
      }

      // Retenciones
      if (root['cfdi:Impuestos']['cfdi:Retenciones']) {
        const retenciones = root['cfdi:Impuestos']['cfdi:Retenciones']['cfdi:Retencion'];
        const arrRet = Array.isArray(retenciones) ? retenciones : [retenciones];
        arrRet.forEach((r: any) => {
          if (r && r['@attributes']) {
            if (r['@attributes'].Impuesto === '002') {
              retIVA += parseFloat(r['@attributes'].Importe || 0);
            } else if (r['@attributes'].Impuesto === '001') {
              retISR += parseFloat(r['@attributes'].Importe || 0);
            }
          }
        });
      }
    }

    return {
      uuid: timbre.UUID || attrs.Folio || '',
      rfcEmisor: emisor.Rfc || '',
      nombreEmisor: emisor.Nombre || '',
      rfcReceptor: receptor.Rfc || '',
      subtotal: parseFloat(attrs.SubTotal || 0),
      total: parseFloat(attrs.Total || 0),
      fecha: attrs.Fecha || new Date().toISOString(),
      tipoDeComprobante: attrs.TipoDeComprobante || 'I',
      metodoPago: attrs.MetodoPago || '',
      formaPago: attrs.FormaPago || '',
      moneda: attrs.Moneda || 'MXN',
      iva,
      retIVA,
      retISR,
      fechaCargado: new Date().toISOString(),
      aprobado: false,
    };
  }

  validarCFDI(cfdi: any): boolean {
    this.arrErrorsXML = [];
    let valido = true;

    // Validar UUID duplicado en la solicitud actual
    const existeEnSolicitud = this.solicitudSeleccionada.arrXML?.some(
      (x: any) => x.uuid === cfdi.uuid
    );
    if (existeEnSolicitud) {
      valido = false;
      this.arrErrorsXML.push(`El folio UUID ${cfdi.uuid} ya está agregado a esta solicitud.`);
    }

    // Validar tipo de comprobante
    if (cfdi.tipoDeComprobante !== 'I' && cfdi.tipoDeComprobante !== 'E') {
      valido = false;
      this.arrErrorsXML.push(`El tipo de comprobante debe ser Ingreso (I) o Egreso (E). Actual: ${cfdi.tipoDeComprobante}`);
    }

    return valido;
  }

  guardarComprobanteXML(file: File, cfdi: any): void {
    const filePath = `GXC/${this.nombreProyecto}/${this.user.rfc}/${this.solicitudSeleccionada.id}/${cfdi.uuid}.xml`;
    cfdi.pathXML = filePath;

    Notiflix.Loading.circle('Subiendo comprobante XML...');
    this.storage
      .upload(filePath, file)
      .then(() => {
        if (!this.solicitudSeleccionada.arrXML) {
          this.solicitudSeleccionada.arrXML = [];
        }
        this.solicitudSeleccionada.arrXML.push(cfdi);

        // Actualizar en Firestore
        this.generalService
          .updateSolicitud(this.idCompany, this.idProject, this.solicitudSeleccionada.id, {
            arrXML: this.solicitudSeleccionada.arrXML
          })
          .then(() => {
            Notiflix.Loading.remove();
            Notiflix.Notify.success('Comprobante XML agregado correctamente.');
            this.calcularResumenGXC();
          })
          .catch((err) => {
            Notiflix.Loading.remove();
            Notiflix.Notify.failure('Error al guardar en base de datos: ' + err.message);
          });
      })
      .catch((err) => {
        Notiflix.Loading.remove();
        Notiflix.Notify.failure('Error al subir archivo a Storage: ' + err.message);
      });
  }

  onFileChangePDF(ev: any, cfdi: any): void {
    const file = ev.target.files[0];
    if (!file || !file.name.toLowerCase().endsWith('.pdf')) {
      Notiflix.Notify.failure('Selecciona un archivo PDF válido.');
      return;
    }

    const filePath = `GXC/${this.nombreProyecto}/${this.user.rfc}/${this.solicitudSeleccionada.id}/${cfdi.uuid}.pdf`;
    Notiflix.Loading.circle('Subiendo PDF adjunto...');
    this.storage
      .upload(filePath, file)
      .then(() => {
        cfdi.pathPDF = filePath;
        cfdi.cargadoPDF = new Date().toISOString();

        this.generalService
          .updateSolicitud(this.idCompany, this.idProject, this.solicitudSeleccionada.id, {
            arrXML: this.solicitudSeleccionada.arrXML
          })
          .then(() => {
            Notiflix.Loading.remove();
            Notiflix.Notify.success('Archivo PDF asociado con éxito.');
          });
      })
      .catch((err) => {
        Notiflix.Loading.remove();
        Notiflix.Notify.failure('Error al subir PDF: ' + err.message);
      });
  }

  eliminarComprobante(cfdi: any): void {
    Notiflix.Confirm.show(
      'Eliminar Comprobante',
      `¿Deseas eliminar el comprobante ${cfdi.uuid || 'seleccionado'}?`,
      'Sí, eliminar',
      'Cancelar',
      () => {
        this.solicitudSeleccionada.arrXML = this.solicitudSeleccionada.arrXML.filter(
          (x: any) => x.uuid !== cfdi.uuid
        );

        this.generalService
          .updateSolicitud(this.idCompany, this.idProject, this.solicitudSeleccionada.id, {
            arrXML: this.solicitudSeleccionada.arrXML
          })
          .then(() => {
            Notiflix.Notify.success('Comprobante eliminado.');
            this.calcularResumenGXC();
          });
      }
    );
  }

  descargarArchivo(path: string): void {
    if (!path) return;
    this.storage
      .ref(path)
      .getDownloadURL()
      .subscribe((url) => {
        window.open(url, '_blank');
      });
  }

  ngOnDestroy(): void {
    this.subscriptionUser?.unsubscribe();
    this.subscriptionGXC?.unsubscribe();
  }
}
