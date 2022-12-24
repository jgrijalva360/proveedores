import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';
import { GeneralService } from 'src/app/services/general.service';

@Component({
  selector: 'home-root',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit, OnDestroy {
  title = 'Home';
  provider = {} as any;
  empresaSeleccionada = { proyectos: [] } as any;

  user: Subscription | undefined;
  providerSubscription: Subscription | undefined;

  constructor(
    private router: Router,
    private authService: AuthService,
    private generalService: GeneralService
  ) {}

  ngOnInit() {
    this.user = this.authService.userData$?.subscribe((res: any) => {
      this.getUserDB(res.uid);
    });
  }

  getUserDB(uid: any) {
    this.providerSubscription = this.generalService
      .getUserDB(uid)
      .subscribe((res: any) => {
        this.provider = res[0];
        if (this.provider.banks === undefined) {
          this.provider.banks = [];
        }
        if (this.provider.aprobado) {
        } else {
          this.router.navigateByUrl('/home/datos');
        }
      });
  }

  ngOnDestroy(): void {
    this.user?.unsubscribe();
    this.providerSubscription?.unsubscribe();
  }

  regresar() {
    window.history.go(-1);
  }
}
