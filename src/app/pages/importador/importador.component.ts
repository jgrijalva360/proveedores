import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { Event, Router } from '@angular/router';
// import { AngularFireStorage } from '@angular/fire/storage';
// import { NgxXml2jsonService } from 'ngx-xml2json';
// import Notiflix from 'notiflix-angular';
import { AuthService } from 'src/app/services/auth.service';
import { GeneralService } from 'src/app/services/general.service';
// import { GeneralService } from 'src/app/services/general.service';
// import { ProjectService } from 'src/app/services/project.service';
// declare var $: any;

@Component({
  selector: 'app-importador',
  templateUrl: './importador.component.html',
  styleUrls: ['./importador.component.css'],
})
export class ImportadorComponent implements OnInit, OnDestroy {
  xml = {} as any;
  arrXML = [] as any;
  idCompany: string | undefined;
  idProject: string | undefined;
  project = {} as any;

  objDocumento = {} as any;

  public rfcReceptor = '';

  public isProject = false;

  getXMLSubscription: Subscription | undefined;
  getCompanySubscription: Subscription | undefined;
  subscriberGetProject: Subscription | undefined;

  constructor(
    private router: Router,
    private authService: AuthService, // private projectService: ProjectService, // private empresaService: EmpresasService, // public storage: AngularFireStorage, // private generalService: GeneralService
    private generalService: GeneralService
  ) {}

  ngOnInit(): void {
    this.authService.userData$?.subscribe((res: any) => {
      console.log(res);
    });
    const url = this.router.parseUrl(this.router.url);
    console.log(url);
    // if (url.root.children.primary.segments.length > 1) {
    //   this.idCompany = url.root.children.primary.segments[1].path;
    //   this.idProject = url.root.children.primary.segments[3].path;
    //   this.isProject = true;
    //   this.getCompany();
    //   this.getProject();
    //   this.getXML();
    // } else {
    //   this.idCompany = url.root.children.primary.segments[1].path;
    //   this.idProject = url.root.children.primary.segments[3].path;
    // }
  }

  getCompany() {
    // this.getCompanySubscription = this.empresaService
    //   .getCompanyActual(this.idCompany)
    //   .subscribe((res: any) => {
    //     // console.log(res);
    //     this.rfcReceptor = res.rfc.toUpperCase();
    //   });
  }

  getProject() {
    // this.subscriberGetProject = this.empresaService
    //   .getProjectSpecific(this.idCompany, this.idProject)
    //   .subscribe((res) => {
    //     // console.log(res);
    //     this.project = res;
    //   });
  }

  getXML() {
    // this.getXMLSubscription = this.generalService
    //   .getXML(this.idCompany, this.idProject)
    //   .subscribe((res: any) => {
    //     console.log(res);
    //     if (res !== undefined) {
    //       this.arrXML = res.arrXML;
    //     }
    //   });
  }

  saveXML() {
    // const obj = { arrXML: this.arrXML };
    // this.projectService
    //   .saveXML(this.idCompany, this.idProject, obj)
    //   .then((res) => {
    //     Notiflix.Notify.Success('Se guardo exitosamente');
    //   });
  }

  onFileChange(ev: any) {
    for (let index = 0; index < ev.target.files.length; index++) {
      const archivo = ev.target.files[index];
      if (archivo.type === 'text/xml') {
        const lector = new FileReader();
        lector.onload = (e) => {
          this.xmlToJson(e);
        };
        lector.readAsText(archivo);
      } else {
        // Notiflix.Notify.Failure(
        //   `El archivo ${archivo.name} no es un archivo XML`
        // );
      }
    }
    (<any>document.getElementById('inputFiles')).value = '';
  }

  xmlToJson(lector: any) {
    const res = lector.target.result;
    const parser = new DOMParser();
    const xml = parser.parseFromString(res, 'text/xml');
    // const obj = this.ngxXml2jsonService.xmlToJson(xml);
    // this.validarSiExiste(obj);
  }

  // validarSiExiste(obj) {
  //   console.log(obj);
  //   const folio =
  //     obj['cfdi:Comprobante']['cfdi:Complemento']['tfd:TimbreFiscalDigital'][
  //       '@attributes'
  //     ].UUID;
  //   const validacion = this.arrXML.findIndex(
  //     (element) => element.folioComprobante === folio
  //   );
  //   if (validacion === -1) {
  //     if (
  //       obj['cfdi:Comprobante']['cfdi:Receptor'][
  //         '@attributes'
  //       ].Rfc.toUpperCase() === this.rfcReceptor.toUpperCase() &&
  //       this.isProject
  //     ) {
  //       this.assignData(obj);
  //     } else if (!this.isProject) {
  //       this.assignData(obj);
  //     } else if (
  //       obj['cfdi:Comprobante']['cfdi:Receptor'][
  //         '@attributes'
  //       ].Rfc.toUpperCase() !== this.rfcReceptor.toUpperCase() &&
  //       this.isProject
  //     ) {
  //       if (this.project.filmadoras) {
  //         this.project.filmadoras.forEach((element) => {
  //           if (
  //             obj['cfdi:Comprobante']['cfdi:Receptor'][
  //               '@attributes'
  //             ].Rfc.toUpperCase() === element.rfc
  //           ) {
  //             this.assignData(obj);
  //           }
  //         });
  //       }
  //     }
  //   } else if (validacion > -1) {
  //     console.log('ya existe');
  //     Notiflix.Notify.Failure(`El folio ${folio} ya se encuentra registrado.`);
  //   }
  // }

  assignData(obj: any) {
    console.log(obj);
    if (obj['cfdi:Comprobante']) {
      console.log(obj);
      try {
        this.xml.asociado = false;
        this.xml.proveedor =
          obj['cfdi:Comprobante']['cfdi:Emisor']['@attributes'].Nombre;

        this.xml.rfc =
          obj['cfdi:Comprobante']['cfdi:Emisor']['@attributes'].Rfc;

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
          obj['cfdi:Comprobante']['cfdi:Complemento'][
            'tfd:TimbreFiscalDigital'
          ]['@attributes'].UUID;

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

        this.xml.total = parseFloat(
          obj['cfdi:Comprobante']['@attributes'].Total
        );

        // Validacion si tiene impuestos
        if (obj['cfdi:Comprobante']['cfdi:Impuestos']) {
          // impuestos trasladados
          if (obj['cfdi:Comprobante']['cfdi:Impuestos']['cfdi:Traslados']) {
            this.xml.iva = parseFloat(
              obj['cfdi:Comprobante']['cfdi:Impuestos']['cfdi:Traslados'][
                'cfdi:Traslado'
              ]['@attributes'].Importe
            );
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
                this.xml.retIVA = parseFloat(
                  retenciones['@attributes'].Importe
                );
              } else if (retenciones['@attributes'].Impuesto === '001') {
                this.xml.retISR = parseFloat(
                  retenciones['@attributes'].Importe
                );
              }
            }
          }
        }
        this.arrXML.push(this.xml);
        this.xml = {};
      } catch (error) {
        console.error('Ocurrio un error');
      }
    }
  }

  async uploadFile(event: any) {
    const files = Object.assign([], event.target.files);

    for (let index = 0; index < event.target.files.length; index++) {
      const element = event.target.files[index];
      const fileInput = element;
      const fileType = fileInput.type;
      const fileSize = fileInput.size;
      const allowedExtensions = /(.pdf)$/i;
      if (!allowedExtensions.exec(fileType) || fileSize >= 1000000) {
        alert(
          'Por favor agrega unicamente archivos con extension .pdf y tamaño maximo de 1MB '
        );
        // document.getElementById('labelFile').innerHTML = 'Seleccionar';
        (<any>document.getElementById('inputGroupFile01')).value = '';
      } else {
        const XMLEncontrado = this.arrXML.find(
          (XML: any) => XML.folioComprobante === element.name.split('.')[0]
        );
        if (XMLEncontrado) {
          const filePath = `CFDIs/PDF/${element.name}`;
          const path: any = {};
          path.pathImageProfile = filePath;
          XMLEncontrado.path = filePath;
          // const ref = this.storage.ref(filePath);
          // console.log(ref);
          // // const task = this.storage.upload(filePath, element);
          // task.snapshotChanges().subscribe(res => {
          //   console.log(res.bytesTransferred);
          //   Notiflix.Notify.Success('Se guardo correctamente el PDF');
          // });
          // task.then(res => {
          //   console.log(res);
          //   Notiflix.Notify.Success('Se guardo correctamente el PDF');
          // });
        }
      }
    }
    this.saveXML();
  }

  // downloadPDF(element) {
  //   if (element.path) {
  //     const ref = this.storage.ref(element.path);
  //     const subscriptionURL = ref.getDownloadURL().subscribe(
  //       (res) => {
  //         window.open(res, '_blank');
  //         subscriptionURL.unsubscribe();
  //       },
  //       (error) => {
  //         console.error(error);
  //         switch (error.code) {
  //           case 'storage/object-not-found':
  //             // File doesn't exist
  //             break;
  //           case 'storage/unauthorized':
  //             // User doesn't have permission to access the object
  //             break;
  //           case 'storage/canceled':
  //             // User canceled the upload
  //             break;
  //           case 'storage/unknown':
  //             // Unknown error occurred, inspect the server response
  //             break;
  //         }
  //       }
  //     );
  //   }
  // }

  // selectXML(XML) {
  //   console.log(XML);
  // }

  ngOnDestroy() {
    // if (this.isProject) {
    //   this.getXMLSubscription.unsubscribe();
    //   this.getCompanySubscription.unsubscribe();
    // }
  }
}
