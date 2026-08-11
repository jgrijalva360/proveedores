import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import * as Notiflix from 'notiflix';
import { timeout } from 'rxjs';
import { GeneralService } from 'src/app/services/general.service';

@Component({
  selector: 'app-form-orden',
  templateUrl: './form-orden.component.html',
  styleUrls: ['./form-orden.component.css']
})
export class FormOrdenComponent implements OnInit {
  idCompany: string = '';
  idProject: string = '';
  dataForm: any = {};
  rfcInvalido: boolean = false;
  deleteElement: boolean = false;
  existePreOrden: boolean = false;
  formulario = {} as NgForm;

  constructor(
    private generalService: GeneralService,
    private router: Router
  ) {}

  ngOnInit() {
    // Obtener los parámetros de la URL
    const url = this.router.url;
    const segments = url.split('/');
    this.idCompany = segments[1] || '';
    this.idProject = segments[2] || '';
    this.validarURL();
  }

  validarURL() {
    this.generalService
      .getproject(this.idCompany, this.idProject)
      .subscribe(project => {
        if (!project) {
          Notiflix.Notify.failure('URL inválida. Redirigiendo al inicio...');
          this.router.navigate(['/']);
        } else {
          // console.log('Proyecto encontrado:', project);
          setTimeout(() => {
            (<any>document.getElementById('loading')).classList.add('ocultar');
            setTimeout(() => {
              this.deleteElement = true;
            }, 1000);
          }, 2000);
        }
      });
  }

  sendForm(form: NgForm) {
    console.log('Enviando formulario...', this.dataForm);
    this.formulario = form;
    if (form.invalid) {
      Notiflix.Notify.failure(
        'Por favor, completa todos los campos requeridos.'
      );
      // Marcamos todos los campos como 'touched' para activar el CSS rojo
      Object.values(form.controls).forEach(control => {
        control.markAsTouched();
      });
      return;
    }
    this.validarInformacion();
  }

  validarInformacion() {
    if (this.rfcInvalido) {
      Notiflix.Notify.failure(
        'RFC inválido. Por favor, corrige el RFC antes de enviar.'
      );
      return;
    }

    if (!this.dataForm.terminos) {
      Notiflix.Notify.failure('Debes aceptar los términos y condiciones.');
      return;
    }

    if (this.existePreOrden) {
      Notiflix.Notify.info('Ya existe un registro para este RFC.');
      return;
    }

    this.savePreOrden();
  }

  validarRFC() {
    this.rfcInvalido = !this.rfcValido(this.dataForm.rfc);
    this.existePreOrden = false; // Reiniciar el estado de existencia de pre-orden al cambiar el RFC
    if (!this.rfcInvalido) {
      this.getPreOrden();
    }
  }

  rfcValido(rfc: string) {
    rfc = rfc.toUpperCase();
    const aceptarGenerico = true;
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
      return true;
      // return rfcSinDigito + digitoVerificador;
    }
  }

  getPreOrden() {
    this.generalService
      .getPreOrden(this.idCompany, this.idProject, this.dataForm.rfc)
      .subscribe((preOrden: any) => {
        if (preOrden.length > 0) {
          // console.log('Pre-orden encontrada:', preOrden);
          this.existePreOrden = true;
        } else {
          // console.log('No se encontró una pre-orden para este proyecto');
          this.existePreOrden = false;
        }
      });
  }

  clearForm(form: NgForm) {
    Notiflix.Confirm.show(
      'Limpiar formulario',
      '¿Estás seguro de que deseas limpiar el formulario? Se perderán todos los datos ingresados.',
      'Sí, limpiar',
      'No, cancelar',
      () => {
        Notiflix.Notify.success('Formulario limpiado');
        form.resetForm();
        this.dataForm = {};
      },
      () => {
        // Notiflix.Notify.info('Acción cancelada');
      }
    );
  }

  savePreOrden() {
    this.generalService
      .addPreOrden(this.idCompany, this.idProject, this.dataForm)
      .then(() => {
        Notiflix.Notify.success('Guardado exitoso');
        this.formulario.resetForm();
        this.dataForm = {};
      })
      .catch(error => {
        console.error('Error al guardar:', error);
        Notiflix.Notify.failure('Error al guardar');
      });
  }
}
