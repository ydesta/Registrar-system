import { Component } from '@angular/core';

@Component({
  selector: 'app-auth-header',
  templateUrl: './auth-header.component.html',
  styleUrls: ['./auth-header.component.scss']
})
export class AuthHeaderComponent {
  goToHome(): void {
    window.location.href = '/portal';
  }

  goToLogin(): void {
    window.location.href = '/accounts/login';
  }

  goToRegister(): void {
    window.location.href = '/accounts/register';
  }
}
