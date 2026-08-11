import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { GeneralService } from 'src/app/services/general.service';

@Component({
  selector: 'app-proveedores',
  templateUrl: './proveedores.component.html',
  styleUrls: ['./proveedores.component.css'],
})
export class ProveedoresComponent {
  idUser: string = '';
  today: Date = new Date();
  user: any = {};

  idCompany: string = '';
  idProject: string = '';

  arrProviders: any[] = [];

  constructor(private generalService: GeneralService, private router: Router) {}

  ngOnInit(): void {
    this.idUser = window.sessionStorage.getItem('id') || '';
    this.getUser(this.idUser);
    // this.today = new Date('2025-10-18T15:00:00'); // Solo para pruebas
    this.today = new Date(); // Fecha actual
  }

  getUser(idUser: string) {
    // pdfMake.createPdf({}).open();
    this.generalService.getUserId(idUser).subscribe((res: any) => {
      this.user = res;
      // console.log('User', this.user);
      this.idCompany = res.empresa.idCompany;
      this.idProject = res.proyecto.idProject;

      if (this.user.tipo === 'jefeDepartamento') {
        this.getOrdenes('departamento', this.user.depto);
      } else if (this.user.tipo === 'proveedor') {
        this.getOrdenes('rfc', this.user.rfc);
      } else if (this.user.tipo === 'admin') {
        this.getOrdenesAdmin();
      }
    });
  }

  getOrdenes(tipo: string, propiedad: string) {
    this.generalService
      .getOrdenes(this.idCompany, this.idProject, tipo, propiedad)
      .subscribe((orden: any) => {
        // console.log(orden);
        // this.arrAllOC = orden;
        // this.totales = [];

        // Extraer los objetos por nombre del proveedor sin duplicados
        const proveedoresUnicos = Array.from(
          new Set(orden.map((item: any) => item.nombreProveedor))
        ).map((nombreProveedor) =>
          orden.find((item: any) => item.nombreProveedor === nombreProveedor)
        );

        if (proveedoresUnicos.length === 1) {
          this.goToProvider(proveedoresUnicos[0]);
          this.arrProviders = proveedoresUnicos;
        } else {
          this.arrProviders = proveedoresUnicos;
        }
      });
  }

  getOrdenesAdmin() {
    this.generalService
      .getOrdenesAdmin(this.idCompany, this.idProject)
      .subscribe((ordenes: any) => {
        // console.log(ordenes);

        // Extraer los objetos por nombre del proveedor sin duplicados
        this.arrProviders = Array.from(
          new Set(ordenes.map((item: any) => item.nombreProveedor))
        ).map((nombreProveedor) =>
          ordenes.find((item: any) => item.nombreProveedor === nombreProveedor)
        );
      });
  }

  goToProvider(proveedor: any) {
    // console.log('Proveedor seleccionado:', proveedor.rfc);
    // navegar al dashboard del proveedor
    // window.sessionStorage.setItem(
    //   'providerSelected',
    //   JSON.stringify(proveedor)
    // );
    this.router.navigate([`Inicio/${proveedor.rfc}`]).then((res) => {
      // console.log(res);
    });
  }
}
