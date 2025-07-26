import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { NzMessageService } from 'ng-zorro-antd/message';
import { UserManagementService } from '../../../services/user-management.service';
import { CreateUserRequest } from '../../../services/user-management.interface';
import { Role } from '../../../types/user-management.types';
import { AuthService } from 'src/app/services/auth.service';
import { CrudService } from 'src/app/services/crud.service';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';
import { phoneValidator } from 'src/app/common/constant';

@Component({
  selector: 'app-create-user',
  templateUrl: './create-user.component.html',
  styleUrls: ['./create-user.component.scss']
})
export class CreateUserComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  userForm!: FormGroup;
  loading = false;
  submitting = false;
  roles: Role[] = [];
  passwordVisible = false;
  confirmPasswordVisible = false;

  constructor(
    private fb: FormBuilder,
    private userManagementService: UserManagementService,
    private router: Router,
    private message: NzMessageService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadRoles();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initForm(): void {
    this.userForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [phoneValidator()]],
      roleNames: [[], [Validators.required, Validators.minLength(1)]],
      isActive: [true],
      requireEmailConfirmation: [false],
      requirePhoneConfirmation: [false],
      password: ['', [Validators.required, Validators.minLength(8), this.passwordPatternValidator()]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordPatternValidator() {
    return (control: any) => {
      const password = control.value;
      if (!password) return null;
      
      const hasLowercase = /[a-z]/.test(password);
      const hasUppercase = /[A-Z]/.test(password);
      const hasNumber = /[0-9]/.test(password);
      const hasSpecial = /[!@#$%^&*]/.test(password);
      
      if (hasLowercase && hasUppercase && hasNumber && hasSpecial) {
        return null;
      }
      
      return { pattern: true };
    };
  }

  passwordMatchValidator(group: FormGroup): { [key: string]: any } | null {
    const password = group.get('password');
    const confirmPassword = group.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    
    return null;
  }

  loadRoles(): void {
    this.loading = true;
    this.userManagementService.getRoles()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (roles) => {
          this.roles = roles.filter(role => role.isActive);
          this.loading = false;
        },
        error: (error) => {
          this.message.error('Failed to load roles: ' + error.message);
          this.loading = false;
        }
      });
  }

  onSubmit(): void {
    if (this.userForm.valid) {
      this.submitting = true;
      const formValue = this.userForm.value;
      
      const createUserRequest: CreateUserRequest = {
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        email: formValue.email,
        phoneNumber: formValue.phoneNumber || undefined,
        roleNames: formValue.roleNames,
        isActive: formValue.isActive,
        requireEmailConfirmation: formValue.requireEmailConfirmation,
        requirePhoneConfirmation: formValue.requirePhoneConfirmation,
        password: formValue.password,
        confirmPassword: formValue.confirmPassword
      };

      this.userManagementService.createUser(createUserRequest)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            let message = 'User created successfully';
            
            if (response.credentialsSent && response.verificationSent) {
              message += ' - Credentials and verification email sent to user.';
            } else if (response.credentialsSent) {
              message += ' - Credentials sent to user.';
            } else if (response.verificationSent) {
              message += ' - Verification email sent to user.';
            } else {
              message += ' - No emails sent due to configuration.';
            }
            
            this.message.success(message);
            this.router.navigate(['/user-management/users']);
          },
          error: (error) => {
            this.message.error('Failed to create user: ' + error.message);
            this.submitting = false;
          }
        });
    } else {
      this.markFormGroupTouched();
    }
  }

  onCancel(): void {
    this.router.navigate(['/user-management/users']);
  }

  onGeneratePassword(): void {
    const password = this.generateSecurePassword();
    this.userForm.patchValue({
      password: password,
      confirmPassword: password
    });
  }

  generateSecurePassword(): string {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    // Ensure at least one of each required character type
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // uppercase
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // lowercase
    password += '0123456789'[Math.floor(Math.random() * 10)]; // number
    password += '!@#$%^&*'[Math.floor(Math.random() * 8)]; // special char
    
    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  markFormGroupTouched(): void {
    Object.keys(this.userForm.controls).forEach(key => {
      const control = this.userForm.get(key);
      control?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string {
    const field = this.userForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return `${this.getFieldLabel(fieldName)} is required`;
      }
      if (field.errors['email']) {
        return 'Please enter a valid email address';
      }
      if (field.errors['minlength']) {
        return `${this.getFieldLabel(fieldName)} must be at least ${field.errors['minlength'].requiredLength} characters`;
      }
      if (field.errors['maxlength']) {
        return `${this.getFieldLabel(fieldName)} must not exceed ${field.errors['maxlength'].requiredLength} characters`;
      }
      if (field.errors['pattern']) {
        return 'Please enter a valid phone number';
      }
    }
    return '';
  }

  getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      firstName: 'First name',
      lastName: 'Last name',
      email: 'Email',
      phoneNumber: 'Phone number',
      roleNames: 'Roles',
      password: 'Password',
      confirmPassword: 'Confirm password'
    };
    return labels[fieldName] || fieldName;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.userForm.get(fieldName);
    return !!(field?.invalid && field?.touched);
  }

  isFieldValid(fieldName: string): boolean {
    const field = this.userForm.get(fieldName);
    return !!(field?.valid && field?.touched);
  }

  isRequirementMet(requirement: string): boolean {
    const password = this.userForm.get('password')?.value || '';
    
    switch (requirement) {
      case 'length':
        return password.length >= 8;
      case 'lowercase':
        return /[a-z]/.test(password);
      case 'uppercase':
        return /[A-Z]/.test(password);
      case 'number':
        return /[0-9]/.test(password);
      case 'special':
        return /[!@#$%^&*]/.test(password);
      default:
        return false;
    }
  }

  getPasswordStrength(): { score: number; label: string; color: string } {
    const password = this.userForm.get('password')?.value || '';
    let score = 0;
    
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[!@#$%^&*]/.test(password)) score++;
    
    const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    const colors = ['#ff4d4f', '#fa8c16', '#faad14', '#52c41a', '#52c41a'];
    
    return {
      score: Math.min(score, 4),
      label: labels[Math.min(score, 4)],
      color: colors[Math.min(score, 4)]
    };
  }
} 