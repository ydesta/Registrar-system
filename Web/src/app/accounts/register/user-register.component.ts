import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { NzModalService } from 'ng-zorro-antd/modal';
import { RegisterRequest } from 'src/app/services/auth.interface';
import { AuthService } from 'src/app/services/auth.service';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';
import { phoneValidator, phoneValidator9To14 } from 'src/app/common/constant';
import { RegistrationSuccessDialogComponent } from './registration-success-dialog/registration-success-dialog.component';

@Component({
  selector: 'app-user-register',
  templateUrl: './user-register.component.html',
  styleUrls: ['./user-register.component.scss']
})
export class UserRegisterComponent implements OnInit {
  registerForm: FormGroup;
  isLoading = false;
  passwordVisible = false;
  confirmPasswordVisible = false;

  constructor(
    private _notificationService: CustomNotificationService,
    private _router: Router,
    private _fb: FormBuilder,
    private _authService: AuthService,
    private _modal: NzModalService
  ) {
    this.registerForm = _fb.group({
      firstName: [null, [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      lastName: [null, [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      email: [null, [Validators.required, Validators.email]],
      password: [null, [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)]],
      confirmPassword: [null, [Validators.required]],
      phoneNumber: [null, [Validators.required, phoneValidator9To14()]],
      acceptTerms: [false, [Validators.requiredTrue]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this._authService.isAuthenticated().then(isAuth => {
      if (isAuth) {
        this._router.navigate(['/dashboard']);
      }
    });
  }

  // Custom validator to check if passwords match
  passwordMatchValidator(form: AbstractControl) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    if (confirmPassword?.errors) {
      delete confirmPassword.errors['passwordMismatch'];
      if (Object.keys(confirmPassword.errors).length === 0) {
        confirmPassword.setErrors(null);
      }
    }
    
    return null;
  }

  submitForm(): void {
    if (this.registerForm.valid) {
      this.isLoading = true;

      const registerRequest: RegisterRequest = {
        firstName: this.registerForm.value.firstName,
        lastName: this.registerForm.value.lastName,
        email: this.registerForm.value.email,
        password: this.registerForm.value.password,
        confirmPassword: this.registerForm.value.confirmPassword,
        phoneNumber: this.registerForm.value.phoneNumber,
        isSelfRegistration: true,
        requireEmailConfirmation: true,
        requirePhoneConfirmation: false
      };

      this._authService.register(registerRequest).subscribe({
        next: (response) => {
          this.isLoading = false;
          
          if (response.success) {
            this.showRegistrationSuccessDialog();
            this.registerForm.reset();
          } else {
            this._notificationService.notification('error', 'Registration Failed', response.message || 'Registration failed. Please try again.');
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Registration error:', error);
          
          let errorMessage = 'An error occurred during registration. Please try again.';
          if (error.message) {
            errorMessage = error.message;
          } else if (error.error && error.error.message) {
            errorMessage = error.error.message;
          }
          
          this._notificationService.notification('error', 'Registration Failed', errorMessage);
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  private showRegistrationSuccessDialog(): void {
    const modalRef = this._modal.create({
      nzContent: RegistrationSuccessDialogComponent,
      nzComponentParams: {
        userEmail: this.registerForm.value.email
      },
      nzWidth: 500,
      nzCentered: true,
      nzMaskClosable: false,
      nzClosable: false,
      nzFooter: null,
      nzBodyStyle: { padding: '0' },
      nzStyle: { borderRadius: '12px' }
    });

    modalRef.afterClose.subscribe(() => {
      this._router.navigate(['/accounts/login']);
    });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      if (control) {
        control.markAsTouched();
        control.updateValueAndValidity({ onlySelf: true });
      }
    });
  }

  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }

  toggleConfirmPasswordVisibility(): void {
    this.confirmPasswordVisible = !this.confirmPasswordVisible;
  }

  goToLogin(): void {
    this._router.navigate(['/accounts/login']);
  }

  goToHome(): void {
    this._router.navigate(['/']);
  }

  // Getter methods for form validation
  get firstName() { return this.registerForm.get('firstName'); }
  get lastName() { return this.registerForm.get('lastName'); }
  get email() { return this.registerForm.get('email'); }
  get password() { return this.registerForm.get('password'); }
  get confirmPassword() { return this.registerForm.get('confirmPassword'); }
  get phoneNumber() { return this.registerForm.get('phoneNumber'); }
  get acceptTerms() { return this.registerForm.get('acceptTerms'); }
}
