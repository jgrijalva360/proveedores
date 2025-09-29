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
      console.log('User', this.user);
      this.idCompany = res.empresa.idCompany;
      this.idProject = res.proyecto.idProject;
      this.getOrdenes();
    });
  }

  getOrdenes() {
    this.generalService
      .getOrdenes(this.idCompany, this.idProject, this.user.rfc)
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
    console.log('Months', this.arrMonts);
    // return months;
  }

  onFileChangePDF(ev: any, nombre: any, mes: string) {
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
      const filePath = `CFDIs/${this.user.proyecto.nameProject}/${this.user.departamento.name}/${this.user.rfc}/${nombre}/${mes}/${element.name}`;
      const task = this.storage.upload(filePath, element);
      task.then(() => {
        Notiflix.Notify.success('Se guardo correctamente el PDF');
        this.updateOrderPDF(nombre, mes, filePath);
      });
    }
  }

  updateOrderPDF(nombre: string, mes: string, filePath: string) {
    this.arrOC.forEach((element) => {
      console.log('Element', element);

      element.archivos[nombre][mes] = {
        cargadoPDF: new Date(),
        pathPDF: filePath,
      };

      // this.generalService
      //   .updateOrden(this.idCompany, this.idProject, element.id, {
      //     archivos: element.archivos,
      //   })
      //   .then(() => {
      //     Notiflix.Notify.success('Se actualizo correctamente la orden');
      //   });
    });
  }
}
