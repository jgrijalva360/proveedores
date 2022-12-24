import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
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
export class LoginComponent implements OnInit {
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

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit() {}

  onLogin() {
    this.authService
      .loginEmailUser(this.email, this.password)
      .then((res) => {
        console.log(res);
        this.router.navigate(['./home']);
      })
      .catch((err) => {
        if (err.code === 'auth/invalid-email') {
          this.errorMsg = 'Verifica el usuario';
          document.getElementById('user')?.classList.add('is-invalid');
          setTimeout(() => {
            this.errorMsg = '';
          }, 3000);
        } else {
          this.errorMsg = 'Verifica la contraseña';
          document
            .getElementById('user')
            ?.classList.replace('is-invalid', 'is-valid');
          document.getElementById('password')?.classList.add('is-invalid');
          setTimeout(() => {
            this.errorMsg = '';
          }, 3000);
        }
      });
  }

  onSignIn() {
    let regCorrecto1 = false;
    let regCorrecto2 = false;
    let regCorrecto3 = false;
    let regCorrecto4 = false;
    let regCorrecto5 = false;
    let regCorrecto6 = false;

    if (this.addUser.nombre.trim() === '') {
      document.getElementById('nombre')?.classList.add('is-invalid');
      regCorrecto1 = false;
    } else {
      document
        .getElementById('nombre')
        ?.classList.replace('is-invalid', 'is-valid');
      regCorrecto1 = true;
    }

    if (this.addUser.rfc.trim() === '') {
      document.getElementById('rfc')?.classList.add('is-invalid');
      regCorrecto2 = false;
    } else {
      document
        .getElementById('rfc')
        ?.classList.replace('is-invalid', 'is-valid');
      regCorrecto2 = true;
    }

    if (this.rfcValido(this.addUser.rfc.toUpperCase())) {
      document
        .getElementById('rfc')
        ?.classList.replace('is-invalid', 'is-valid');
      regCorrecto3 = true;
      this.addUser.rfc = this.addUser.rfc.toUpperCase();
      if (this.addUser.rfc.length === 13) {
        this.addUser.persona = 'Física';
      } else if (this.addUser.rfc.length === 12) {
        this.addUser.persona = 'Moral';
      }
    } else {
      document.getElementById('rfc')?.classList.add('is-invalid');
      regCorrecto3 = false;
    }

    if (this.addUser.email.trim() === '') {
      document.getElementById('email')?.classList.add('is-invalid');
      regCorrecto4 = false;
    } else {
      document
        .getElementById('email')
        ?.classList.replace('is-invalid', 'is-valid');
      regCorrecto4 = true;
    }

    if (this.addUser.password.trim() === '') {
      document.getElementById('pass')?.classList.add('is-invalid');
      regCorrecto5 = false;
    } else {
      document
        .getElementById('pass')
        ?.classList.replace('is-invalid', 'is-valid');
      regCorrecto5 = true;
    }

    if (
      this.addUser.confirmPass.trim() === '' &&
      this.addUser.password !== this.addUser.confirmPass
    ) {
      document.getElementById('pass2')?.classList.add('is-invalid');
      regCorrecto6 = false;
    } else {
      document
        .getElementById('pass2')
        ?.classList.replace('is-invalid', 'is-valid');
      regCorrecto6 = true;
    }

    if (
      regCorrecto1 &&
      regCorrecto2 &&
      regCorrecto3 &&
      regCorrecto4 &&
      regCorrecto5 &&
      regCorrecto6
    ) {
      // Envio los datos al servicio y me regresa el uid del usuario
      this.authService
        .addUser(this.addUser.email, this.addUser.password)
        .then((res: any) => {
          this.authService.emailVerification();
          // guardo el uid en el objeto que voy a mandar al servicio
          const objUser = {} as any;
          objUser.typeAcount = 'proveedor';
          objUser.uid = res.user.uid;
          objUser.userType = 'Usuario';
          objUser.email = res.user.email;
          objUser.nombre = this.addUser.nombre;
          objUser.rfc = this.addUser.rfc;
          objUser.persona = this.addUser.persona;
          objUser.actualizado = true;
          objUser.banks = [];
          objUser.empresas = [];
          objUser.archivos = [
            {
              name: 'Identificacion Oficial',
              camelCase: 'identificacionOficial',
              archivo: {},
              status: 'Pendiente',
              observacion: '',
            },
            {
              name: 'Caratula Estado de Cuenta',
              camelCase: 'edoCta',
              archivo: {},
              status: 'Pendiente',
              observacion:
                'antigüedad máxima de 3 meses, en donde aparezca el nombre y logo del banco, la cuenta CLABE, nombre y datos del cuentahabiente.',
            },
            {
              name: 'Constancia de Situación Fiscal',
              camelCase: 'constanciaSF',
              archivo: {},
              status: 'Pendiente',
              observacion:
                'Correspondiente al mes de su contratación, en donde se indique que la actividad o servicio es congruente con el objeto del contrato. Este documento tendrá que ser actualizado y enviado cada mes a contabilidad, para que proceda el pago.',
            },
            {
              name: 'Opinión de cumplimiento 32D positiva',
              camelCase: 'opinionCumplimiento',
              archivo: {},
              status: 'Pendiente',
              observacion:
                'Este documento tendrá que ser actualizado y enviado cada mes a contabilidad, para que proceda el pago.',
            },
            {
              name: 'Comprobante de domicilio',
              camelCase: 'comprobanteDomicilio',
              archivo: {},
              status: 'Pendiente',
              observacion:
                'No debe tener una antigüedad mayor a 3 meses (Luz, Agua, Teléfono, Predial.',
            },
          ];
          // envio el uid a la base de datos
          this.authService.addUserDB(objUser).then(() => {
            this.passAcces = '';
            this.addUser = {} as any;
            this.access = false;
          });
        })
        .catch((error) => {
          console.error(error);
          if (error.code === 'auth/auth/email-already-in-use') {
            document.getElementById('email')?.classList.add('is-invalid');
            // Notiflix.Notify.Failure(
            //   'El Email ya se encuentra registrado'
            // );
          } else if (error.code === 'auth/weak-password') {
            // Notiflix.Notify.Failure(
            //   'La contraseña debe contener minimo 6 caracteres'
            // );
          } else {
            document.getElementById('email')?.classList.add('is-invalid');
          }
        });
    }
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

  resetPass() {
    // const myModal = new bootstrap.Modal(document.getElementById('myModal'));
    // or

    const validateEmail = () => {
      // eslint-disable-next-line
      const re =
        /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

      return re.test(String(this.emailReset).toLowerCase());
    };
    if (validateEmail()) {
      this.authService
        .resetPass(this.emailReset)
        .then(() => {
          // $('#restartPass').modal('hide');
          // Notiflix.Report.Success(
          //   'Se envio correctamente',
          //   'Se te envio una liga de restablecimiento a tu correo electronico',
          //   'Ok'
          // );
        })
        .catch((err) => {
          if (err.code === 'auth/user-not-found') {
            // Notiflix.Report.Failure(
            //   'Email incorrecto',
            //   'El email no se encuentra registrado',
            //   'Ok'
            // );
          }
        });
    } else {
      // Notiflix.Notify.Failure('El email es incorrecto');
    }
  }
}
