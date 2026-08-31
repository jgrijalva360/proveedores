import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './modules/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { FormOrdenComponent } from './pages/form-orden/form-orden.component';
import { TerminosComponent } from './pages/terminos/terminos.component';

const routes: Routes = [
  {
    path: '',
    component: LoginComponent
  },
  {
    path: 'registro/:id',
    component: RegisterComponent
  },
  {
    path: 'Inicio/:id',
    component: HomeComponent,
    loadChildren: () =>
      import('./modules/home/home.module').then(m => m.HomeModule),
    data: { breadcrumb: 'Inicio' }
  },
  {
    path: ':id/:id/formOc',
    component: FormOrdenComponent,
    data: { breadcrumb: 'Orden de compra' }
  },
  {
    path: 'terminos-y-condiciones',
    component: TerminosComponent,
    data: { breadcrumb: 'Términos y condiciones' }
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
