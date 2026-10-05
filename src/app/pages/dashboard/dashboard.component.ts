import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  GeneralService,
  ResumenPagos,
  ResumenArchivosMensuales,
} from 'src/app/services/general.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  idUser: string = '';
  idCompany: string = '';
  idProject: string = '';
  rfc: string = '';
  user: any = {};
  providerUser: any = null;
  ultimasOrdenes: any[] = [];

  tieneOC: boolean = false;
  verificandoOC: boolean = true;

  resumenPagos: ResumenPagos = {
    numPendientes: 0,
    tieneVencidos: false,
    tieneProximos: false,
    vencidosCount: 0,
    proximosCount: 0,
    rechazadosCount: 0,
  };

  resumenArchivos: ResumenArchivosMensuales = {
    numPendientes: 0,
    tieneRechazados: false,
    csfPendiente: false,
    d32Pendiente: false,
    csfRechazado: false,
    d32Rechazado: false,
  };

  private subUser: Subscription | undefined;
  private subProviderUser: Subscription | undefined;
  private subOrders: Subscription | undefined;
  private subResumen: Subscription | undefined;
  private subResumenArchivos: Subscription | undefined;

  constructor(
    private generalService: GeneralService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.idUser = window.sessionStorage.getItem('id') || '';
    this.idCompany = window.sessionStorage.getItem('idCompany') || '';
    this.idProject = window.sessionStorage.getItem('idProject') || '';

    // Extraer RFC de la URL (/Inicio/{rfc}/...)
    const segments = this.router.url.split('/');
    if (segments.length >= 3) {
      this.rfc = segments[2];
    }

    this.subResumen = this.generalService.resumenPagos$.subscribe((resumen) => {
      this.resumenPagos = resumen;
    });

    this.subResumenArchivos = this.generalService.resumenArchivos$.subscribe(
      (resumen) => {
        this.resumenArchivos = resumen;
      }
    );

    if (this.idUser) {
      this.obtenerDatosYVerificarOC();
    }
  }

  obtenerDatosYVerificarOC(): void {
    this.subUser = this.generalService.getUserId(this.idUser).subscribe((u: any) => {
      if (!u) return;
      this.user = u;
      if (!this.idCompany) {
        this.idCompany = u.empresa?.idCompany || '';
      }
      if (!this.idProject) {
        this.idProject = u.proyecto?.idProject || '';
      }
      if (!this.rfc) {
        this.rfc = u.rfc || '';
      }

      this.consultarOrdenes(this.rfc || u.rfc);
      this.verificarArchivosMensuales();
    });
  }

  verificarArchivosMensuales(): void {
    const rfcConsulta = this.rfc || this.user.rfc;
    if (this.user.tipo === 'admin' || this.user.tipo === 'jefeDepartamento') {
      if (rfcConsulta) {
        this.subProviderUser?.unsubscribe();
        this.subProviderUser = this.generalService
          .getUserByRFC(rfcConsulta)
          .subscribe((users: any[]) => {
            if (users && users.length > 0) {
              this.providerUser = users[0];
              this.generalService.calcularResumenArchivos(
                this.providerUser,
                this.ultimasOrdenes
              );
            }
          });
      }
    } else {
      this.generalService.calcularResumenArchivos(this.user, this.ultimasOrdenes);
    }
  }

  consultarOrdenes(rfcConsulta: string): void {
    if (!this.idCompany || !this.idProject) {
      this.tieneOC = false;
      this.verificandoOC = false;
      this.redirigirSiSinOC();
      return;
    }

    this.subOrders?.unsubscribe();

    if (this.user.tipo === 'admin') {
      this.tieneOC = true;
      this.verificandoOC = false;
      this.subOrders = this.generalService
        .getOrdenesAdmin(this.idCompany, this.idProject)
        .subscribe((ordenes: any[]) => {
          let ordenesFiltradas = ordenes || [];
          if (rfcConsulta) {
            ordenesFiltradas = ordenesFiltradas.filter(
              (o: any) => o.rfc === rfcConsulta
            );
          }
          this.ultimasOrdenes = ordenesFiltradas;
          this.generalService.calcularResumenPagos(ordenesFiltradas);
          this.generalService.calcularResumenArchivos(
            this.providerUser || this.user,
            this.ultimasOrdenes
          );
        });
    } else if (this.user.tipo === 'jefeDepartamento') {
      this.tieneOC = true;
      this.verificandoOC = false;
      this.subOrders = this.generalService
        .getOrdenes(this.idCompany, this.idProject, 'departamento', this.user.depto)
        .subscribe((ordenes: any[]) => {
          this.ultimasOrdenes = ordenes || [];
          this.generalService.calcularResumenPagos(this.ultimasOrdenes);
          this.generalService.calcularResumenArchivos(
            this.providerUser || this.user,
            this.ultimasOrdenes
          );
        });
    } else {
      if (!rfcConsulta) {
        this.tieneOC = false;
        this.verificandoOC = false;
        this.redirigirSiSinOC();
        return;
      }
      this.subOrders = this.generalService
        .getOrdenes(this.idCompany, this.idProject, 'rfc', rfcConsulta)
        .subscribe((ordenes: any[]) => {
          this.verificandoOC = false;
          this.tieneOC = ordenes && ordenes.length > 0;
          this.ultimasOrdenes = ordenes || [];
          this.generalService.calcularResumenPagos(this.ultimasOrdenes);
          this.generalService.calcularResumenArchivos(
            this.user,
            this.ultimasOrdenes
          );
          this.redirigirSiSinOC();
        });
    }
  }

  get tooltipPendientes(): string {
    if (!this.resumenPagos || this.resumenPagos.numPendientes === 0) {
      return 'No hay pagos pendientes';
    }
    const partes: string[] = [];
    if (this.resumenPagos.vencidosCount > 0) {
      partes.push(`${this.resumenPagos.vencidosCount} vencido(s)`);
    }
    if (this.resumenPagos.rechazadosCount > 0) {
      partes.push(`${this.resumenPagos.rechazadosCount} rechazado(s)`);
    }
    if (this.resumenPagos.proximosCount > 0) {
      partes.push(`${this.resumenPagos.proximosCount} próximo(s) a vencer`);
    }
    return `${this.resumenPagos.numPendientes} pago(s) pendiente(s): ${partes.join(', ')}`;
  }

  get tooltipArchivos(): string {
    if (!this.resumenArchivos || this.resumenArchivos.numPendientes === 0) {
      return 'Archivos mensuales al corriente';
    }
    const faltantes: string[] = [];
    if (this.resumenArchivos.csfPendiente) {
      faltantes.push(
        this.resumenArchivos.csfRechazado
          ? 'CSF (Rechazado)'
          : 'Constancia de Situación Fiscal (CSF)'
      );
    }
    if (this.resumenArchivos.d32Pendiente) {
      faltantes.push(
        this.resumenArchivos.d32Rechazado
          ? '32-D (Rechazado)'
          : 'Opinión de Cumplimiento 32-D'
      );
    }
    return `${this.resumenArchivos.numPendientes} archivo(s) mensual(es) pendiente(s): ${faltantes.join(', ')}`;
  }

  private redirigirSiSinOC(): void {
    // Si no tiene órdenes de compra y está intentando acceder a una ruta de OC/GXC/archivosMensuales,
    // redirigir automáticamente a la carga de CFDIs libres
    if (!this.tieneOC && !this.verificandoOC) {
      const urlActual = this.router.url;
      if (
        urlActual.includes('pagosPendientes') ||
        urlActual.includes('archivosMensuales') ||
        urlActual.includes('gastosPorComprobar')
      ) {
        const rfcParam = this.rfc || this.idUser;
        this.router.navigate([`Inicio/${rfcParam}/facturasCFDI`]);
      }
    }
  }

  ngOnDestroy(): void {
    this.subUser?.unsubscribe();
    this.subProviderUser?.unsubscribe();
    this.subOrders?.unsubscribe();
    this.subResumen?.unsubscribe();
    this.subResumenArchivos?.unsubscribe();
  }
}
