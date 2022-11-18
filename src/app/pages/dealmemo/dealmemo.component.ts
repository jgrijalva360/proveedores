import { Component, OnInit } from '@angular/core';
import { Notify } from 'notiflix/build/notiflix-notify-aio';
import { AuthService } from 'src/app/services/auth.service';
import { GeneralService } from 'src/app/services/general.service';

@Component({
  selector: 'app-dealmemo',
  templateUrl: './dealmemo.component.html',
  styleUrls: ['./dealmemo.component.css'],
})
export class DealmemoComponent implements OnInit {
  dealMemo = {
    personasPS: [],
    pagos: [],
  } as any;
  persona = {} as any;
  provider = {} as any;
  suma = 0;
  objMovimientos = {} as any;
  periods: any;
  usuario = {
    persona: '',
  } as any;

  constructor(
    private generalService: GeneralService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    console.log(this.dealMemo);

    this.authService.userData$?.subscribe((res: any) => {
      console.log(res);
      this.getUserDB(res.uid);
    });
  }

  getUserDB(uid: string) {
    this.generalService.getUserDB(uid).subscribe((res: any) => {
      console.log(res);
      this.usuario = res;
    });
  }

  addPeople() {
    if (this.persona.nombre && this.persona.rfc && this.persona.puesto) {
      this.dealMemo.personasPS.push(this.persona);
      this.persona = {};
      document.getElementById('nombrePS')?.focus();
    } else {
      Notify.failure('Ingresa todos los datos');
    }
  }

  rfcValido(rfc: string, aceptarGenerico = true) {
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

  totales() {
    this.suma = 0;
    this.dealMemo.pagos.forEach((element: any) => {
      this.suma += element.importe;
    });
  }
}
