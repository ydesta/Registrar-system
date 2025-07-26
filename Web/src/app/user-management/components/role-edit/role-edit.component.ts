import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { UserManagementService } from '../../../services/user-management.service';
import { Role } from '../../../types/user-management.types';

@Component({
  selector: 'app-role-edit',
  templateUrl: './role-edit.component.html',
  styleUrls: ['./role-edit.component.scss']
})
export class RoleEditComponent implements OnInit {
  role!: Role;
  roleForm!: FormGroup;
  submitting = false;

  constructor(
    private fb: FormBuilder,
    private userManagementService: UserManagementService,
    private message: NzMessageService,
    private modalRef: NzModalRef<RoleEditComponent>
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    // Get role from modal params
    this.role = this.modalRef.getConfig().nzComponentParams?.['role'];
    if (this.role) {
      this.roleForm.patchValue({
        name: this.role.name,
        description: this.role.description || '',
        isActive: this.role.isActive
      });
    }
  }

  initForm(): void {
    this.roleForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      description: ['', [Validators.maxLength(200)]],
      isActive: [true]
    });
  }

  onSubmit(): void {
    if (this.roleForm.valid && this.role) {
      this.submitting = true;
      const formValue = this.roleForm.value;
      
      this.userManagementService.updateRole(this.role.id, formValue)
        .subscribe({
          next: (response: any) => {
            this.message.success('Role updated successfully');
            this.modalRef.close('success');
            this.submitting = false;
          },
          error: (error) => {
            this.message.error('Failed to update role: ' + error.message);
            this.submitting = false;
          }
        });
    }
  }

  onCancel(): void {
    this.modalRef.close();
  }
} 