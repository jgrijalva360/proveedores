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

  constructor(
    private generalService: GeneralService,
    private ngxXml2jsonService: NgxXml2jsonService,
    public storage: AngularFireStorage,
    private router: Router
  ) {}

  ngOnInit(): void {
    console.log('Se inicia order');
    const rfc = this.router.url.split('/')[2];
    this.rfcSeleccionado = rfc;

    this.idUser = window.sessionStorage.getItem('id') || '';

    // this.today = new Date('2025-10-18T15:00:00'); // Solo para pruebas
    this.today = new Date(); // Fecha actual
    this.getUser(this.idUser);
  }

  getUser(idUser: string) {
    // pdfMake.createPdf({}).open();
    this.generalService.getUserId(idUser).subscribe((res: any) => {
      this.user = res;
      console.log('User', this.user);
      this.idCompany = res.empresa.idCompany;
      this.idProject = res.proyecto.idProject;

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
      this.xml.pathXML = `CFDIs/${this.user.proyecto.nameProject}/${this.user.departamento.name}/${this.user.rfc}/${pago.id}/${this.xml.folioComprobante}.xml`;
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
    // Validar que el RFC del XML sea igual al del proveedor
    if (xml.rfc !== this.user.rfc) {
      validacion = false;
      const mensaje = `El RFC del CFDI ${xml.rfc} no coincide con el RFC del proveedor ${this.user.rfc}`;
      // Notiflix.Notify.failure(mensaje);
      this.arrErrorsXML.push(mensaje);
    }

    // Validar que el importe no sea mayor al comprometido
    if (xml.subtotal !== pago.importe) {
      validacion = false;
      const mensaje = `El importe del CFDI ${xml.subtotal} no coincide con el importe comprometido ${pago.importe}`;
      // Notiflix.Notify.failure(mensaje);
      this.arrErrorsXML.push(mensaje);
    }
    // Validar que el folio no exista en los archivos de la orden
    // Aqui valido en la orden actual
    this.arrOC.forEach(element => {
      if (element.xml.folioComprobante === xml.folioComprobante) {
        validacion = false;
        const mensaje = `El folio ${xml.folioComprobante} ya se encuentra cargado en esta orden u otra orden`;
        // Notiflix.Notify.failure(mensaje);
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
          // Notiflix.Notify.failure(mensaje);
          this.arrErrorsXML.push(mensaje);
        }
      });
    });

    // Valido los datos del XML
    // Tipo de comprobante (Ingreso)
    if (this.xml.tipoDeComprobante !== 'I') {
      validacion = false;
      const mensaje = `El tipo de comprobante debe ser Ingreso (I) y el CDFI es ${this.xml.tipoDeComprobante}`;
      // Notiflix.Notify.failure(mensaje);
      this.arrErrorsXML.push(mensaje);
    }

    // Mes y año del XML debe coincidir con el mes y año del pago
    // Esta deshabilitado para hacer pruebas con archivos de otros años
    // if (
    //   this.convertirAFecha(this.xml.fecha).getMonth() !==
    //     this.convertirAFecha(pago.fechaInicio).getMonth() ||
    //   (this.convertirAFecha(this.xml.fecha).getMonth() !==
    //     this.convertirAFecha(pago.fechaFin).getMonth() &&
    //     this.convertirAFecha(this.xml.fecha).getFullYear() !==
    //       this.convertirAFecha(pago.fechaInicio).getFullYear()) ||
    //   this.convertirAFecha(this.xml.fecha).getFullYear() !==
    //     this.convertirAFecha(pago.fechaFin).getFullYear()
    // ) {
    //   validacion = false;
    //   const mensaje = `El mes y año del CFDI debe coincidir con el pago ${this.convertirAFecha(
    //     pago.fechaInicio
    //   ).toLocaleDateString('es-MX', {
    //     month: 'long',
    //     year: 'numeric',
    //   })} y el XML es ${this.convertirAFecha(this.xml.fecha).toLocaleDateString(
    //     'es-MX',
    //     { month: 'long', year: 'numeric' }
    //   )}`;
    //   this.arrErrorsXML.push(mensaje);
    // }

    // Validar que el uso de CFDI sea G03
    if (this.xml.usoCFDI !== 'G03') {
      validacion = false;
      const mensaje = `El uso de CFDI debe ser G03 y el XML es ${this.xml.usoCFDI}`;
      // Notiflix.Notify.failure(mensaje);
      this.arrErrorsXML.push(mensaje);
    }

    // Validar que el RFC receptor sea igual al de la empresa
    // if (this.xml.rfcReceptor !== this.user.empresa.rfc) {
    //   validacion = false;
    //   const mensaje = `El RFC receptor del CFDI ${this.xml.rfcReceptor} no coincide con el RFC de la empresa ${this.user.empresa.rfc}`;
    //   // Notiflix.Notify.failure(mensaje);
    //   this.arrErrorsXML.push(mensaje);
    // }

    // Validar que la moneda sea igual al de la orden
    if (this.xml.moneda !== orden.moneda) {
      validacion = false;
      const mensaje = `La moneda del CFDI ${this.xml.moneda} no coincide con la moneda de la orden ${orden.moneda}`;
      // Notiflix.Notify.failure(mensaje);
      this.arrErrorsXML.push(mensaje);
    }

    // Validar que la forma de pago sea 03
    if (this.xml.formaPago !== '03') {
      validacion = false;
      const mensaje = `La forma de pago del CFDI ${this.xml.formaPago} no coincide con la forma de pago 03`;
      // Notiflix.Notify.failure(mensaje);
      this.arrErrorsXML.push(mensaje);
    }

    // Validar que el metodo de pago sea PUE
    if (this.xml.metodoPago !== 'PUE') {
      validacion = false;
      const mensaje = `El método de pago del CFDI ${this.xml.metodoPago} no coincide con el método de pago PUE`;
      // Notiflix.Notify.failure(mensaje);
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
    const filePath = `CFDIs/${this.user.proyecto.nameProject}/${this.user.departamento.name}/${this.user.rfc}/${pago.id}/${this.xml.folioComprobante}.xml`;
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
      const filePath = `CFDIs/${this.user.proyecto.nameProject}/${this.user.departamento.name}/${this.user.rfc}/${pago.id}/${element.name}`;
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
      () => {}
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
    if (
      this.today > this.fechaFinal(pago.fechaFin) &&
      !pago.xml &&
      !pago.pathPDF
    ) {
      return 'VENCIDO';
    }

    if (
      pago.xml &&
      pago.pathPDF &&
      (pago.aprobadoXML === undefined || pago.aprobadoPDF === undefined)
    ) {
      return 'EN REVISION';
    }

    if (pago.aprobadoXML && pago.aprobadoPDF) {
      return 'EN PROCESO DE PAGO';
    }

    if (pago.aprobadoXML && pago.aprobadoPDF && pago.estatus === 'Pagado') {
      return 'PAGADO';
    }

    if ((!pago.aprobadoXML || !pago.aprobadoPDF) && pago.xml && pago.pathPDF) {
      return 'RECHAZADO';
    }

    if (
      (!pago.xml || !pago.pathPDF) &&
      this.today >= this.fechaInicial(pago.fechaFin)
    ) {
      return 'PENDIENTE';
    }

    if (
      !pago.xml &&
      !pago.pathPDF &&
      this.today <= this.fechaInicial(pago.fechaFin)
    ) {
      return 'PRÓXIMO';
    }
    return '';
  }

  ngOnDestroy(): void {}
}
