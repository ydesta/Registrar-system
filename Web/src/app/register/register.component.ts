import { Component, OnInit } from '@angular/core';
import { UserRegistration } from '../Models/user.registration';
import { AuthService } from '../services/auth.service';
import { finalize } from 'rxjs';
import { StaffModel } from '../Models/StaffModel';
import { CustomNotificationService } from '../services/custom-notification.service';
import { Router } from '@angular/router';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { RegisterRequest } from '../services/auth.interface';
import { ethiopianMobileValidator, normalizeEthiopianMobile } from '../common/constant';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent implements OnInit {
  success: boolean;
  error: string;
  userRegistration: UserRegistration = { name: '', email: '', password: '' };
  submitted: boolean = false;
  staffs?: StaffModel[];
  checked = false;
  validateForm!: FormGroup;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private _notificationService: CustomNotificationService,
    private _router: Router
  ) {}

  ngOnInit(): void {
    this.validateForm = this.fb.group({
      nickname: [null, [Validators.required]],
      email: [null, [Validators.email, Validators.required]],
      password: [null, [Validators.required, Validators.minLength(8)]],
      checkPassword: [null, [Validators.required, this.confirmationValidator]],
      phoneNumberPrefix: ['+251', [Validators.required]],
      phoneNumber: [null, [Validators.required, ethiopianMobileValidator()]],
      agree: [false, [Validators.requiredTrue]],
    });
  }

  confirmationValidator = (control: FormControl): { [s: string]: boolean } => {
    if (!control.value) {
      return { required: true };
    } else if (control.value !== this.validateForm.controls['password'].value) {
      return { confirm: true, error: true };
    }
    return {};
  };

  updateConfirmValidator(): void {
    Promise.resolve().then(() =>
      this.validateForm.controls['checkPassword'].updateValueAndValidity()
    );
  }

  onPhoneBlur(): void {
    const raw = this.validateForm.value.phoneNumber;
    const combined = this.combinePhone(raw);
    const normalized = normalizeEthiopianMobile(combined) || normalizeEthiopianMobile(raw);
    if (normalized) {
      this.validateForm.get('phoneNumber')?.setValue(normalized, { emitEvent: false });
      this.validateForm.get('phoneNumberPrefix')?.setValue('+251', { emitEvent: false });
    }
  }

  submitForm(): void {
    if (this.validateForm.valid) {
      this.isLoading = true;
      const phoneNumber = normalizeEthiopianMobile(this.combinePhone(this.validateForm.value.phoneNumber))
        || normalizeEthiopianMobile(this.validateForm.value.phoneNumber);
      if (!phoneNumber) {
        this.isLoading = false;
        this._notificationService.notification('error', 'Invalid Phone', 'Use Ethio Telecom (09) or Safaricom (07).');
        return;
      }
      const fullName = (this.validateForm.value.nickname || '').toString().trim();
      const nameParts = fullName.split(/\s+/);
      const registerRequest: RegisterRequest = {
        firstName: nameParts[0] || fullName,
        lastName: nameParts.slice(1).join(' ') || fullName,
        email: this.validateForm.value.email,
        password: this.validateForm.value.password,
        confirmPassword: this.validateForm.value.checkPassword,
        phoneNumber,
        isSelfRegistration: true,
        requireEmailConfirmation: true,
        requirePhoneConfirmation: false
      };

      this.authService
        .register(registerRequest)
        .pipe(
          finalize(() => {
            this.isLoading = false;
          })
        )
        .subscribe({
          next: (result) => {
            if (result.success) {
              this.success = true;
              this._notificationService.notification(
                'success',
                'Registration Successful',
                'Your account has been created successfully!'
              );
              this._router.navigate(['/accounts/login']);
            } else {
              this.error = result.message;
              this._notificationService.notification('error', 'Registration Failed', result.message);
            }
          },
          error: (error) => {
            this.error = error.message || 'An error occurred during registration';
            this._notificationService.notification('error', 'Registration Failed', this.error);
          }
        });
    } else {
      Object.values(this.validateForm.controls).forEach((control) => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }

  private combinePhone(raw: unknown): string {
    const local = (raw ?? '').toString().trim();
    if (!local) {
      return '';
    }
    if (local.startsWith('+') || local.startsWith('251') || local.startsWith('0')) {
      return local;
    }
    const prefix = this.validateForm.value.phoneNumberPrefix || '+251';
    return `${prefix}${local}`;
  }
}
