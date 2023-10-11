import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { GeneralService } from 'src/app/services/general.service';

@Component({
  selector: 'app-company',
  templateUrl: './company.component.html',
  styleUrls: ['./company.component.css'],
})
export class CompanyComponent implements OnInit, OnDestroy {
  empresaSeleccionada = { proyectos: [] } as any;
  title = 'Home';
  provider = {} as any;
  idUser = window.sessionStorage.getItem('id');

  providerSubscription: Subscription | undefined;

  constructor(private generalService: GeneralService, private router: Router) {}

  ngOnInit() {
    this.getUserDB();
  }

  getUserDB() {
    this.providerSubscription = this.generalService
      .getUserDB(this.idUser || '')
      .subscribe((res) => {
        console.log(res);
        this.provider = res;
        if (this.provider.status !== 'Aprobado') {
          this.router.navigateByUrl('/home/datos');
        }
      });
  }

  ngOnDestroy() {
    this.providerSubscription?.unsubscribe();
  }
}
