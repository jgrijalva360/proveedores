import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { Router, NavigationEnd } from '@angular/router';
import { GeneralService } from 'src/app/services/general.service';
// import Notiflix from 'notiflix-angular';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit, OnDestroy {
  idUser = '';
  dataUser = {} as any;
  user = {} as any;
  nombreProyecto: string = '';
  nombreEmpresa: string = '';

  subscribeUser: Subscription | undefined;
  subscribeUserDB: Subscription | undefined;

  constructor(
    private authService: AuthService,
    private generalService: GeneralService,
    private router: Router
  ) {}
  ngOnInit(): void {
    this.idUser = window.sessionStorage.getItem('id') as any;
    this.nombreProyecto = window.sessionStorage.getItem('nombreProyecto') || '';
    this.nombreEmpresa = window.sessionStorage.getItem('nombreEmpresa') || '';
    this.getUserDB();
  }

  getUserDB() {
    this.subscribeUserDB = this.generalService
      .getUserDB(this.idUser)
      .subscribe((res: any) => {
        // console.log('UserDB', res);
        this.dataUser = res;
        if (!this.nombreProyecto && res?.proyecto?.nameProject) {
          this.nombreProyecto = res.proyecto.nameProject;
        }
        if (!this.nombreEmpresa && res?.empresa?.nameCompany) {
          this.nombreEmpresa = res.empresa.nameCompany;
        }
      });
  }

  onLogout(): void {
    window.sessionStorage.removeItem('id');
    this.router.navigateByUrl('/');
  }

  toggle() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.toggle('active');

    document.querySelectorAll('.overlay').forEach((el) => {
      (el as HTMLElement).classList.toggle('active');
    });
  }

  ngOnDestroy() {
    this.subscribeUser?.unsubscribe();
    this.subscribeUserDB?.unsubscribe();
  }
}
