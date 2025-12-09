import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AccountsComponent } from './accounts.component';
import { LoginComponent } from './login/login.component';
import { UserRegisterComponent } from './register/user-register.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { VerifyEmailComponent } from './verify-email/verify-email.component';
import { ChangePasswordComponent } from './change-password/change-password.component';
import { AuthGuard } from '../guards/auth.guard';

const routes: Routes = [
  { 
    path: '', 
    component: AccountsComponent,
    runGuardsAndResolvers: 'always'
  },
  { 
    path: 'login', 
    component: LoginComponent,
    runGuardsAndResolvers: 'always'
  },
  { 
    path: 'register', 
    component: UserRegisterComponent,
    runGuardsAndResolvers: 'always'
  },
  { 
    path: 'forgot-password', 
    component: ForgotPasswordComponent,
    runGuardsAndResolvers: 'always'
  },
  { 
    path: 'reset-password', 
    component: ResetPasswordComponent,
    runGuardsAndResolvers: 'always'
  },
  { 
    path: 'verify-email', 
    component: VerifyEmailComponent,
    runGuardsAndResolvers: 'always'
  },
  { 
    path: 'change-password', 
    component: ChangePasswordComponent, 
    canActivate: [AuthGuard],
    runGuardsAndResolvers: 'always'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AccountsRoutingModule { }
