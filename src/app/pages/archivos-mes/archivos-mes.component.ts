import { Component } from '@angular/core';
import { GeneralService } from 'src/app/services/general.service';
import * as Notiflix from 'notiflix';
import { AngularFireStorage } from '@angular/fire/compat/storage';

@Component({
  selector: 'app-archivos-mes',
  templateUrl: './archivos-mes.component.html',
  styleUrls: ['./archivos-mes.component.css'],
})
export class ArchivosMesComponent {
  idUser = {} as any;
  user = {} as any;
  idCompany = '';
  idProject = '';
  arrOC: any[] = [];
  today = new Date();

  archivos = [];
  arrMonts: string[] = [];

  constructor(
    private generalService: GeneralService,
    public storage: AngularFireStorage
  ) {}

  ngOnInit(): void {
    this.idUser = window.sessionStorage.getItem('id') || '';
    this.getUser(this.idUser);
    this.today = new Date();
  }

  getUser(idUser: string) {
    this.generalService.getUserId(idUser).subscribe((res: any) => {
      this.user = res;
      // console.log('User', this.user);
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
        this.arrOC = orden;
        orden.forEach((element: any) => {
          element.comprometidos.forEach((comprometido: any, index: number) => {
            comprometido.id = 'OC-' + element.orderCounter + '-' + (index + 1);
          });
        });
        // filtrar las ordenes que su fecha de inicio no sea mayor a la fecha actual
        // this.arrOC = this.arrOC.filter(
        //   (orden) => new Date(orden.fechaInicio) <= this.today
        // );
        console.log('Ordenes', this.arrOC);
        this.getMonths();
      });
  }

  getOrdenesAdmin() {
    this.generalService
      .getOrdenesAdmin(this.idCompany, this.idProject)
      .subscribe((orden: any) => {
        this.arrOC = orden;
        orden.forEach((element: any) => {
          element.comprometidos.forEach((comprometido: any, index: number) => {
            comprometido.id = 'OC-' + element.orderCounter + '-' + (index + 1);
          });
        });
        // filtrar las ordenes que su fecha de inicio no sea mayor a la fecha actual
        // this.arrOC = this.arrOC.filter(
        //   (orden) => new Date(orden.fechaInicio) <= this.today
        // );
        console.log('Ordenes', this.arrOC);
        this.getMonths();
      });
  }

  // Obtener meses de los comprometidos de cada orden
  getMonths() {
    const months: { [key: string]: number } = {};
    this.arrOC.forEach((orden) => {
      orden.comprometidos.forEach((comprometido: any) => {
        const month = new Date(comprometido.fechaInicio).toLocaleString(
          'default',
          {
            month: 'long',
          }
        );
        // console.log('Month', month);
        months[month] = (months[month] || 0) + 1;
      });
    });
    // console.log('Months', Object.keys(months));
    this.arrMonts = Object.keys(months);
    // console.log('Months', this.arrMonts);
    // return months;
  }

  onFileChangePDF(ev: any, nombre: any, mes: string, order: any) {
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
      const filePath = `CFDIs/${this.user.proyecto.nameProject}/${this.user.departamento.name}/${order.rfc}/${nombre}/${mes}/${element.name}`;
      const task = this.storage.upload(filePath, element);
      task.then(() => {
        Notiflix.Notify.success('Se guardo correctamente el PDF');
        this.updateOrderPDF(nombre, mes, filePath, order);
      });
    }
  }

  updateOrderPDF(nombre: string, mes: string, filePath: string, order: any) {
    // console.log('Order', order);
    // console.log('Nombre', nombre);
    // console.log('Mes', mes);
    // console.log('FilePath', filePath);

    const archivos = order.archivos || {};

    archivos[nombre] = {
      [mes]: {
        fechaCargado: new Date(),
        pathPDF: filePath,
        estatus: 'EN REVISIÓN',
      },
    };

    this.generalService
      .updateOrden(this.idCompany, this.idProject, order.id, {
        archivos: archivos,
      })
      .then(() => {
        Notiflix.Notify.success('Se actualizo correctamente la orden');
      });
  }

  downloadFilePDF(path: string) {
    // console.log('Path', path);
    this.storage
      .ref(path)
      .getDownloadURL()
      .subscribe((url) => {
        window.open(url, '_blank');
      });
  }

  deleteFilePDF(nombre: string, mes: string, filePath: string, order: any) {
    this.storage
      .ref(filePath)
      .delete()
      .subscribe(() => {
        Notiflix.Notify.success('Se elimino correctamente el PDF');
        // Actualizar la orden para eliminar la referencia del archivo
        const archivos = { ...order.archivos };
        delete archivos[nombre][mes];
        this.generalService
          .updateOrden(this.idCompany, this.idProject, order.id, {
            archivos: archivos,
          })
          .then(() => {
            Notiflix.Notify.success('Se actualizo correctamente la orden');
          });
      });
  }
}
