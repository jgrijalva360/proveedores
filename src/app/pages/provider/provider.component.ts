import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { Provider, Bank } from 'src/app/models/providers';
import { AuthService } from 'src/app/services/auth.service';
import { GeneralService } from 'src/app/services/general.service';
import { Notify } from 'notiflix/build/notiflix-notify-aio';

@Component({
  selector: 'app-provider',
  templateUrl: './provider.component.html',
  styleUrls: ['./provider.component.css']
})
export class ProviderComponent implements OnInit, OnDestroy {

  provider = {
    banks: [] as any
  } as any;
  banco = {} as Bank;
  
  userSubscription: Subscription | undefined;
  providerSubscription: Subscription | undefined;
  
  constructor(private generalService: GeneralService, private authService: AuthService) {
    this.provider.banks = [] as any;
  }
  
  ngOnInit(): void {
    console.log(this.provider);
    this.authService.userData$?.subscribe((res: any) => {
      this.getUserDB(res.uid);
    })
  }

  getUserDB(uid: any) {
    this.providerSubscription = this.generalService.getUserDB(uid).subscribe(((res: any) => {
      this.provider = res[0];
      if (this.provider.banks === undefined) {
        this.provider.banks = [];
      }
      console.log(this.provider);
    }))
  }

  addBank() {
    if (this.banco.clabe && this.banco.nombre) {
      if (this.banco.clabe.length === 18) {
        console.log(this.banco);
        this.provider.banks.push(this.banco);
        this.banco = {} as Bank;
      } else {
        // Notiflix.Notify.Failure('La cuenta CLABE debe contener 18 digitos');
      }
    }
  }
  deleteBank(index: number) {
    this.provider.banks.splice(index, 1);
  }

  saveData() {
    this.generalService.saveUserDB(this.provider).then(() => {
      console.log("Se guardo correctamente");
      Notify.success("Tus datos se actualizaron correctamente")
    })
  }

  ngOnDestroy(): void {
    this.providerSubscription?.unsubscribe();
    this.userSubscription?.unsubscribe();
  }

}
