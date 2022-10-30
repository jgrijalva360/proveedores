import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// environments
import { environment } from 'src/environments/environment';

// firebase
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireStorageModule } from '@angular/fire/compat/storage';
import { LoginComponent } from './pages/login/login.component';
import { HomeModule } from './modules/home/home.module';
import { ProviderComponent } from './pages/provider/provider.component';

@NgModule({
  declarations: [AppComponent, LoginComponent, ProviderComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HomeModule,
    AngularFireStorageModule,
    AngularFireModule.initializeApp(environment.firebaseConfig),
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
