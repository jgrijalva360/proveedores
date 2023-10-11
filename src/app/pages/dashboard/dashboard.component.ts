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

  providerSubscription: Subscription | undefined;

  constructor(private generalService: GeneralService, private router: Router) {}
  ngOnInit(): void {
    this.getProvider();
    this.mesActual = new Date().getMonth() + 1;
  }

  getProvider() {
    const idUser = window.sessionStorage.getItem('id') || '';
    console.log(idUser);
    this.providerSubscription = this.generalService
      .getUserDB(idUser)
      .subscribe((res) => {
        this.provider = res;
        console.log(this.provider);
        this.checkFiles();
      });
  }

  checkFiles() {
    this.provider.files.forEach((elementTypeFile: any) => {
      elementTypeFile.archivos.forEach((elementFile: any) => {
        if (elementFile.status === 'En revisión') {
          this.provider.statusFiles = 'En revisión';
        }
      });
      console.log(
        elementTypeFile.archivos[elementTypeFile.archivos.lenght - 1]?.mes
      );
      if (
        elementTypeFile.archivos[elementTypeFile.archivos.lenght - 1]?.mes ===
        this.generalService.mesATexto(this.mesActual)
      ) {
        this.provider.statusFiles = 'En revisión';
      }
    });
  }

  ngOnDestroy() {}
}
