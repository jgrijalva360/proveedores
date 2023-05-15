import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { Provider, Bank } from 'src/app/models/providers';
import { AuthService } from 'src/app/services/auth.service';
import { GeneralService } from 'src/app/services/general.service';
import { Notify } from 'notiflix/build/notiflix-notify-aio';
import { AngularFireStorage } from '@angular/fire/compat/storage';

@Component({
  selector: 'app-provider',
  templateUrl: './provider.component.html',
  styleUrls: ['./provider.component.css'],
})
export class ProviderComponent implements OnInit, OnDestroy {
  provider = {} as any;
  banco = {} as Bank;
  idUser: any;
  arrRepse = [
    {
      name: 'Registro validado ante la secretaria del Trabajo y Previsión Social.',
      camelCase: 'regSTPS',
      archivo: {},
      status: 'Pendiente',
      observaciones: '',
    },
    {
      name: 'Listado del personal que estará a disposición',
      camelCase: 'listadoPersonal',
      archivo: {},
      status: 'Pendiente',
      observaciones:
        'con su nombre, CURP, numero de seguridad social (Para verificar los nombre en los cfdi, y pagos de seguridad social, verificar que no hayan sido trabajadores de la contratante) (Art 15-D CFF) (Art 27 Frac. V Párrafo. 3 LISR)',
    },
    {
      name: 'Opinión de cumplimiento Positiva IMSS',
      camelCase: 'imss',
      archivo: {},
      status: 'Pendiente',
      observaciones: '',
    },
    {
      name: 'Opinión de cumplimiento Positiva INFONAVIT',
      camelCase: 'infonavit',
      archivo: {},
      status: 'Pendiente',
      observaciones: '',
    },
  ];

  userSubscription: Subscription | undefined;
  providerSubscription: Subscription | undefined;

  constructor(
    private generalService: GeneralService,
    private authService: AuthService,
    private storage: AngularFireStorage
  ) {}

  ngOnInit(): void {
    this.idUser = window.sessionStorage.getItem('id') || '';
    console.log(this.idUser);
    this.getUserDB();
  }

  getUserDB() {
    this.providerSubscription = this.generalService
      .getUserDB(this.idUser)
      .subscribe((res: any) => {
        this.provider = res;
        if (this.provider.banks === undefined) {
          this.provider.banks = [];
        }
        console.log(this.provider);
      });
  }

  addBank() {
    if (this.banco.clabe && this.banco.nombre) {
      if (this.banco.clabe.length === 18) {
        console.log(this.banco);
        this.provider.banks.push(this.banco);
        this.banco = {} as Bank;
      } else {
        Notify.failure('La cuenta CLABE debe contener 18 digitos');
      }
    }
  }
  deleteBank(index: number) {
    this.provider.banks.splice(index, 1);
  }

  saveData() {
    this.generalService.saveUserDB(this.provider, this.idUser).then(() => {
      console.log('Se guardo correctamente');
      Notify.success('Tus datos se actualizaron correctamente');
    });
  }

  uploadFile(event: any, archivo: any, index: number) {
    const fileInput = event.target.files[0];
    const fileType = fileInput.type;
    const fileSize = fileInput.size;
    const allowedExtensions = /(.pdf)$/i;
    let uploadF: any = '';
    if (!allowedExtensions.exec(fileType) || fileSize >= 1000000) {
      alert(
        'Por favor agrega unicamente archivos con extension .pdf y tamaño maximo de 1MB '
      );
      // document.getElementById('labelFile').innerHTML = 'Seleccionar';
      (<any>document.getElementById('inputGroupFile01')).value = '';
    } else {
      uploadF = event.target.files[0];
      // document.getElementById('labelFile').innerHTML = uploadF.name;
      const id = Math.random().toString(36).substring(2);
      const date = new Date();
      const fecha =
        date.getDate() +
        '-' +
        (date.getMonth() + 1).toString().padStart(2, '0') +
        '-' +
        date.getFullYear() +
        '-' +
        id;
      const filePath = `proveedoresExtra/${this.provider.rfc}/${archivo.camelCase}/${fecha}`;
      const path: any = {};
      path.pathImageProfile = filePath;
      const ref = this.storage.ref(filePath);
      const task = this.storage.upload(filePath, uploadF);
      task.then((res: any) => {
        ref.getDownloadURL().subscribe((resultado: any) => {
          this.provider.archivos[index].archivo.link = resultado;
          this.provider.archivos[index].archivo.path = filePath;
          this.provider.archivos[index].archivo.name = fileInput.name;
          this.provider.archivos[index].status = 'En revision';
          // Actualizar Proveedor
          this.updateFiles();
          console.log(this.provider);
        });
      });
    }
  }

  updateFiles() {
    this.generalService
      .updateFilesUserDB(this.idUser, this.provider)
      .then((res) => {
        console.log(res);
      });
  }

  addFileRepse() {
    if (this.provider.repse === 'Si') {
      this.provider.archivosRepse = this.arrRepse;
    } else if (this.provider.repse === 'No') {
      delete this.provider.archivosRepse;
    }
  }

  ngOnDestroy(): void {
    this.providerSubscription?.unsubscribe();
    this.userSubscription?.unsubscribe();
  }
}
