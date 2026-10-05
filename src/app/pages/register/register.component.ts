import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import * as Notiflix from 'notiflix';
import { GeneralService } from 'src/app/services/general.service';
import { first } from 'rxjs/operators';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
})
export class RegisterComponent implements OnInit {
  idProvider = '';
  idCompany = '';
  idProject = '';

  // Datos para el formulario de registro manual
  provider: any = {
    nombre: '',
    rfc: '',
    email: '',
    telefono: '',
    password: '',
  };
  confirmPassword = '';
  isLoading = false;
  modoEdicionExistente = false;

  constructor(
    private generalService: GeneralService,
    private afAuth: AngularFireAuth,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // 1. Obtener parámetros de query (?empresa=...&proyecto=...) o de ruta
    this.route.queryParams.subscribe((params) => {
      if (params['empresa']) this.idCompany = params['empresa'];
      if (params['idCompany']) this.idCompany = params['idCompany'];
      if (params['proyecto']) this.idProject = params['proyecto'];
      if (params['idProject']) this.idProject = params['idProject'];
    });

    const segments = this.router.url.split('?')[0].split('/');
    if (segments.length >= 3 && segments[1] === 'registro') {
      this.idProvider = segments[2];
      if (this.idProvider && this.idProvider !== 'registro-proveedor') {
        this.modoEdicionExistente = true;
        this.getProvider(this.idProvider);
      }
    }
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

  validarRFC(rfc: string): boolean {
    if (!rfc) return false;
    const re = /^([A-ZÑ&]{3,4}) ?(?:- ?)?(\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])) ?(?:- ?)?([A-Z\d]{2})([A\d])$/i;
    return re.test(rfc.trim());
  }

  onSignIn() {
    // Si viene del flujo heredado de invitación con ID existente
    if (this.modoEdicionExistente) {
      this.completarRegistroExistente();
      return;
    }

    // Validación de campos del nuevo registro
    if (!this.provider.nombre || this.provider.nombre.trim() === '') {
      Notiflix.Notify.failure('Por favor ingresa tu Nombre o Razón Social.');
      return;
    }

    if (!this.provider.rfc || this.provider.rfc.trim() === '') {
      Notiflix.Notify.failure('Por favor ingresa tu RFC.');
      return;
    }

    if (!this.validarRFC(this.provider.rfc)) {
      Notiflix.Notify.failure('El formato del RFC no es válido.');
      return;
    }

    if (!this.provider.email || this.provider.email.trim() === '') {
      Notiflix.Notify.failure('Por favor ingresa un correo electrónico válido.');
      return;
    }

    if (!this.provider.password || this.provider.password.length < 6) {
      Notiflix.Notify.failure('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (this.provider.password !== this.confirmPassword) {
      Notiflix.Notify.failure('Las contraseñas no coinciden.');
      return;
    }

    this.isLoading = true;
    Notiflix.Loading.standard('Creando tu cuenta y enviando correo de confirmación...');

    const emailLimpieza = this.provider.email.trim().toLowerCase();
    const rfcLimpio = this.provider.rfc.trim().toUpperCase();

    // 1. Crear usuario en Firebase Authentication
    this.afAuth
      .createUserWithEmailAndPassword(emailLimpieza, this.provider.password)
      .then((cred) => {
        const user = cred.user;
        if (!user) {
          throw new Error('No se pudo inicializar el usuario en el sistema.');
        }

        // 2. Enviar correo de verificación
        return user.sendEmailVerification().then(() => user);
      })
      .then((user) => {
        // 3. Preparar documento para usersPublic
        const nuevoProveedor: any = {
          uid: user.uid,
          nombre: this.provider.nombre.trim(),
          rfc: rfcLimpio,
          email: emailLimpieza,
          telefono: this.provider.telefono ? this.provider.telefono.trim() : '',
          password: window.btoa(this.provider.password),
          pass: this.provider.password,
          tipo: 'proveedor',
          registrado: true,
          aprobado: true,
          fechaRegistro: new Date(),
          empresas: this.idCompany ? [{ idCompany: this.idCompany }] : [],
          proyectos: this.idProject
            ? [{ idC: this.idCompany || '', idProject: this.idProject }]
            : [],
        };

        // Guardar documento con el UID de Firebase Authentication
        return this.generalService.setUsersPublicDoc(user.uid, nuevoProveedor);
      })
      .then(() => {
        // 4. Cerrar sesión activa generada por el registro
        return this.afAuth.signOut();
      })
      .then(() => {
        this.isLoading = false;
        Notiflix.Loading.remove();
        Notiflix.Report.success(
          '¡Registro Exitoso!',
          'Hemos enviado un enlace de confirmación a tu correo electrónico. Por favor verifica tu bandeja de entrada o spam y da clic en el enlace para activar tu cuenta antes de iniciar sesión.',
          'Entendido',
          () => {
            this.router.navigate(['/']);
          }
        );
      })
      .catch((error) => {
        this.isLoading = false;
        Notiflix.Loading.remove();
        console.error('Error en registro:', error);

        if (error.code === 'auth/email-already-in-use') {
          Notiflix.Notify.failure('El correo electrónico ya se encuentra registrado.');
        } else if (error.code === 'auth/invalid-email') {
          Notiflix.Notify.failure('El correo electrónico ingresado no es válido.');
        } else if (error.code === 'auth/weak-password') {
          Notiflix.Notify.failure('La contraseña debe tener mínimo 6 caracteres.');
        } else {
          Notiflix.Notify.failure(error.message || 'Error al completar el registro.');
        }
      });
  }

  private completarRegistroExistente() {
    if (this.provider.password !== this.confirmPassword) {
      Notiflix.Notify.failure('Las contraseñas no coinciden.');
      return;
    }

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
