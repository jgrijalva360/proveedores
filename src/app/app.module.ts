import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// environments
import { environment } from '../environments/environment';

// firebase
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireStorageModule } from '@angular/fire/compat/storage';

// Components
import { LoginComponent } from './pages/login/login.component';
import { DealmemoComponent } from './pages/dealmemo/dealmemo.component';
import { CompanyComponent } from './pages/company/company.component';
import { FilesComponent } from './pages/files/files.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    DealmemoComponent,
    CompanyComponent,
    FilesComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    AngularFireStorageModule,
    AngularFireModule.initializeApp(environment.firebaseConfig),
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
