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
    this.loadPermissions();
    // Initialize selected permissions from the role's current permissions
    if (this.role && this.role.permissions) {
      this.selectedPermissions = this.role.permissions.map(p => p.id);
    } else {
      this.selectedPermissions = [];
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadPermissions(): void {
    this.loading = true;
    this.userManagementService.getPermissions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (permissions) => {
          this.permissions = permissions;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading permissions:', error);
          this.message.error('Failed to load permissions');
          this.loading = false;
        }
      });
  }

  getPermissionCategories(): string[] {
    const categories = new Set<string>();
    this.permissions.forEach(permission => {
      if (permission.category && permission.category.trim() !== '') {
        categories.add(permission.category);
      } else {
        // If no category, add to "General" category
        categories.add('General');
      }
    });
    return Array.from(categories).sort();
  }

  getPermissionsByCategory(category: string): Permission[] {
    if (category === 'General') {
      // Return permissions without category or with empty category
      return this.permissions.filter(permission => 
        !permission.category || permission.category.trim() === ''
      );
    } else {
      return this.permissions.filter(permission => permission.category === category);
    }
  }

  onPermissionSelectionChange(permissions: string[]): void {
    this.selectedPermissions = permissions;
  }

  onSave(): void {
    if (!this.role?.id) {
      this.message.error('Invalid role information');
      return;
    }
    
    if (!this.selectedPermissions || this.selectedPermissions.length === 0) {
      this.message.warning('Please select at least one permission');
      return;
    }
    
    this.submitting = true;
    const assignment: RolePermissionAssignment = {
      roleId: this.role.id,
      permissionIds: this.selectedPermissions
    };

    this.userManagementService.assignPermissionsToRole(assignment)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
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
    const categoryPermissions = this.getPermissionsByCategory(category);
    const categoryPermissionIds = categoryPermissions.map(p => p.id);
    
    // Add all category permissions that aren't already selected
    categoryPermissionIds.forEach(id => {
      if (!this.selectedPermissions.includes(id)) {
        this.selectedPermissions.push(id);
      }
    });
  }

  deselectAllInCategory(category: string): void {
    const categoryPermissions = this.getPermissionsByCategory(category);
    const categoryPermissionIds = categoryPermissions.map(p => p.id);
    
    // Remove all category permissions from selection
    this.selectedPermissions = this.selectedPermissions.filter(id => 
      !categoryPermissionIds.includes(id)
    );
  }

  isAllSelectedInCategory(category: string): boolean {
    const categoryPermissions = this.getPermissionsByCategory(category);
    const categoryPermissionIds = categoryPermissions.map(p => p.id);
    return categoryPermissionIds.every(id => this.selectedPermissions.includes(id));
  }

  isSomeSelectedInCategory(category: string): boolean {
    const categoryPermissions = this.getPermissionsByCategory(category);
    const categoryPermissionIds = categoryPermissions.map(p => p.id);
    const selectedInCategory = categoryPermissionIds.filter(id => 
      this.selectedPermissions.includes(id)
    );
    return selectedInCategory.length > 0 && selectedInCategory.length < categoryPermissionIds.length;
  }

  getSelectedCountInCategory(category: string): number {
    const categoryPermissions = this.getPermissionsByCategory(category);
    return categoryPermissions.filter(p => this.selectedPermissions.includes(p.id)).length;
  }

  isPermissionSelected(permissionId: string): boolean {
    return this.selectedPermissions.includes(permissionId);
  }

  togglePermission(permissionId: string, checked: boolean): void {
    if (checked && !this.selectedPermissions.includes(permissionId)) {
      this.selectedPermissions.push(permissionId);
    } else if (!checked && this.selectedPermissions.includes(permissionId)) {
      this.selectedPermissions = this.selectedPermissions.filter(id => id !== permissionId);
    }
  }

  trackByPermission(index: number, permission: Permission): string {
    return permission.id;
  }
} 