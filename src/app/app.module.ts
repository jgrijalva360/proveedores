import { LOCALE_ID, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import localeEs from '@angular/common/locales/es-MX';
import { registerLocaleData } from '@angular/common';
import { FechaTimeStampPipe } from './pipes/fecha-time-stamp.pipe';
registerLocaleData(localeEs);

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// environments
import { environment } from '../environments/environment';

// firebase
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireStorageModule } from '@angular/fire/compat/storage';
import { AngularFireAuthModule } from '@angular/fire/compat/auth';

// Components
import { LoginComponent } from './pages/login/login.component';
import { CompanyComponent } from './pages/company/company.component';
import { FilesComponent } from './pages/files/files.component';
import { RegisterComponent } from './pages/register/register.component';
import { OrdenComponent } from './pages/orden/orden.component';
import { ArchivosMesComponent } from './pages/archivos-mes/archivos-mes.component';
import { FormOrdenComponent } from './pages/form-orden/form-orden.component';
import { TerminosComponent } from './pages/terminos/terminos.component';
import { ComprobacionesComponent } from './pages/comprobaciones/comprobaciones.component';
import { CfdiLibreComponent } from './pages/cfdi-libre/cfdi-libre.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    CompanyComponent,
    FilesComponent,
    RegisterComponent,
    OrdenComponent,
    FechaTimeStampPipe,
    ArchivosMesComponent,
    FormOrdenComponent,
    TerminosComponent,
    ComprobacionesComponent,
    CfdiLibreComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    AngularFireAuthModule,
    AngularFireStorageModule,
    AngularFireModule.initializeApp(environment.firebaseConfig),
  ],
  providers: [{ provide: LOCALE_ID, useValue: 'es-MX' }],
  bootstrap: [AppComponent],
})
export class AppModule { }
