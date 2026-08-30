import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { UserManagementService } from '../../../services/user-management.service';
import { RolePermissionAssignment } from '../../../services/user-management.interface';
import { Role, Permission } from '../../../types/user-management.types';

@Component({
  selector: 'app-permission-management',
  templateUrl: './permission-management.component.html',
  styleUrls: ['./permission-management.component.scss']
})
export class PermissionManagementComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  @Input() role!: Role;
  permissions: Permission[] = [];
  selectedPermissions: string[] = [];
  submitting = false;
  loading = false;

  constructor(
    private userManagementService: UserManagementService,
    private message: NzMessageService,
    private modalRef: NzModalRef<PermissionManagementComponent>
  ) {}

  ngOnInit(): void {
    this.selectedPermissions = this.role?.permissions?.map(p => p.id) || [];
    this.loadPermissions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadPermissions(): void {
    this.loading = true;
    this.userManagementService.getPermissions().pipe(takeUntil(this.destroy$)).subscribe({
      next: (permissions) => {
        this.permissions = permissions;
        this.loading = false;
      },
      error: () => {
        this.message.error('Failed to load permissions');
        this.loading = false;
      }
    });
  }

  getPermissionCategories(): string[] {
    const categories = new Set<string>();
    this.permissions.forEach(permission => {
      categories.add(permission.category?.trim() ? permission.category : 'General');
    });
    return Array.from(categories).sort();
  }

  getPermissionsByCategory(category: string): Permission[] {
    if (category === 'General') {
      return this.permissions.filter(permission => !permission.category?.trim());
    }
    return this.permissions.filter(permission => permission.category === category);
  }

  onPermissionSelectionChange(permissions: string[]): void {
    this.selectedPermissions = permissions;
  }

  onSave(): void {
    if (!this.role?.id) {
      this.message.error('Invalid role information');
      return;
    }
    if (!this.selectedPermissions.length) {
      this.message.warning('Please select at least one permission');
      return;
    }
    this.submitting = true;
    const assignment: RolePermissionAssignment = {
      roleId: this.role.id,
      permissionIds: this.selectedPermissions
    };
    this.userManagementService.assignPermissionsToRole(assignment).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.message.success('Permissions updated successfully');
        this.modalRef.close('success');
        this.submitting = false;
      },
      error: (error) => {
        this.message.error('Failed to update permissions: ' + error.message);
        this.submitting = false;
      }
    });
  }

  onCancel(): void {
    this.modalRef.close();
  }

  selectAllInCategory(category: string): void {
    this.getPermissionsByCategory(category).forEach(p => {
      if (!this.selectedPermissions.includes(p.id)) {
        this.selectedPermissions.push(p.id);
      }
    });
  }

  deselectAllInCategory(category: string): void {
    const ids = this.getPermissionsByCategory(category).map(p => p.id);
    this.selectedPermissions = this.selectedPermissions.filter(id => !ids.includes(id));
  }

  isAllSelectedInCategory(category: string): boolean {
    const ids = this.getPermissionsByCategory(category).map(p => p.id);
    return ids.length > 0 && ids.every(id => this.selectedPermissions.includes(id));
  }

  isSomeSelectedInCategory(category: string): boolean {
    const ids = this.getPermissionsByCategory(category).map(p => p.id);
    const selected = ids.filter(id => this.selectedPermissions.includes(id)).length;
    return selected > 0 && selected < ids.length;
  }

  getSelectedCountInCategory(category: string): number {
    return this.getPermissionsByCategory(category).filter(p => this.selectedPermissions.includes(p.id)).length;
  }

  isPermissionSelected(permissionId: string): boolean {
    return this.selectedPermissions.includes(permissionId);
  }

  togglePermission(permissionId: string, checked: boolean): void {
    if (checked && !this.selectedPermissions.includes(permissionId)) {
      this.selectedPermissions.push(permissionId);
      return;
    }
    if (!checked) {
      this.selectedPermissions = this.selectedPermissions.filter(id => id !== permissionId);
    }
  }

  trackByPermission(index: number, permission: Permission): string {
    return permission.id;
  }
}
