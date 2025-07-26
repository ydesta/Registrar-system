import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.scss']
})
export class ChangePasswordComponent implements OnInit {
  changePasswordForm: FormGroup;
  isLoading = false;
  passwordChanged = false;
  currentPasswordVisible = false;
  newPasswordVisible = false;
  confirmPasswordVisible = false;

  constructor(
    private _notificationService: CustomNotificationService,
    private _router: Router,
    private _fb: FormBuilder,
    private _authService: AuthService
  ) {
    this.changePasswordForm = _fb.group({
      currentPassword: [null, [Validators.required]],
      newPassword: [null, [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)]],
      confirmPassword: [null, [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    // Check if user is authenticated
    this._authService.isAuthenticated().then(isAuth => {
      if (!isAuth) {
        this._notificationService.notification('error', 'Authentication Required', 'Please login to change your password.');
        this._router.navigate(['/accounts/login']);
      }
    });
  }

  // Custom validator to check if passwords match
  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');
    
    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    if (confirmPassword && confirmPassword.errors) {
      delete confirmPassword.errors['passwordMismatch'];
      if (Object.keys(confirmPassword.errors).length === 0) {
        confirmPassword.setErrors(null);
      }
    }
    
    return null;
  }

  submitForm(): void {
    if (this.changePasswordForm.valid) {
      this.isLoading = true;

      const formData = this.changePasswordForm.value;
      
      this._authService.changePassword(formData.currentPassword, formData.newPassword, formData.confirmPassword).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.passwordChanged = true;
          this._notificationService.notification(
            'success',
            'Password Changed Successfully',
            'Your password has been changed successfully. You can now use your new password for future logins.'
          );
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Change password error:', error);
          
          let errorMessage = 'An error occurred while changing your password. Please try again.';
          if (error.error && error.error.message) {
            errorMessage = error.error.message;
          }
          
          this._notificationService.notification('error', 'Change Password Failed', errorMessage);
        }
      });
    } else {
      Object.values(this.changePasswordForm.controls).forEach((control) => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }

  goToDashboard(): void {
    this._router.navigate(['/dashboard']);
  }

  goToHome(): void {
    this._router.navigate(['/']);
  }

  toggleCurrentPasswordVisibility(): void {
    this.currentPasswordVisible = !this.currentPasswordVisible;
  }

  toggleNewPasswordVisibility(): void {
    this.newPasswordVisible = !this.newPasswordVisible;
  }

  toggleConfirmPasswordVisibility(): void {
    this.confirmPasswordVisible = !this.confirmPasswordVisible;
  }

  // Getter methods for form validation
  get currentPassword() { return this.changePasswordForm.get('currentPassword'); }
  get newPassword() { return this.changePasswordForm.get('newPassword'); }
  get confirmPassword() { return this.changePasswordForm.get('confirmPassword'); }
} 