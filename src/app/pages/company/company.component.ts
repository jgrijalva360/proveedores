import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';
import { GeneralService } from 'src/app/services/general.service';

@Component({
  selector: 'app-company',
  templateUrl: './company.component.html',
  styleUrls: ['./company.component.css'],
})
export class CompanyComponent implements OnInit, OnDestroy {
  empresaSeleccionada = {} as any;
  title = 'Home';
  provider = {} as any;
  usuario = {} as any;

  providerSubscription: Subscription | undefined;

  constructor(
    private generalService: GeneralService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    const idUser = window.sessionStorage.getItem('id') || '';
    console.log(idUser);
    this.getUserDB(idUser);
  }

  getUserDB(idUser: string) {
    this.generalService.getUserId(idUser).subscribe((usuario) => {
      this.usuario = usuario;
      console.log('Usuario actual:', usuario);
    });
  }

  ngOnDestroy() {
    // this.providerSubscription?.unsubscribe();
  }
}
