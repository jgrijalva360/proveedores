import { Component, OnInit, OnDestroy } from '@angular/core';
import { GeneralService } from 'src/app/services/general.service';
import * as Notiflix from 'notiflix';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-archivos-mes',
  templateUrl: './archivos-mes.component.html',
  styleUrls: ['./archivos-mes.component.css'],
})
export class ArchivosMesComponent implements OnInit, OnDestroy {
  idUser: string = '';
  user: any = {};
  idCompany: string = '';
  idProject: string = '';
  nombreProyecto: string = '';
  nombreEmpresa: string = '';
  today: Date = new Date();
  mesActualNombre: string = '';

  // Estatus de los archivos del mes actual del usuario
  archivosMesActual: any = {
    CSF: null,
    '32D': null,
  };

  arrOrdersProveedor: any[] = [];
  cargando: boolean = true;
  subUser: Subscription | undefined;
  subOrders: Subscription | undefined;

  constructor(
    private generalService: GeneralService,
    public storage: AngularFireStorage,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.today = new Date();
    this.mesActualNombre = this.today.toLocaleString('es-MX', { month: 'long' }).toLowerCase();
    this.idUser = window.sessionStorage.getItem('id') || '';
    this.idCompany = window.sessionStorage.getItem('idCompany') || '';
    this.idProject = window.sessionStorage.getItem('idProject') || '';
    this.nombreProyecto = window.sessionStorage.getItem('nombreProyecto') || 'Proyecto';
    this.nombreEmpresa = window.sessionStorage.getItem('nombreEmpresa') || 'Empresa';

    this.obtenerDatosUsuario();
  }

  obtenerDatosUsuario(): void {
    if (!this.idUser) {
      this.router.navigateByUrl('/');
      return;
    }

    this.cargando = true;
    this.subUser = this.generalService.getUserId(this.idUser).subscribe((res: any) => {
      this.cargando = false;
      if (!res) return;
      this.user = res;

      if (!this.idCompany) {
        this.idCompany = res.empresa?.idCompany || (Array.isArray(res.empresas) && res.empresas[0]?.idCompany) || '';
      }
      if (!this.idProject) {
        this.idProject = res.proyecto?.idProject || (Array.isArray(res.proyectos) && res.proyectos[0]?.idProject) || '';
      }

      this.procesarArchivosMes();
      this.obtenerOrdenesParaSincronizar();
    });
  }

  procesarArchivosMes(): void {
    const archivosUser = this.user.archivosMensuales || this.user.archivos || {};
    
    // Obtenemos los datos para el mes actual
    this.archivosMesActual = {
      CSF: archivosUser?.CSF?.[this.mesActualNombre] || null,
      '32D': archivosUser?.['32D']?.[this.mesActualNombre] || null,
    };
    this.generalService.calcularResumenArchivos(this.user, this.arrOrdersProveedor);
  }

  obtenerOrdenesParaSincronizar(): void {
    if (this.idCompany && this.idProject && this.user.rfc) {
      this.subOrders = this.generalService
        .getOrdenes(this.idCompany, this.idProject, 'rfc', this.user.rfc)
        .subscribe((orders: any[]) => {
          this.arrOrdersProveedor = orders || [];
        });
    }
  }

  onFileChangePDF(ev: any, tipoDoc: 'CSF' | '32D'): void {
    const file = ev.target.files[0];
    if (!file) return;

    const allowedExtensions = /(.pdf)$/i;
    if (!allowedExtensions.exec(file.type) && !file.name.toLowerCase().endsWith('.pdf')) {
      Notiflix.Notify.failure('Por favor agrega únicamente archivos con extensión .pdf');
      return;
    }

    if (file.size > 5000000) {
      Notiflix.Notify.failure('El archivo no debe exceder 5MB de tamaño');
      return;
    }

    Notiflix.Loading.standard('Subiendo archivo fiscal...');

    const rfc = this.user.rfc || 'PROV';
    const depto = this.user.departamento?.name || this.user.depto || 'General';
    const proyNombre = this.nombreProyecto || this.user.proyecto?.nameProject || 'Proyecto';

    // Ruta en Storage
    const filePath = `CFDIs/${proyNombre}/${depto}/${rfc}/${tipoDoc}/${this.mesActualNombre}/${file.name}`;
    const task = this.storage.upload(filePath, file);

    task.then(() => {
      Notiflix.Loading.remove();
      Notiflix.Notify.success(`Se subió correctamente el documento ${tipoDoc}`);
      this.guardarEnDocumentoUsuarioYOrdenes(tipoDoc, filePath, file.name);
    }).catch((err) => {
      Notiflix.Loading.remove();
      Notiflix.Notify.failure('Error al subir a storage: ' + err.message);
    });
  }

  guardarEnDocumentoUsuarioYOrdenes(tipoDoc: 'CSF' | '32D', filePath: string, fileName: string): void {
    const archivos = this.user.archivosMensuales || this.user.archivos || {};
    
    if (!archivos[tipoDoc]) {
      archivos[tipoDoc] = {};
    }

    const docData = {
      fechaCargado: new Date().toISOString(),
      pathPDF: filePath,
      fileName: fileName,
      estatus: 'EN REVISIÓN',
      observaciones: ''
    };

    archivos[tipoDoc][this.mesActualNombre] = docData;

    Notiflix.Loading.standard('Actualizando registros...');

    // 1. Guardar en el documento del usuario en usersPublic
    const p1 = this.generalService.saveUserDB({ archivosMensuales: archivos }, this.idUser);

    // 2. Sincronizar en las órdenes de compra activas del proyecto para ocgeneratorsols
    const p2 = this.arrOrdersProveedor.map((order) => {
      const orderArchivos = order.archivos || {};
      if (!orderArchivos[tipoDoc]) {
        orderArchivos[tipoDoc] = {};
      }
      orderArchivos[tipoDoc][this.mesActualNombre] = docData;

      return this.generalService.updateOrden(this.idCompany, this.idProject, order.id, {
        archivos: orderArchivos
      });
    });

    Promise.all([p1, ...p2])
      .then(() => {
        Notiflix.Loading.remove();
        Notiflix.Notify.success('Documentación registrada con éxito para revisión');
        this.generalService.calcularResumenArchivos(this.user, this.arrOrdersProveedor);
      })
      .catch((err) => {
        Notiflix.Loading.remove();
        Notiflix.Notify.failure('Error al actualizar datos: ' + err.message);
      });
  }

  downloadFilePDF(path: string): void {
    if (!path) return;
    Notiflix.Loading.standard('Generando enlace de descarga...');
    this.storage
      .ref(path)
      .getDownloadURL()
      .subscribe({
        next: (url) => {
          Notiflix.Loading.remove();
          window.open(url, '_blank');
        },
        error: (err) => {
          Notiflix.Loading.remove();
          Notiflix.Notify.failure('No se pudo obtener el archivo: ' + err.message);
        }
      });
  }

  deleteFilePDF(tipoDoc: 'CSF' | '32D', path: string): void {
    if (!confirm(`¿Estás seguro de eliminar el archivo de ${tipoDoc} correspondiente a este mes?`)) {
      return;
    }

    Notiflix.Loading.standard('Eliminando archivo...');

    const removerDeBD = () => {
      const archivos = this.user.archivosMensuales || this.user.archivos || {};
      if (archivos[tipoDoc] && archivos[tipoDoc][this.mesActualNombre]) {
        delete archivos[tipoDoc][this.mesActualNombre];
      }

      const p1 = this.generalService.saveUserDB({ archivosMensuales: archivos }, this.idUser);

      const p2 = this.arrOrdersProveedor.map((order) => {
        const orderArchivos = { ...order.archivos };
        if (orderArchivos[tipoDoc] && orderArchivos[tipoDoc][this.mesActualNombre]) {
          delete orderArchivos[tipoDoc][this.mesActualNombre];
          return this.generalService.updateOrden(this.idCompany, this.idProject, order.id, {
            archivos: orderArchivos
          });
        }
        return Promise.resolve();
      });

        Promise.all([p1, ...p2])
        .then(() => {
          Notiflix.Loading.remove();
          Notiflix.Notify.success('Archivo eliminado correctamente');
          this.generalService.calcularResumenArchivos(this.user, this.arrOrdersProveedor);
        })
        .catch((err) => {
          Notiflix.Loading.remove();
          Notiflix.Notify.failure('Error al actualizar registro: ' + err.message);
        });
    };

    if (path) {
      this.storage
        .ref(path)
        .delete()
        .subscribe({
          next: () => removerDeBD(),
          error: () => removerDeBD()
        });
    } else {
      removerDeBD();
    }
  }

  ngOnDestroy(): void {
    this.subUser?.unsubscribe();
    this.subOrders?.unsubscribe();
  }
}
