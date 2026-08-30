import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { UserManagementService } from '../../../services/user-management.service';
import { CreateUserRequest } from '../../../services/user-management.interface';
import { Role } from '../../../types/user-management.types';
import { phoneValidator, normalizeEthiopianMobile, applyEthiopianMobileControl } from 'src/app/common/constant';

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
    private message: NzMessageService,
    private modalRef: NzModalRef<CreateUserComponent>
  ) {}

  ngOnInit(): void {
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
    this.loadRoles();
  }

  onPhoneBlur(): void {
    applyEthiopianMobileControl(this.userForm.get('phoneNumber'));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadRoles(): void {
    this.loading = true;
    this.userManagementService.getRoles().pipe(takeUntil(this.destroy$)).subscribe({
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
    if (!this.userForm.valid) {
      this.markFormGroupTouched();
      return;
    }
    this.submitting = true;
    const formValue = this.userForm.value;
    const phoneNumber = formValue.phoneNumber
      ? normalizeEthiopianMobile(formValue.phoneNumber) || formValue.phoneNumber
      : undefined;
    const createUserRequest: CreateUserRequest = {
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      email: formValue.email,
      phoneNumber,
      roleNames: formValue.roleNames,
      isActive: formValue.isActive,
      requireEmailConfirmation: formValue.requireEmailConfirmation,
      requirePhoneConfirmation: formValue.requirePhoneConfirmation
    };
    this.userManagementService.createUser(createUserRequest).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        this.message.success(this.createSuccessMessage(response));
        this.modalRef.close('success');
      },
      error: (error) => {
        let errorMessage = error.error?.message || error.message || 'Failed to create user';
        if (/email already|already registered|duplicate key/i.test(errorMessage)) {
          errorMessage = 'A user with this email address already exists. Please use a different email address.';
          this.userForm.patchValue({ email: '' });
          this.userForm.get('email')?.markAsUntouched();
        }
        this.message.error(errorMessage);
        this.submitting = false;
      }
    });
  }

  onCancel(): void {
    this.modalRef.close();
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.userForm.get(fieldName);
    return !!(field?.invalid && field?.touched);
  }

  private createSuccessMessage(response: any): string {
    let message = 'User created successfully';
    if (response.credentialsSent && response.verificationSent) {
      return message + ' - Credentials and verification email sent to user.';
    }
    if (response.credentialsSent) {
      return message + ' - Credentials sent to user.';
    }
    if (response.verificationSent) {
      return message + ' - Verification email sent to user.';
    }
    return message + ' - No emails sent due to configuration.';
  }

  private markFormGroupTouched(): void {
    Object.keys(this.userForm.controls).forEach(key => {
      this.userForm.get(key)?.markAsTouched();
    });
  }
}
