import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';
import { GeneralService } from 'src/app/services/general.service';

@Component({
  selector: 'app-company',
  templateUrl: './company.component.html',
  styleUrls: ['./company.component.css'],
})
export class CompanyComponent implements OnInit, OnDestroy {
  empresaSeleccionada = {} as any;
  title = 'Home';
  provider = {} as any;
  usuario = {} as any;

  providerSubscription: Subscription | undefined;

  constructor(
    private generalService: GeneralService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    const idUser = window.sessionStorage.getItem('id') || '';
    if (!idUser) {
      this.router.navigateByUrl('/');
      return;
    }
    this.getUserDB(idUser);
  }

  getUserDB(idUser: string) {
    this.providerSubscription = this.generalService
      .getUserId(idUser)
      .subscribe((usuario: any) => {
        if (!usuario) {
          this.router.navigateByUrl('/');
          return;
        }
        this.usuario = usuario;
        console.log('Usuario actual:', usuario);

        if (!this.usuario.empresas) {
          this.usuario.empresas = [];
        }

        const idCompany = usuario.empresa?.idCompany || usuario.idCompany;
        if (idCompany) {
          this.generalService.getCompany(idCompany).subscribe((empresaData: any) => {
            if (empresaData) {
              empresaData.idCompany = idCompany;
              if (!this.usuario.empresas.some((e: any) => e.idCompany === idCompany)) {
                this.usuario.empresas = [empresaData, ...this.usuario.empresas];
              }
            }
          });

          this.generalService.getCompanyProjects(idCompany).subscribe((proyectos: any[]) => {
            if (proyectos) {
              const idProject = usuario.proyecto?.idProject || usuario.idProject;
              if (idProject) {
                const asignado = proyectos.filter(
                  (p: any) => p.idProject === idProject || p.id === idProject
                );
                this.usuario.proyectos = asignado.length > 0 ? asignado : proyectos;
              } else {
                this.usuario.proyectos = proyectos;
              }
            }
          });
        }
      });
  }

  ngOnDestroy() {
    this.providerSubscription?.unsubscribe();
  }
}
