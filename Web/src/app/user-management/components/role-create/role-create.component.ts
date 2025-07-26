import { Component, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { UserManagementService } from '../../../services/user-management.service';
import { Role, Permission } from '../../../types/user-management.types';

@Component({
  selector: 'app-role-create',
  templateUrl: './role-create.component.html',
  styleUrls: ['./role-create.component.scss']
})
export class RoleCreateComponent {
  roleForm!: FormGroup;
  submitting = false;
  permissions: Permission[] = [];
  selectedPermissions: string[] = [];

  constructor(
    private fb: FormBuilder,
    private userManagementService: UserManagementService,
    private message: NzMessageService,
    private modalRef: NzModalRef<RoleCreateComponent>,
    private cdr: ChangeDetectorRef
  ) {
    this.initForm();
    this.loadPermissions();
  }

  initForm(): void {
    this.roleForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      description: ['', [Validators.maxLength(200)]],
      isActive: [true]
    });
  }

  loadPermissions(): void {
    this.userManagementService.getPermissions()
      .subscribe({
        next: (permissions) => {
          this.permissions = permissions;
          setTimeout(() => this.cdr.detectChanges());
        },
        error: (error) => {
          console.error('Error loading permissions:', error);
          this.message.error('Failed to load permissions');
        }
      });
  }

  getPermissionCategories(): string[] {
    const categories = new Set<string>();
    this.permissions.forEach(permission => {
      if (permission.category) {
        categories.add(permission.category);
      }
    });
    return Array.from(categories).sort();
  }

  getPermissionsByCategory(category: string): Permission[] {
    return this.permissions.filter(permission => permission.category === category);
  }

  onPermissionSelectionChange(permissions: string[]): void {
    this.selectedPermissions = permissions;
  }

  selectAllPermissions(): void {
    this.selectedPermissions = this.permissions.map(p => p.id);
  }

  clearAllPermissions(): void {
    this.selectedPermissions = [];
  }

  onSubmit(): void {
    if (this.roleForm.valid) {
      this.submitting = true;
      const formValue = this.roleForm.value;
      const payload = {
        name: formValue.name,
        description: formValue.description,
        isActive: formValue.isActive,
        permissionIds: this.selectedPermissions
      };
      this.userManagementService.createRole(payload)
        .subscribe({
          next: (response: any) => {
            this.message.success('Role created successfully');
            this.modalRef.close('success');
            this.submitting = false;
          },
          error: (error) => {
            this.message.error('Failed to create role: ' + error.message);
            this.submitting = false;
          }
        });
    }
  }

  onCancel(): void {
    this.modalRef.close();
  }

  resetForm(): void {
    this.roleForm.reset({ isActive: true });
    this.selectedPermissions = [];
  }

  getSelectedPermissionsCount(): number {
    return this.selectedPermissions.length;
  }

  isPermissionSelected(permissionId: string): boolean {
    return this.selectedPermissions.includes(permissionId);
  }

  togglePermission(permissionId: string): void {
    if (this.selectedPermissions.includes(permissionId)) {
      this.selectedPermissions = this.selectedPermissions.filter(id => id !== permissionId);
    } else {
      this.selectedPermissions = [...this.selectedPermissions, permissionId];
    }
    this.cdr.detectChanges();
  }

  selectAllInCategory(category: string): void {
    const categoryPermissions = this.getPermissionsByCategory(category).map(p => p.id);
    this.selectedPermissions = Array.from(new Set([...this.selectedPermissions, ...categoryPermissions]));
    this.cdr.detectChanges();
  }

  clearAllInCategory(category: string): void {
    const categoryPermissions = this.getPermissionsByCategory(category).map(p => p.id);
    this.selectedPermissions = this.selectedPermissions.filter(id => !categoryPermissions.includes(id));
    this.cdr.detectChanges();
  }

  areAllSelectedInCategory(category: string): boolean {
    const categoryPermissions = this.getPermissionsByCategory(category).map(p => p.id);
    return categoryPermissions.length > 0 && categoryPermissions.every(id => this.selectedPermissions.includes(id));
  }

  isAnySelectedInCategory(category: string): boolean {
    const categoryPermissions = this.getPermissionsByCategory(category).map(p => p.id);
    return categoryPermissions.some(id => this.selectedPermissions.includes(id));
  }

  trackByCategory(index: number, category: string) {
    return category;
  }

  setPermissionSelected(permissionId: string, checked: boolean): void {
    if (checked && !this.selectedPermissions.includes(permissionId)) {
      this.selectedPermissions = [...this.selectedPermissions, permissionId];
    } else if (!checked && this.selectedPermissions.includes(permissionId)) {
      this.selectedPermissions = this.selectedPermissions.filter(id => id !== permissionId);
    }
    this.cdr.detectChanges();
  }
} 