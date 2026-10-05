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

  constructor(private router: Router, private authService: AuthService) { }

  ngOnInit() { }

  onLogin() {
    if (!this.email || !this.password) {
      Notiflix.Notify.failure('Por favor ingresa correo y contraseña');
      return;
    }

    const emailLimpio = this.email.trim().toLowerCase();
    const passLimpia = this.password.trim();

    Notiflix.Loading.standard('Iniciando sesión...');

    // 1. Intentar inicio de sesión con Firebase Authentication
    this.authService
      .loginWithFirebaseAuth(emailLimpio, passLimpia)
      .then((cred) => {
        const user = cred.user;
        if (!user) {
          throw new Error('No se pudo obtener información del usuario.');
        }

        // Validar si el correo está verificado
        if (!user.emailVerified) {
          Notiflix.Loading.remove();
          Notiflix.Confirm.show(
            'Correo no verificado',
            'Tu correo electrónico aún no ha sido confirmado. ¿Deseas que te reenviemos el enlace de verificación?',
            'Sí, reenviar correo',
            'Cerrar',
            () => {
              user.sendEmailVerification().then(() => {
                Notiflix.Notify.success('Enlace de verificación enviado. Revisa tu bandeja de entrada o spam.');
              }).catch(() => {
                Notiflix.Notify.failure('No se pudo enviar el correo en este momento. Intenta más tarde.');
              });
              this.authService.signOut();
            },
            () => {
              this.authService.signOut();
            }
          );
          return;
        }

        // Usuario verificado: obtener datos de usersPublic por UID o por email
        this.authService.getUser(emailLimpio, passLimpia).subscribe((res: any) => {
          Notiflix.Loading.remove();
          if (res && res.length > 0 && res[0]) {
            const proveedorDoc = res[0];
            this.authService.user = proveedorDoc;
            window.sessionStorage.setItem('id', proveedorDoc.id);
            this.router.navigate([`/Inicio/${proveedorDoc.id}`]);
          } else {
            // Documento con ID igual a user.uid
            this.authService.user = { id: user.uid, email: user.email };
            window.sessionStorage.setItem('id', user.uid);
            this.router.navigate([`/Inicio/${user.uid}`]);
          }
        }, () => {
          Notiflix.Loading.remove();
          window.sessionStorage.setItem('id', user.uid);
          this.router.navigate([`/Inicio/${user.uid}`]);
        });
      })
      .catch((authErr) => {
        // 2. Si falla en Firebase Auth (por ejemplo usuario antiguo de usersPublic antes de migrar a Auth)
        this.subscriptionLogin = this.authService
          .getUser(emailLimpio, passLimpia)
          .subscribe((res: any) => {
            Notiflix.Loading.remove();
            if (res && res.length > 0 && res[0]) {
              this.authService.user = res[0];
              window.sessionStorage.setItem('id', res[0].id);
              this.router.navigate([`/Inicio/${res[0].id}`]);
            } else {
              if (authErr.code === 'auth/wrong-password') {
                Notiflix.Notify.failure('Contraseña incorrecta.');
              } else if (authErr.code === 'auth/user-not-found') {
                Notiflix.Notify.failure('No existe una cuenta registrada con este correo.');
              } else {
                Notiflix.Notify.failure('Usuario o contraseña incorrectos.');
              }
            }
          }, () => {
            Notiflix.Loading.remove();
            Notiflix.Notify.failure('Usuario o contraseña incorrectos.');
          });
      });
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
