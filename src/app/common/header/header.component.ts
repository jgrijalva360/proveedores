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
  userDB = {} as any;
  urlImageDefault = '../../../../assets/logos/noPhoto.jpg';

  subscribeUser: Subscription | undefined;
  subscribeUserDB: Subscription | undefined;

  constructor(
    private authService: AuthService,
    private generalService: GeneralService,
    private router: Router
  ) {}
  ngOnInit(): void {
    this.idUser = window.sessionStorage.getItem('id') as any;
    this.getUserDB();
  }

  getUserDB() {
    this.subscribeUserDB = this.generalService
      .getUserDB(this.idUser)
      .subscribe((res: any) => {
        this.dataUser = res;
      });
  }

  onLogout(): void {
    this.router.navigateByUrl('/');
  }

  ngOnDestroy() {
    this.subscribeUser?.unsubscribe();
    this.subscribeUserDB?.unsubscribe();
  }
}
