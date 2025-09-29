import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import * as Notiflix from 'notiflix';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';
// import { Router } from '@angular/router';
// import { AuthService } from 'src/app/services/auth.service';
// import { User } from 'src/app/models/user';
// import Notiflix from 'notiflix-angular';

declare var bootstrap: any;

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit, OnDestroy {
  addUser = {
    nombre: '',
    rfc: '',
    persona: '',
    email: '',
    password: '',
    confirmPass: '',
  };
  user = '';
  pass = '';
  validation = '';
  errorMsg = '';

  email = '';
  password = '';
  btnToggle = true;
  passAcces = '';

  login = true;
  access = false;
  register = false;

  emailReset = '';

  fecha = new Date().getFullYear();

  subscriptionLogin: Subscription | undefined;

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit() {}

  onLogin() {
    this.subscriptionLogin = this.authService
      .getUser(this.email, this.password)
      .subscribe((res: any) => {
        console.log(res);
        if (res) {
          this.authService.user = res[0];
          window.sessionStorage.setItem('id', res[0].id);
          this.router.navigate([`./home`]);
        } else {
          Notiflix.Notify.failure('Usuario o contraseña incorrectos');
        }
      });

    // this.authService
    //   .loginEmailUser(this.email, this.password)
    //   .then((res) => {
    //     console.log(res);
    //     this.router.navigate(['./home']);
    //   })
    //   .catch((err) => {
    //     if (err.code === 'auth/invalid-email') {
    //       this.errorMsg = 'Verifica el usuario';
    //       document.getElementById('user')?.classList.add('is-invalid');
    //       setTimeout(() => {
    //         this.errorMsg = '';
    //       }, 3000);
    //     } else {
    //       this.errorMsg = 'Verifica la contraseña';
    //       document
    //         .getElementById('user')
    //         ?.classList.replace('is-invalid', 'is-valid');
    //       document.getElementById('password')?.classList.add('is-invalid');
    //       setTimeout(() => {
    //         this.errorMsg = '';
    //       }, 3000);
    //     }
    //   });
  }

  rfcValido(rfc: any, aceptarGenerico = false) {
    const re =
      /^([A-ZÑ&]{3,4}) ?(?:- ?)?(\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])) ?(?:- ?)?([A-Z\d]{2})([A\d])$/;
    const validado = rfc.match(re);
    if (!validado) {
      return false;
    }

    // Separar el dígito verificador del resto del RFC
    const digitoVerificador = validado.pop();
    const rfcSinDigito = validado.slice(1).join('');
    const len = rfcSinDigito.length;
    const diccionario = '0123456789ABCDEFGHIJKLMN&OPQRSTUVWXYZ Ñ';
    const indice = len + 1;
    let suma;
    let digitoEsperado;

    if (len === 12) {
      suma = 0;
    } else {
      suma = 481; // Ajuste para persona moral
    }

    for (let i = 0; i < len; i++) {
      suma += diccionario.indexOf(rfcSinDigito.charAt(i)) * (indice - i);
      digitoEsperado = 11 - (suma % 11);
      if (digitoEsperado === 11) {
        digitoEsperado = 0;
      } else {
        if (digitoEsperado === 10) {
          digitoEsperado = 'A';
        }
      }
    }
    if (
      digitoVerificador != digitoEsperado &&
      (!aceptarGenerico || rfcSinDigito + digitoVerificador != 'XAXX010101000')
    ) {
      return false;
    } else if (
      !aceptarGenerico &&
      rfcSinDigito + digitoVerificador === 'XEXX010101000'
    ) {
      return false;
    } else {
      return rfcSinDigito + digitoVerificador;
    }
  }

  openModalReset() {
    // $('#restartPass').modal('show');
    new bootstrap.Modal('#restartPass').show();
  }

  ngOnDestroy(): void {
    // this.subscriptionLogin?.unsubscribe();
  }
}
