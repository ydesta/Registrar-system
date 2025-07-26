import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { UserManagementService } from 'src/app/services/user-management.service';
import { NzModalRef } from 'ng-zorro-antd/modal';

@Component({
  selector: 'app-user-create',
  templateUrl: './user-create.component.html',
  styleUrls: ['./user-create.component.scss']
})
export class UserCreateComponent implements OnInit {
  userForm!: FormGroup;
  loading = false;
  roles: string[] = [];

  constructor(
    private fb: FormBuilder,
    private userManagementService: UserManagementService,
    public router: Router,
    private message: NzMessageService,
    private modalRef: NzModalRef<UserCreateComponent>
  ) {}

  ngOnInit(): void {
    this.userForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: [''],
      roleNames: [[], [Validators.required]],
      requireEmailConfirmation: [true],
      requirePhoneConfirmation: [false]
    });
    this.loadRoles();
  }

  loadRoles(): void {
    this.userManagementService.getRoles().subscribe({
      next: (roles) => {
        this.roles = roles.map(r => r.name);
      },
      error: () => {
        this.roles = [];
      }
    });
  }

  submitForm(): void {
    if (this.userForm.invalid) {
      for (const i in this.userForm.controls) {
        if (this.userForm.controls.hasOwnProperty(i)) {
          this.userForm.controls[i].markAsDirty();
          this.userForm.controls[i].updateValueAndValidity();
        }
      }
      return;
    }
    this.loading = true;
    this.userManagementService.createUser(this.userForm.value).subscribe({
      next: (response) => {
        let message = 'User created successfully!';
        
        if (response.credentialsSent && response.verificationSent) {
          message += ' Credentials and verification email sent to user.';
        } else if (response.credentialsSent) {
          message += ' Credentials sent to user.';
        } else if (response.verificationSent) {
          message += ' Verification email sent to user.';
        } else {
          message += ' No emails sent due to configuration.';
        }
        
        this.message.success(message);
        this.modalRef.close('success');
      },
      error: (err) => {
        this.message.error(err.error?.message || 'Failed to create user');
        this.loading = false;
      }
    });
  }
} 