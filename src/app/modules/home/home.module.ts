import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HomeRoutingModule } from './home-routing.module';

import { DashboardComponent } from '../../pages/dashboard/dashboard.component';
import { HeaderComponent } from '../../common/header/header.component';
import { HomeComponent } from '../../modules/home/home.component';

@NgModule({
  declarations: [DashboardComponent, HeaderComponent, HomeComponent],
  imports: [CommonModule, HomeRoutingModule],
})
export class HomeModule {}
