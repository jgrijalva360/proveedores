import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { Provider } from 'src/app/models/providers';
import { AuthService } from 'src/app/services/auth.service';
import { GeneralService } from 'src/app/services/general.service';
import { NgxXml2jsonService } from 'ngx-xml2json';
import * as Notiflix from 'notiflix';
import { Router } from '@angular/router';
import { AngularFireStorage } from '@angular/fire/compat/storage';

@Component({
  selector: 'app-dealmemo',
  templateUrl: './dealmemo.component.html',
  styleUrls: ['./dealmemo.component.css'],
})
export class DealmemoComponent implements OnInit {
  provider = {} as Provider;
  xml = {} as any;
  idCompany: any;
  idProject: string | undefined;
  dealSeleccionado: any;
  indexDealSeleccionado: any;
  indexPagoSeleccionado: any;
  archivoPDF = {} as any;
  dealsFiltrados = [] as any;

  userSubscription: Subscription | undefined;
  providerSubscription: Subscription | undefined;

  constructor(
    private authService: AuthService,
    private generalService: GeneralService,
    private ngxXml2jsonService: NgxXml2jsonService,
    private router: Router,
    public storage: AngularFireStorage
  ) {}

  ngOnInit(): void {
    const url = this.router.parseUrl(this.router.url);
    this.idCompany = url.root.children.primary.segments[1].path;
    this.idProject = url.root.children.primary.segments[2].path;
    this.getUserDB(this.authService.idUser);
  }

  getUserDB(uid: any) {
    this.providerSubscription = this.generalService
      .getUserDB(uid)
      .subscribe((res: any) => {
        this.provider = res[0];
        this.dealSeleccionado = undefined;
        this.dealsFiltrados = this.filterDeals();
        this.sumaValores();
      });
  }

  filterDeals() {
    return this.provider.dealMemos.filter(
      (element: any) => element.idProject === this.idProject
    );
  }

  sumaValores() {
    this.provider.dealMemos.forEach((element: any) => {
      let suma = 0;
      element.pagos.forEach((element2: any) => {
        suma += element2.importe;
      });
      element.valor = suma;
    });
  }

  seleccionDeal(index: number) {
    this.dealSeleccionado = this.provider.dealMemos[index];
    this.indexDealSeleccionado = index;
  }

  onFileChange(ev: any, index: number) {
    this.indexPagoSeleccionado = index;
    this.archivoPDF = ev;

    const archivo = ev.target.files[0];
    if (archivo.type === 'text/xml') {
      const lector = new FileReader();
      lector.onload = (e) => {
        this.xmlToJson(e);
      };
      lector.readAsText(archivo);
    } else {
      Notiflix.Notify.failure(
        `El archivo ${archivo.name} no es un archivo XML`
      );
      (<any>(
        document.getElementById('XMLFile' + this.indexPagoSeleccionado)
      )).value = '';
    }
  }

  xmlToJson(lector: any) {
    const res = lector.target.result;
    const parser = new DOMParser();
    const xml = parser.parseFromString(res, 'text/xml');
    const obj = this.ngxXml2jsonService.xmlToJson(xml);
    // this.validarSiExiste(obj);

    this.assignData(obj);
  }

  assignData(obj: any) {
    if (obj['cfdi:Comprobante']) {
      try {
        this.xml.asociado = true;
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
        this.validation();
      } catch (error) {
        console.error('Ocurrio un error: ', error);
      }
    }
  }

  validation() {
    let pagoActual = this.dealSeleccionado.pagos[this.indexPagoSeleccionado];

    let validacionFolio = false;
    // Validar que no exista un XML con el mismo folio fiscal
    for (let index = 0; index < this.provider.dealMemos.length; index++) {
      const dealMemo = this.provider.dealMemos[index];
      for (let indexDeal = 0; indexDeal < dealMemo.pagos.length; indexDeal++) {
        const pago = dealMemo.pagos[indexDeal];
        if (pago.xml) {
          if (this.xml.folioComprobante === pago.xml.folioComprobante) {
            validacionFolio = true;
            break;
          }
        }
      }
    }
    // ----------->

    let save = () => {
      this.dealSeleccionado.pagos[this.indexPagoSeleccionado].xml = this.xml; // Aqui guardo el XML al pago
      this.uploadFileXML(this.archivoPDF, this.indexPagoSeleccionado);
      this.xml = {};
    };

    if (this.provider.rfc === this.xml.rfc) {
      if (pagoActual.importe === this.xml.subtotal) {
        if (validacionFolio) {
          Notiflix.Notify.failure('El Folio ya se encuentra registrado');
        } else {
          save();
        }
      } else {
        Notiflix.Notify.failure('El importe no corresponde');
      }
    } else {
      Notiflix.Notify.failure('El RFC no corresponde al proveedor');
      (<any>(
        document.getElementById('XMLFile' + this.indexPagoSeleccionado)
      )).value = '';
    }
  }

  uploadFileXML(event: any, index: any) {
    this.indexPagoSeleccionado = index;
    const fileInput = event.target.files[0];
    const fileType = fileInput.type;
    const fileSize = fileInput.size;
    const allowedExtensions = /(.xml)$/i;
    if (!allowedExtensions.exec(fileType) || fileSize >= 1000000) {
      alert(
        'Por favor agrega unicamente archivos con extension .xml y tamaño maximo de 1MB'
      );
    } else {
      const filePath = `proveedoresExtra/${this.provider.rfc}/dealMemo ${
        this.indexDealSeleccionado + 1
      }/pago ${this.indexPagoSeleccionado + 1}/${fileInput.name}`;
      const path: any = {};
      path.pathImageProfile = filePath;
      const ref = this.storage.ref(filePath);
      const task = this.storage.upload(filePath, fileInput);
      task.then((res) => {
        Notiflix.Notify.success('Se guardo correctamente el XML');
        ref.getDownloadURL().subscribe((resultado) => {
          const xml = {
            link: resultado,
            path: filePath,
            name: fileInput.name,
          };
          this.dealSeleccionado.pagos[this.indexPagoSeleccionado].xml.file =
            xml;
          this.generalService
            .updateUserDB(this.provider.id, {
              dealMemos: this.provider.dealMemos,
            })
            .then(() => {
              Notiflix.Notify.success(
                'Se actualizo correctamente la base de datos'
              );
            });
        });
      });
    }
  }

  uploadFilePDF(event: any, index: any) {
    this.indexPagoSeleccionado = index;
    const element = event.target.files[0];
    const fileInput = element;
    const fileType = fileInput.type;
    const fileSize = fileInput.size;
    const allowedExtensions = /(.pdf)$/i;
    if (!allowedExtensions.exec(fileType) || fileSize >= 5000000) {
      alert(
        'Por favor agrega unicamente archivos con extension .pdf y tamaño maximo de 5MB'
      );
      // document.getElementById('labelFile').innerHTML = 'Seleccionar';
      // (<any>document.getElementById('inputGroupFile01')).value = '';
    } else {
      if (
        fileInput.name.split('.')[0] ===
        this.dealSeleccionado.pagos[this.indexPagoSeleccionado].xml
          .folioComprobante
      ) {
        const filePath = `proveedoresExtra/${this.provider.rfc}/dealMemo ${
          this.indexDealSeleccionado + 1
        }/pago ${this.indexPagoSeleccionado + 1}/${fileInput.name}`;
        const path: any = {};
        path.pathImageProfile = filePath;
        const ref = this.storage.ref(filePath);
        const task = this.storage.upload(filePath, element);
        task.then((res) => {
          Notiflix.Notify.success('Se guardo correctamente el PDF');
          ref.getDownloadURL().subscribe((resultado) => {
            const pdf = {
              link: resultado,
              path: filePath,
              name: fileInput.name,
            };
            this.dealSeleccionado.pagos[this.indexPagoSeleccionado].pdf = pdf;
            this.dealSeleccionado.pagos[this.indexPagoSeleccionado].status =
              'En revisión';
            this.dealSeleccionado.pagos[
              this.indexPagoSeleccionado
            ].actualizado = true;

            this.generalService.updateUserDB(this.provider.id, {
              actualizado: true,
            });

            this.dealSeleccionado.pagos[
              this.indexPagoSeleccionado
            ].fechaSubida = new Date();

            this.generalService
              .updateUserDB(this.provider.id, {
                dealMemos: this.provider.dealMemos,
              })
              .then(() => {
                Notiflix.Notify.success(
                  'Se actualizo correctamente la base de datos'
                );
              });
          });
        });
      } else {
        Notiflix.Notify.failure('El nombre no corresponde al folio del XML');
      }
    }
  }

  deleteFilePDF(item: any) {
    const pathPDF = item.pdf.path;
    this.generalService
      .deleteFile(pathPDF)
      .subscribe((res) => {})
      .unsubscribe();
    delete item.pdf;
    this.generalService
      .updateUserDB(this.provider.id, {
        dealMemos: this.provider.dealMemos,
      })
      .then((res) => {
        Notiflix.Notify.success('Se actualizo correctamente la base de datos');
      });
  }
  deleteFileXML(item: any) {
    const pathXML = item.xml.file.path;
    this.generalService
      .deleteFile(pathXML)
      .subscribe((res) => {})
      .unsubscribe();
    delete item.xml;
    item.status = 'Pendiente';
    this.generalService
      .updateUserDB(this.provider.id, {
        dealMemos: this.provider.dealMemos,
      })
      .then(() => {
        Notiflix.Notify.success('Se actualizo correctamente la base de datos');
      });
  }
}
