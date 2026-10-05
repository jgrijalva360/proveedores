import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from 'src/app/pages/dashboard/dashboard.component';
import { OrdenComponent } from 'src/app/pages/orden/orden.component';
import { ArchivosMesComponent } from 'src/app/pages/archivos-mes/archivos-mes.component';
import { ProveedoresComponent } from 'src/app/pages/proveedores/proveedores.component';
import { ComprobacionesComponent } from 'src/app/pages/comprobaciones/comprobaciones.component';
import { CfdiLibreComponent } from 'src/app/pages/cfdi-libre/cfdi-libre.component';

const routes: Routes = [
  {
    path: '',
    component: ProveedoresComponent,
    data: { breadcrumb: 'Proveedores' }
  },
  {
    path: ':id',
    component: DashboardComponent,
    data: { breadcrumb: 'proveedor' },
    children: [
      {
        path: 'archivosMensuales',
        component: ArchivosMesComponent,
        data: { breadcrumb: 'Archivos mensuales' }
      },
      {
        path: 'facturasCFDI',
        component: CfdiLibreComponent,
        data: { breadcrumb: 'Carga de CFDIs' }
      },
      {
        path: 'pagosPendientes',
        component: OrdenComponent,
        data: { breadcrumb: 'Pagos pendientes' }
      },
      {
        path: 'gastosPorComprobar',
        component: ComprobacionesComponent,
        data: { breadcrumb: 'Gastos por comprobar' }
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HomeRoutingModule {}
