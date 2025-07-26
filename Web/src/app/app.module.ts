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
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { TokenRefreshInterceptor } from './interceptors/token-refresh.interceptor';
import { RouterModule } from '@angular/router';
import { RegisterComponent } from './register/register.component';
import { PortalModule } from './portal/portal.module';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';
import { PwaInstallComponent } from './components/pwa-install/pwa-install.component';
import { PwaUpdateComponent } from './components/pwa-update/pwa-update.component';
import { SessionWarningComponent } from './components/session-warning/session-warning.component';
import { SwErrorHandlerService } from './services/sw-error-handler.service';

registerLocaleData(en);

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    SignoutRedirectCallbackComponent,
    SigninRedirectCallbackComponent,
    UnauthorizedComponent,
    RegisterComponent,
    PwaInstallComponent,
    PwaUpdateComponent,
    SessionWarningComponent,
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
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.production,
      registrationStrategy: 'registerWhenStable:30000'
    })
  ],
  providers: [
    AuthInterceptorService,
    { provide: NZ_I18N, useValue: en_US },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptorService,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TokenRefreshInterceptor,
      multi: true,
    },
    // Add error handling for service worker
    {
      provide: 'SW_ERROR_HANDLER',
      useValue: (error: any) => {
        console.warn('Service Worker Error:', error);
        // Don't throw the error to prevent app crashes
      }
    },
    SwErrorHandlerService
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
