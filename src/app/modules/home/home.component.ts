import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';
import { GeneralService } from 'src/app/services/general.service';
import * as moment from 'moment';

declare var $: any;

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

  dataUser: any = {};

  userSubscription: Subscription | undefined;
  // providerSubscription: Subscription | undefined;

  constructor(
    private router: Router,
    private authService: AuthService,
    private generalService: GeneralService
  ) {
    moment.locale('es-MX');
  }

  ngOnInit() {
    const idUser = window.sessionStorage.getItem('id') || '';
    // console.log('ID de usuario:', idUser);
    if (idUser.length > 0) {
      this.getUser(idUser);
    } else {
      this.router.navigateByUrl('/');
    }
  }

  getUser(idUser: string) {
    this.generalService.getUserId(idUser).subscribe((res) => {
      console.log(res);
      if (res === undefined) {
        this.onLogout();
      }
    });
  }

  regresar() {
    window.history.go(-1);
  }

  onLogout(): void {
    window.sessionStorage.removeItem('id');
    this.router.navigateByUrl('/');
  }

  toggle() {
    console.log('Toggle sidebar');
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
      sidebar.classList.toggle('active');
    }
    const overlay = document.querySelector('.overlay') as HTMLElement | null;
    if (overlay) {
      overlay.classList.toggle('active');
    }
  }

  ngOnDestroy(): void {
    this.userSubscription?.unsubscribe();
    // this.providerSubscription?.unsubscribe();
  }
}
