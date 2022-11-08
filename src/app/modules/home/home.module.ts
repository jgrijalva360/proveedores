import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HomeRoutingModule } from './home-routing.module';

import { DashboardComponent } from '../../pages/dashboard/dashboard.component';
import { HeaderComponent } from '../../common/header/header.component';
import { HomeComponent } from '../../modules/home/home.component';
import { ProviderComponent } from 'src/app/pages/provider/provider.component';
import { ImportadorComponent } from 'src/app/pages/importador/importador.component';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [DashboardComponent, HeaderComponent, HomeComponent, ProviderComponent, ImportadorComponent],
  imports: [CommonModule, HomeRoutingModule, FormsModule],
})
export class HomeModule {}
