import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';
import { GeneralService } from 'src/app/services/general.service';
import * as moment from 'moment';

@Component({
  selector: 'home-root',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit, OnDestroy {
  title = 'Home';
  provider = {} as any;
  empresaSeleccionada = { proyectos: [] } as any;
  idUser: any;

  user: Subscription | undefined;
  providerSubscription: Subscription | undefined;

  constructor(
    private router: Router,
    private authService: AuthService,
    private generalService: GeneralService
  ) {
    moment.locale('es-MX');
  }

  ngOnInit() {
    const idUser = window.sessionStorage.getItem('id');
    console.log(idUser);
    // if (!idUser) {
    //   this.router.navigate(['/']);
    // }
  }

  ngOnDestroy(): void {
    this.user?.unsubscribe();
    this.providerSubscription?.unsubscribe();
  }

  regresar() {
    window.history.go(-1);
  }
}
