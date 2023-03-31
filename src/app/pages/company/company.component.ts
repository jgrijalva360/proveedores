import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';
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

  constructor(private generalService: GeneralService) {}

  ngOnInit() {
    this.getUserDB();
  }

  getUserDB() {
    this.providerSubscription = this.generalService
      .getUserDB(this.idUser || '')
      .subscribe((res) => {
        console.log(res);
        this.provider = res;
      });
  }

  ngOnDestroy() {
    this.providerSubscription?.unsubscribe();
  }
}
