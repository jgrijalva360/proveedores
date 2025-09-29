import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { NgxXml2jsonService } from 'ngx-xml2json';
import * as Notiflix from 'notiflix';
import { GeneralService } from 'src/app/services/general.service';
import { AngularFireStorage } from '@angular/fire/compat/storage';

import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const EXCEL_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
const EXCEL_EXTENSION = '.xlsx';

@Component({
  selector: 'app-importador',
  templateUrl: './importador.component.html',
  styleUrls: ['./importador.component.css'],
})
export class ImportadorComponent implements OnInit, OnDestroy {
  xml = {} as any;
  arrXML = [] as any;
  arrFilesXml = [] as any;
  arrFilesPdf = [] as any;
  project = {} as any;
  userDB = {} as any;
  idUser = '';
  sobre = 0;
  arrSobres = [] as any;

  objDocumento = {} as any;

  public rfcReceptor = '';

  public isProject = false;

  @Input() dato: string = '';

  getXMLSubscription: Subscription | undefined;
  getCompanySubscription: Subscription | undefined;
  subscriberGetProject: Subscription | undefined;

  constructor(
    private router: Router,
    private generalService: GeneralService,
    private ngxXml2jsonService: NgxXml2jsonService,
    public storage: AngularFireStorage
  ) {}

  ngOnInit(): void {
    const url = this.router.parseUrl(this.router.url);
    this.idUser = window.sessionStorage.getItem('id') || '';
    this.getUser(this.idUser);
  }

  getUser(idUser: string) {
    this.generalService.getUserId(idUser).subscribe((res: any) => {
      console.log(res);
      this.userDB = res;

      this.rfcReceptor = res.empresa.rfc;
      if (res.sobre) {
        this.sobre = res.sobre + 1;
      } else {
        this.sobre = 1;
      }
    });
  }

  // Agregar inventario Si/No Default NO
  // Agregar partida presupuestal solo del grupo de partidas o partida predefinida
  // Folio egreso los primeros (5) dígitos del Folio
  // Que el usuario pueda genera PDF y Excel
  // Sección de deducible y no deducible
  //

  onFileChange(ev: any) {
    for (let index = 0; index < ev.target.files.length; index++) {
      const archivo = ev.target.files[index];
      if (archivo.type === 'text/xml') {
        const lector = new FileReader();
        lector.onload = (e) => {
          this.xmlToJson(e, archivo);
        };
        lector.readAsText(archivo);
      } else {
        Notiflix.Notify.failure(
          `El archivo ${archivo.name} no es un archivo XML`
        );
      }
    }
    (<any>document.getElementById('formFileXML')).value = '';
  }

  xmlToJson(lector: any, file: any) {
    const res = lector.target.result;
    const parser = new DOMParser();
    const xml = parser.parseFromString(res, 'text/xml');
    const obj = this.ngxXml2jsonService.xmlToJson(xml);
    this.validarSiExiste(obj, file);
  }

  validarSiExiste(obj: any, file: any) {
    const folio =
      obj['cfdi:Comprobante']['cfdi:Complemento']['tfd:TimbreFiscalDigital'][
        '@attributes'
      ].UUID;
    let validacion = this.arrXML.findIndex(
      (element: any) => element.folioComprobante === folio
    );

    if (this.userDB.xml) {
      validacion = this.userDB.xml.findIndex(
        (element: any) => element.folioComprobante === folio
      );
    }

    if (validacion === -1) {
      if (
        obj['cfdi:Comprobante']['cfdi:Receptor'][
          '@attributes'
        ].Rfc.toUpperCase() === this.rfcReceptor.toUpperCase() &&
        this.isProject
      ) {
        this.assignData(obj, file);
      } else if (!this.isProject) {
        this.assignData(obj, file);
      } else if (
        obj['cfdi:Comprobante']['cfdi:Receptor'][
          '@attributes'
        ].Rfc.toUpperCase() !== this.rfcReceptor.toUpperCase() &&
        this.isProject
      ) {
        if (this.project.filmadoras) {
          this.project.filmadoras.forEach((element: any) => {
            if (
              obj['cfdi:Comprobante']['cfdi:Receptor'][
                '@attributes'
              ].Rfc.toUpperCase() === element.rfc
            ) {
              this.assignData(obj, file);
            }
          });
        }
      }
    } else if (validacion > -1) {
      Notiflix.Notify.failure(`El folio ${folio} ya se encuentra cargado.`);
    }
  }

  assignData(obj: any, file: any) {
    console.log(obj);
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
            traslados.forEach((element) => {
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
            retenciones.forEach((element) => {
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
      this.xml.pathXML = `CFDIs/${this.userDB.proyecto.nameProject}/${this.userDB.departamento.name}/XML/${file.name}`;
      this.xml.sobre = this.sobre;
      this.xml.inventario = 'No';
      this.xml.partida = 'PENDIENTE';
      this.arrXML.push(this.xml);
      this.arrFilesXml.push(file);
      this.xml = {};
      // } catch (error) {
      // console.error('Ocurrio un error');
      // }
    }
  }

  saveFilesXML() {
    for (let index = 0; index < this.arrFilesXml.length; index++) {
      const element = this.arrFilesXml[index];
      const filePath = `CFDIs/${this.userDB.proyecto.nameProject}/${this.userDB.departamento.name}/XML/${element.name}`;
      const path: any = {};
      path.pathImageProfile = filePath;
      const task = this.storage.upload(filePath, element);
      task.then((res) => {
        console.log(res);
        // Notiflix.Notify.success('Se guardo correctamente el XML');
      });
      // task.snapshotChanges().subscribe((res: any) => {
      //   console.log(res);
      //   Notiflix.Notify.success('Se guardo correctamente el PDF');
      // });
    }
  }

  uploadFilePDF(event: any) {
    for (let index = 0; index < event.target.files.length; index++) {
      const element = event.target.files[index];
      const fileInput = element;
      const fileType = fileInput.type;
      const fileSize = fileInput.size;
      const allowedExtensions = /(.pdf)$/i;
      if (!allowedExtensions.exec(fileType) || fileSize >= 2000000) {
        alert(
          'Por favor agrega unicamente archivos con extension .pdf y tamaño maximo de 2MB '
        );
        // (<any>document.getElementById('inputGroupFile01')).value = '';
      } else {
        console.log(element.name);
        const XMLEncontrado = this.arrXML.find(
          (XML: any) =>
            XML.folioComprobante.toUpperCase() ===
            element.name.split('.')[0].toUpperCase()
        );
        if (XMLEncontrado) {
          const filePath = `CFDIs/${this.userDB.proyecto.nameProject}/${this.userDB.departamento.name}/PDF/${element.name}`;
          XMLEncontrado.pathPDF = filePath;
          this.arrFilesPdf.push(element);
        }
      }
    }
  }

  saveFilesPDF() {
    for (let index = 0; index < this.arrFilesPdf.length; index++) {
      const element = this.arrFilesPdf[index];
      const filePath = `CFDIs/${this.userDB.proyecto.nameProject}/${this.userDB.departamento.name}/PDF/${element.name}`;
      const path: any = {};
      path.pathImageProfile = filePath;
      const task = this.storage.upload(filePath, element);
      task.then((res) => {
        console.log(res);
        // Notiflix.Notify.success('Se guardo correctamente el PDF');
      });
    }
  }

  guardarTodo() {
    console.log(this.arrXML);
    let validacion = true;
    if (this.arrXML.length === 0) {
      Notiflix.Report.failure(
        'No hay XML',
        'No hay XML para guardar, por favor agrega al menos un XML',
        'Ok'
      );
      return;
    } else {
      this.arrXML.forEach((element: any) => {
        if (element.partida === 'PENDIENTE') {
          validacion = false;
        }
      });
    }

    if (validacion) {
      this.saveFilesXML();
      this.saveFilesPDF();
      const arrConcat = this.userDB.xml.concat(this.arrXML);
      this.generalService
        .updateUser(this.idUser, this.sobre, arrConcat)
        .then((res) => {
          console.log(res);
          this.arrXML = [] as any;
        })
        .catch((error) => {
          Notiflix.Report.failure(
            'Ocurrió un error',
            'Ocurrió un error al guardar la lista de XML, comunícate con soporte técnico',
            'Ok'
          );
          console.error('Ocurrió un error al guardar los XML', error);
        });
    } else {
      Notiflix.Report.failure(
        'Partida pendiente',
        'Asegúrate de agregar una partida presupuestal a todos los XML antes de guardar.',
        'Ok'
      );
    }
  }

  deleteRow(index: number) {
    Notiflix.Confirm.show(
      'Eliminar fila',
      '¿Estas seguro de eliminar la fila?',
      'Confirmar',
      'Cancelar',
      () => {
        this.arrXML.splice(index, 1);
      }
    );
  }

  ngOnDestroy() {
    // if (this.isProject) {
    //   this.getXMLSubscription.unsubscribe();
    //   this.getCompanySubscription.unsubscribe();
    // }
  }
}
