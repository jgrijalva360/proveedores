import { Component } from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';
import { GeneralService } from 'src/app/services/general.service';

@Component({
  selector: 'app-company',
  templateUrl: './company.component.html',
  styleUrls: ['./company.component.css'],
})
export class CompanyComponent {
  empresaSeleccionada = { proyectos: [] } as any;
  title = 'Home';
  provider = {} as any;

  providerSubscription: Subscription | undefined;

  constructor(
    private authService: AuthService,
    private generalService: GeneralService
  ) {}

  ngOnInit() {
    this.authService.userData$?.subscribe((res: any) => {
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
      });
  }
}
