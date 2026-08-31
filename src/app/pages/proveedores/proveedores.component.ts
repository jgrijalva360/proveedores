import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { GeneralService } from 'src/app/services/general.service';
import { AuthService } from 'src/app/services/auth.service';
import * as Notiflix from 'notiflix';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-proveedores',
  templateUrl: './proveedores.component.html',
  styleUrls: ['./proveedores.component.css'],
})
export class ProveedoresComponent implements OnInit, OnDestroy {
  idUser: string = '';
  user: any = {};
  proyectosAsignados: any[] = [];
  cargando: boolean = true;
  subscriptionUser: Subscription | undefined;

  constructor(
    private generalService: GeneralService,
    private authService: AuthService,
    private router: Router,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.idUser = window.sessionStorage.getItem('id') || '';
    if (!this.idUser) {
      this.router.navigateByUrl('/');
      return;
    }
    this.getUserProfile();
  }

  getUserProfile(): void {
    this.cargando = true;
    this.subscriptionUser = this.generalService
      .getUserId(this.idUser)
      .subscribe((res: any) => {
        if (!res) {
          this.router.navigateByUrl('/');
          return;
        }
        this.user = res;
        console.log('Usuario obtenido de usersPublic:', this.user);

        let listaProyectos: any[] = [];

        // 1. Si el usuario tiene arreglo 'proyectos'
        if (this.user.proyectos && Array.isArray(this.user.proyectos) && this.user.proyectos.length > 0) {
          listaProyectos = this.user.proyectos.map((p: any) => this.normalizarProyecto(p));
        }
        // 2. Si tiene empresa y proyecto asignados en el objeto raíz o como string
        else {
          const idCompany =
            this.user.idCompany ||
            this.user.empresa?.idCompany ||
            this.user.empresa?.id ||
            (typeof this.user.empresa === 'string' ? this.user.empresa : '') ||
            (Array.isArray(this.user.empresas) && this.user.empresas[0]?.idCompany ? this.user.empresas[0].idCompany : '');

          const idProject =
            this.user.idProject ||
            this.user.proyecto?.idProject ||
            this.user.proyecto?.id ||
            (typeof this.user.proyecto === 'string' ? this.user.proyecto : '');

          const nombreEmpresa =
            this.user.nombreEmpresa ||
            this.user.nameCompany ||
            this.user.empresa?.nameCompany ||
            this.user.empresa?.nombre ||
            this.user.empresa?.razonSocial ||
            '';

          const nombreProyecto =
            this.user.nombreProyecto ||
            this.user.nameProject ||
            this.user.proyecto?.nameProject ||
            this.user.proyecto?.nombre ||
            '';

          if (idCompany && idProject) {
            listaProyectos = [
              {
                idCompany,
                nombreEmpresa,
                idProject,
                nombreProyecto,
                depto: this.user.departamento?.name || this.user.depto || 'General',
              },
            ];
          } else if (idCompany) {
            this.generalService.getCompanyProjects(idCompany).subscribe((projs: any[]) => {
              const items = projs.map((p) => ({
                idCompany: idCompany,
                nombreEmpresa: nombreEmpresa,
                idProject: p.idProject || p.id,
                nombreProyecto: p.nameProject || p.nombre || '',
                depto: this.user.departamento?.name || this.user.depto || 'General',
              }));
              this.proyectosAsignados = items;
              this.cargando = false;
              this.buscarNombresEnFirestore();
            });
            return;
          }
        }

        this.proyectosAsignados = listaProyectos;
        this.cargando = false;
        this.cd.detectChanges();

        // Consultar nombres en Firestore en tiempo real para enriquecer cualquier dato faltante
        this.buscarNombresEnFirestore();
      });
  }

  private normalizarProyecto(p: any): any {
    return {
      idCompany:
        p.idCompany ||
        p.idC ||
        p.idEmpresa ||
        (p.empresa?.idCompany || p.empresa?.id) ||
        (this.user.empresa?.idCompany || this.user.empresa?.id) ||
        (Array.isArray(this.user.empresas) && this.user.empresas[0]?.idCompany) ||
        '',
      nombreEmpresa:
        p.nombreEmpresa ||
        p.nameCompany ||
        p.empresa?.nameCompany ||
        p.empresa?.nombre ||
        p.empresa?.razonSocial ||
        this.user.nombreEmpresa ||
        this.user.nameCompany ||
        this.user.empresa?.nameCompany ||
        '',
      idProject:
        p.idProject ||
        p.idP ||
        p.idProyecto ||
        p.id ||
        (p.proyecto?.idProject || p.proyecto?.id) ||
        '',
      nombreProyecto:
        p.nombreProyecto ||
        p.nameProject ||
        p.nombre ||
        p.proyecto?.nameProject ||
        p.proyecto?.nombre ||
        this.user.nombreProyecto ||
        this.user.nameProject ||
        '',
      depto: p.depto || p.departamento?.name || this.user.departamento?.name || 'General',
    };
  }

  /**
   * Consulta directa de colecciones maestras para actualizar los nombres en pantalla
   */
  private buscarNombresEnFirestore(): void {
    if (!this.proyectosAsignados || this.proyectosAsignados.length === 0) {
      return;
    }

    this.proyectosAsignados.forEach((item) => {
      // Si no tiene nombreEmpresa o es genérico, consultar empresas/{idCompany}
      if (item.idCompany && (!item.nombreEmpresa || item.nombreEmpresa === 'Empresa')) {
        this.generalService.getCompany(item.idCompany).subscribe((emp: any) => {
          if (emp) {
            item.nombreEmpresa = emp.nameCompany || emp.nombre || emp.razonSocial || emp.name || item.nombreEmpresa || item.idCompany;
            this.cd.detectChanges();
          }
        });
      }

      // Si no tiene nombreProyecto o es genérico, consultar empresas/{idCompany}/proyectos/{idProject}
      if (item.idCompany && item.idProject && (!item.nombreProyecto || item.nombreProyecto === 'Proyecto')) {
        this.generalService.getproject(item.idCompany, item.idProject).subscribe((proj: any) => {
          if (proj) {
            item.nombreProyecto = proj.nameProject || proj.nombre || proj.name || item.nombreProyecto || item.idProject;
            this.cd.detectChanges();
          }
        });
      }
    });
  }

  seleccionarProyecto(proyecto: any): void {
    console.log('Proyecto seleccionado:', proyecto);

    const idCompany = proyecto.idCompany || proyecto.idEmpresa || proyecto.idC;
    const idProject = proyecto.idProject || proyecto.idProyecto || proyecto.idP || proyecto.id;

    if (!idCompany || !idProject) {
      console.error('Proyecto sin IDs válidos:', proyecto);
      Notiflix.Notify.warning('El proyecto seleccionado no cuenta con identificador de empresa o proyecto válido.');
      return;
    }

    // Guardar el contexto del proyecto activo en sesión
    window.sessionStorage.setItem('idCompany', idCompany);
    window.sessionStorage.setItem('idProject', idProject);
    window.sessionStorage.setItem('nombreProyecto', proyecto.nombreProyecto || proyecto.nameProject || '');
    window.sessionStorage.setItem('nombreEmpresa', proyecto.nombreEmpresa || proyecto.nameCompany || '');
    window.sessionStorage.setItem('projectSelected', JSON.stringify(proyecto));

    // Navegar al dashboard del proyecto con el RFC o ID del proveedor
    const rfcParam = this.user.rfc || this.idUser;
    this.router.navigate([`Inicio/${rfcParam}/pagosPendientes`]);
  }

  ngOnDestroy(): void {
    this.subscriptionUser?.unsubscribe();
  }
}
