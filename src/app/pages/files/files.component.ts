import { Component, OnInit, OnDestroy } from '@angular/core';
import { AngularFireStorage } from '@angular/fire/compat/storage';
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
  archivoLinea = {
    constanciaSF: {
      link: '',
      nameFile: '',
      path: '',
    },
    opCump32D: {
      link: '',
      nameFile: '',
      path: '',
    },
    fecha: '',
    observacion: '',
    status: '',
  };

  file: any;

  mesActual = new Date().getMonth() + 1;

  userSubscription: Subscription | undefined;
  providerSubscription: Subscription | undefined;

  constructor(
    private authService: AuthService,
    private generalService: GeneralService,
    private storage: AngularFireStorage
  ) {}

  ngOnInit(): void {
    this.getUserDB(this.authService.idUser);
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
        this.files();
      });
  }

  mesATexto(value: number) {
    let letrasMes = '';
    switch (value) {
      case 1:
        letrasMes = 'Enero';
        break;
      case 2:
        letrasMes = 'Febrero';
        break;
      case 3:
        letrasMes = 'Marzo';
        break;
      case 4:
        letrasMes = 'Abril';
        break;
      case 5:
        letrasMes = 'Mayo';
        break;
      case 6:
        letrasMes = 'Junio';
        break;
      case 7:
        letrasMes = 'Julio';
        break;
      case 8:
        letrasMes = 'Agosto';
        break;
      case 9:
        letrasMes = 'Septiembre';
        break;
      case 10:
        letrasMes = 'Octubre';
        break;
      case 11:
        letrasMes = 'Noviembre';
        break;
      case 12:
        letrasMes = 'Diciembre';
        break;
    }
    return letrasMes;
  }

  files() {
    const date = new Date(this.provider.fechaRegistro.seconds * 1000);
    const mesRegistro = date.getMonth() + 1;
    const mesActual = new Date().getMonth() + 1;
    const year = date.getFullYear();
    console.log('Mes de registro', mesRegistro);
    console.log('Mes actual', mesActual);
    console.log('Año de registro', year);

    const prueba = this.mesATexto(1);
    console.log(prueba);
  }

  uploadFile(event: any, nameFile: string) {
    const fileInput = event.target.files[0];
    const fileType = fileInput.type;
    const fileSize = fileInput.size;
    const allowedExtensions = /(.pdf)$/i;
    let uploadF: any = '';
    if (!allowedExtensions.exec(fileType) || fileSize >= 4000000) {
      alert(
        'Por favor agrega unicamente archivos con extension .pdf y tamaño maximo de 4MB '
      );
      // document.getElementById('labelFile').innerHTML = 'Seleccionar';
      (<any>document.getElementById('inputFileCSF')).value = '';
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
        date.getFullYear();
      const filePath = `proveedoresExtra/${this.provider.rfc}/${nameFile}/${fecha}`;
      const path: any = {};
      path.pathImageProfile = filePath;
      const ref = this.storage.ref(filePath);
      const task = this.storage.upload(filePath, uploadF);
      task.then((res: any) => {
        ref.getDownloadURL().subscribe((resultado: any) => {
          const objFile = {
            fecha: new Date(),
            mes: this.mesATexto(this.mesActual),
            link: resultado,
            path: filePath,
            name: fileInput.name,
            status: 'En revisión',
          };

          if (!this.provider.files[nameFile]) {
            this.provider.files[nameFile] = [];
          }
          this.provider.files[nameFile].push(objFile);
          // Actualizar Proveedor
          this.updateFiles();
          console.log(this.provider);
        });
      });
    }
  }

  updateFiles() {
    this.generalService.updateFilesUserDB(this.provider).then((res) => {
      console.log(res);
    });
  }

  ngOnDestroy(): void {}
}
