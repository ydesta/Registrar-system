import { Component } from '@angular/core';

@Component({
  selector: 'app-auth-header',
  templateUrl: './auth-header.component.html',
  styleUrls: ['./auth-header.component.scss']
})
export class AuthHeaderComponent {

  goToHome(): void {
    // Use window.location to avoid routing conflicts
    window.location.href = '/portal';
  }

  goToLogin(): void {
    // Use window.location to avoid routing conflicts
    window.location.href = '/accounts/login';
  }

  goToRegister(): void {
    // Use window.location to avoid routing conflicts
    window.location.href = '/accounts/register';
  }
} 