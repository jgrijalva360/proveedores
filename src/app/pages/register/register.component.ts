import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import * as Notiflix from 'notiflix';
import { GeneralService } from 'src/app/services/general.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
})
export class RegisterComponent implements OnInit {
  idProvider = '';
  provider = {} as any;
  confirmPassword = '';

  constructor(private generalService: GeneralService, private router: Router) {}

  ngOnInit(): void {
    const url = this.router.parseUrl(this.router.url);
    this.idProvider = url.root.children.primary.segments[1].path;
    this.getProvider(this.idProvider);
  }

  getProvider(id: string) {
    this.generalService.getUserId(id).subscribe((res) => {
      if (res === undefined) {
        this.router.navigate(['/']);
      } else {
        this.provider = res;
      }
    });
  }

  onSignIn() {
    console.log(this.provider.password);
    console.log(this.confirmPassword);

    if (this.provider.password === this.confirmPassword) {
      this.generalService
        .updateUserDB(this.idProvider, {
          password: window.btoa(this.provider.password),
          registrado: true,
          aprobado: false,
        })
        .then(() => {
          Notiflix.Notify.success('Registrado correctamente');
          this.router.navigate(['/']);
        });
    }
  }
}
