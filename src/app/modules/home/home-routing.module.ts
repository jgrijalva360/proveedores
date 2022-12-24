import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CompanyComponent } from 'src/app/pages/company/company.component';
import { DashboardComponent } from 'src/app/pages/dashboard/dashboard.component';
import { DealmemoComponent } from 'src/app/pages/dealmemo/dealmemo.component';
import { FilesComponent } from 'src/app/pages/files/files.component';
import { ProviderComponent } from 'src/app/pages/provider/provider.component';

const routes: Routes = [
  {
    path: '',
    component: CompanyComponent,
  },
  {
    path: 'datos',
    component: ProviderComponent,
  },
  {
    path: ':id/:id/dashboard',
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
        path: 'dealMemo',
        component: DealmemoComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HomeRoutingModule {}
