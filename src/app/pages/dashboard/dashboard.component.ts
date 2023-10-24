import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { GeneralService } from 'src/app/services/general.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  provider = {} as any;
  mesActual: any;
  statusFiles = '';

  providerSubscription: Subscription | undefined;

  constructor(private generalService: GeneralService, private router: Router) {}
  ngOnInit(): void {
    this.getProvider();
    this.mesActual = new Date().getMonth() + 1;
  }

  getProvider() {
    const idUser = window.sessionStorage.getItem('id') || '';
    this.providerSubscription = this.generalService
      .getUserDB(idUser)
      .subscribe((res) => {
        this.provider = res;
        this.checkFiles();
      });
  }

  checkFiles() {
    this.statusFiles = 'Aprobado';
    for (let i = 0; i < this.provider.files.length; i++) {
      const elementTypeFile = this.provider.files[i];

      if (elementTypeFile.archivos.length === 0) {
        this.statusFiles = 'Pendiente';
        break;
      }

      const mesActual = new Date().getMonth() + 1;
      if (
        elementTypeFile.archivos[elementTypeFile.archivos.length - 1]?.mes !==
        this.mesATexto(mesActual)
      ) {
        this.statusFiles = 'Pendiente';
      }

      for (let j = 0; j < elementTypeFile.archivos.length; j++) {
        const elementFile = elementTypeFile.archivos[j];
        if (elementFile.status === 'En revisión') {
          this.statusFiles = 'En revisión';
        } else if (elementFile.status === 'Rechazado') {
          this.statusFiles = 'Rechazado';
          break;
        }
      }
      break;
    }
  }

  mesATexto(value: number) {
    let letrasMes = '';
    switch (value) {
      case 1:
        letrasMes = 'Enero';
        break;
      case 2:
        letrasMes = 'Febrero';
        break;
      case 3:
        letrasMes = 'Marzo';
        break;
      case 4:
        letrasMes = 'Abril';
        break;
      case 5:
        letrasMes = 'Mayo';
        break;
      case 6:
        letrasMes = 'Junio';
        break;
      case 7:
        letrasMes = 'Julio';
        break;
      case 8:
        letrasMes = 'Agosto';
        break;
      case 9:
        letrasMes = 'Septiembre';
        break;
      case 10:
        letrasMes = 'Octubre';
        break;
      case 11:
        letrasMes = 'Noviembre';
        break;
      case 12:
        letrasMes = 'Diciembre';
        break;
    }
    return letrasMes;
  }

  ngOnDestroy() {}
}
