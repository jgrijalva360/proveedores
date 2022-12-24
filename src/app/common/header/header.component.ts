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
    this.subscribeUser = this.authService.userData$?.subscribe((res) => {
      this.getUserDB(res.multiFactor.user.uid);
    });
  }

  getUserDB(uid: string): void {
    this.subscribeUserDB = this.generalService
      .getUserDB(uid)
      .subscribe((res: any) => {
        this.dataUser = res[0];
      });
  }

  onLogout(): void {
    this.authService.logOutUser().then(() => {
      this.router.navigateByUrl('/');
    });
  }

  ngOnDestroy() {
    this.subscribeUser?.unsubscribe();
    this.subscribeUserDB?.unsubscribe();
  }
}
