import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CompanyComponent } from 'src/app/pages/company/company.component';
import { FilesComponent } from 'src/app/pages/files/files.component';
import { ProviderComponent } from 'src/app/pages/provider/provider.component';
import { ImportadorComponent } from 'src/app/pages/importador/importador.component';
import { DashboardComponent } from 'src/app/pages/dashboard/dashboard.component';
import { SobresComponent } from 'src/app/pages/sobres/sobres.component';
import { OrdenComponent } from 'src/app/pages/orden/orden.component';
import { ArchivosMesComponent } from 'src/app/pages/archivos-mes/archivos-mes.component';

const routes: Routes = [
  // {
  //   path: '',
  //   component: CompanyComponent,
  // },
  // {
  //   path: 'importador',
  //   component: ImportadorComponent,
  // },
  // {
  //   path: 'datos',
  //   component: ProviderComponent,
  // },
  {
    path: '',
    component: DashboardComponent,
    children: [
      {
        path: 'data',
        component: ProviderComponent,
      },
      {
        path: 'files',
        component: FilesComponent,
      },
      {
        path: 'importador',
        component: ImportadorComponent,
      },
      {
        path: 'sobres',
        component: SobresComponent,
      },
      {
        path: 'oc',
        component: OrdenComponent,
      },
      {
        path: 'archivosMensuales',
        component: ArchivosMesComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HomeRoutingModule {}
