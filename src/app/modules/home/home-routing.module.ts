import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from 'src/app/pages/dashboard/dashboard.component';
import { OrdenComponent } from 'src/app/pages/orden/orden.component';
import { ArchivosMesComponent } from 'src/app/pages/archivos-mes/archivos-mes.component';
import { ProveedoresComponent } from 'src/app/pages/proveedores/proveedores.component';

const routes: Routes = [
  {
    path: '',
    component: ProveedoresComponent,
    data: { breadcrumb: 'Proveedores' },
  },
  {
    path: ':id',
    component: DashboardComponent,
    data: { breadcrumb: ['dashboard'] },
  },
  // {
  //   path: 'pagosPendientes',
  //   component: OrdenComponent,
  //   data: { breadcrumb: 'Pagos pendientes' },
  //   children: [
  //     {
  //       path: ':id',
  //       component: OrdenComponent,
  //       data: { breadcrumb: 'Proveedor' },
  //     },
  //   ],
  // },
  // {
  //   path: 'archivosMensuales',
  //   component: ArchivosMesComponent,
  //   data: { breadcrumb: 'Archivos mensuales' },
  // },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HomeRoutingModule {}
