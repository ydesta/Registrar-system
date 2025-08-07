import { MenuComponent } from './main/menu/menu.component';
import { UnauthorizedComponent } from './unauthorized/unauthorized.component';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { NgxPrintModule } from 'ngx-print';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NZ_I18N } from 'ng-zorro-antd/i18n';
import { en_US } from 'ng-zorro-antd/i18n';
import { registerLocaleData } from '@angular/common';
import en from '@angular/common/locales/en';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { IconsProviderModule } from './icons-provider.module';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { SharedModule } from './shared-module/shared/shared.module';
import { HeaderComponent } from './header/header.component';
import { SignoutRedirectCallbackComponent } from './signout-redirect-callback/signout-redirect-callback.component';
import { SigninRedirectCallbackComponent } from './signin-redirect-callback/signin-redirect-callback.component';
import { AuthInterceptorService } from './services/auth-interceptor.service';
import { RouterModule } from '@angular/router';
import { RegisterComponent } from './register/register.component';
import { PortalModule } from './portal/portal.module';
import { environment } from '../environments/environment';

registerLocaleData(en);

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    SignoutRedirectCallbackComponent,
    SigninRedirectCallbackComponent,
    UnauthorizedComponent,
    RegisterComponent,

  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    BrowserAnimationsModule,
    IconsProviderModule,
    NzLayoutModule,
    NzMenuModule,
    SharedModule,
    NgxPrintModule,
    RouterModule,
    PortalModule,

  ],
  providers: [
    AuthInterceptorService,
    { provide: NZ_I18N, useValue: en_US },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptorService,
      multi: true,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
