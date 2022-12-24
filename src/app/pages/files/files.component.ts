import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { Provider } from 'src/app/models/providers';
import { AuthService } from 'src/app/services/auth.service';
import { GeneralService } from 'src/app/services/general.service';

@Component({
  selector: 'app-files',
  templateUrl: './files.component.html',
  styleUrls: ['./files.component.css'],
})
export class FilesComponent implements OnInit, OnDestroy {
  provider = {} as Provider;

  userSubscription: Subscription | undefined;
  providerSubscription: Subscription | undefined;

  constructor(
    private authService: AuthService,
    private generalService: GeneralService
  ) {}

  ngOnInit(): void {
    this.userSubscription = this.authService.userData$?.subscribe(
      (res: any) => {
        this.getUserDB(res.uid);
      }
    );
  }

  getUserDB(uid: any) {
    this.providerSubscription = this.generalService
      .getUserDB(uid)
      .subscribe((res: any) => {
        this.provider = res[0];
        if (this.provider.banks === undefined) {
          this.provider.banks = [];
        }
        console.log(this.provider);
      });
  }

  ngOnDestroy(): void {}
}
