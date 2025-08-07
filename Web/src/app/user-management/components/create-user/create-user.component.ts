import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, filter } from 'rxjs';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalRef } from 'ng-zorro-antd/modal';
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

  constructor(
    private fb: FormBuilder,
    private userManagementService: UserManagementService,
    private router: Router,
    private message: NzMessageService,
    private modalRef: NzModalRef<CreateUserComponent>
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadRoles();
    this.setupEmailValidation();
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
      requirePhoneConfirmation: [false]
    });
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
        requirePhoneConfirmation: formValue.requirePhoneConfirmation
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
            this.modalRef.close('success');
          },
          error: (error) => {
            let errorMessage = 'Failed to create user';
            
            if (error.error?.message) {
              errorMessage = error.error.message;
            } else if (error.message) {
              errorMessage = error.message;
            }
            
            // Handle specific error cases
            if (errorMessage.toLowerCase().includes('email already') || 
                errorMessage.toLowerCase().includes('already registered') ||
                errorMessage.toLowerCase().includes('duplicate key')) {
              errorMessage = 'A user with this email address already exists. Please use a different email address.';
              // Clear the email field to help user enter a different email
              this.userForm.patchValue({ email: '' });
              this.userForm.get('email')?.markAsUntouched();
            }
            
            this.message.error(errorMessage);
            this.submitting = false;
          }
        });
    } else {
      this.markFormGroupTouched();
    }
  }

  onCancel(): void {
    this.modalRef.close();
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
      roleNames: 'Roles'
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

  setupEmailValidation(): void {
    // Add email validation with debounce
    this.userForm.get('email')?.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(500),
        filter((email: string) => email && this.isValidEmail(email))
      )
      .subscribe((email: string) => {
        // Here you could add an API call to check email availability
        // For now, we'll just validate the format
        this.validateEmailFormat(email);
      });
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  validateEmailFormat(email: string): void {
    const emailControl = this.userForm.get('email');
    if (emailControl && !this.isValidEmail(email)) {
      emailControl.setErrors({ email: true });
    }
  }

} 