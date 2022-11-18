import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from 'src/app/pages/dashboard/dashboard.component';
import { DealmemoComponent } from 'src/app/pages/dealmemo/dealmemo.component';
import { ImportadorComponent } from 'src/app/pages/importador/importador.component';
import { ProviderComponent } from 'src/app/pages/provider/provider.component';

const routes: Routes = [
  {
    path: 'dashboard',
    component: DashboardComponent,
  },
  {
    path: 'datos',
    component: ProviderComponent,
  },
  {
    path: 'dealmemo',
    component: DealmemoComponent,
  },
  {
    path: 'importador',
    component: ImportadorComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HomeRoutingModule {}
