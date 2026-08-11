import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GeneralService } from 'src/app/services/general.service';

@Component({
  selector: 'app-breadcrum',
  templateUrl: './breadcrum.component.html',
  styleUrls: ['./breadcrum.component.css'],
})
export class BreadcrumComponent {
  breadcrumbs: Array<{ label: string; url: string }> = [];

  idCompany: string = '';
  idProject: string = '';
  rfcSeleccionado: string = '';
  oc: any = {};

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private generalService: GeneralService
  ) {}

  ngOnInit(): void {
    const rfc = this.router.url.split('/')[2];
    this.rfcSeleccionado = rfc;
    this.createBreadcrumbs();
    // this.getUser(window.sessionStorage.getItem('id') || '');
  }

  createBreadcrumbs(): void {
    this.router.events.subscribe(() => {
      this.breadcrumbs = [];
      let currentRoute = this.activatedRoute.root;
      // console.log(currentRoute);
      let url = '';
      while (currentRoute.children.length > 0) {
        const childRoutes = currentRoute.children;
        // console.log(childRoutes);
        let nextRoute = null;
        for (const route of childRoutes) {
          if (route.outlet === 'primary') {
            nextRoute = route;
            break;
          }
        }
        if (!nextRoute) {
          break;
        }
        currentRoute = nextRoute;
        const routeSnapshot = currentRoute.snapshot;
        if (routeSnapshot.url.length > 0) {
          const routeURL = routeSnapshot.url
            .map((segment) => segment.path)
            .join('/');
          url += `/${routeURL}`;
          let label = routeSnapshot.data['breadcrumb'] || routeURL || 'Home';
          if (label === 'proveedor') {
            label = routeSnapshot.params['id'];
            // this.getOrden();
            this.breadcrumbs.push({ label, url });
          } else {
            this.breadcrumbs.push({ label, url });
          }
        }
      }
    });
  }

  getUser(idUser: string) {
    this.generalService.getUserId(idUser).subscribe((res: any) => {
      // this.user = res;
      // console.log('User', this.user);
      this.idCompany = res.empresa.idCompany;
      this.idProject = res.proyecto.idProject;
    });
  }

  getOrden() {
    this.generalService
      .getOrdenes(this.idCompany, this.idProject, 'rfc', this.rfcSeleccionado)
      .subscribe((ordenes: any) => {
        // console.log(ordenes);

        let ordenesFiltradas = ordenes.filter(
          (orden: any) => orden.rfc === this.rfcSeleccionado
        );

        console.log('OC Ordenadas', ordenesFiltradas);

        this.oc = ordenesFiltradas[0];

        this.breadcrumbs.push({
          label: this.oc.nombreProveedor,
          url: `/${this.rfcSeleccionado}`,
        });

        // filtrar las ordenes que su fecha de inicio no sea mayor a la fecha actual
        // this.arrOC = ordenesFiltradas;
        // console.log('Ordenes', this.arrOC);
      });
  }
}
