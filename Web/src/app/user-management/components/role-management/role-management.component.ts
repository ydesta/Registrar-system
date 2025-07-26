import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { UserManagementService } from '../../../services/user-management.service';
import { RolePermissionAssignment } from '../../../services/user-management.interface';
import { Role, Permission } from '../../../types/user-management.types';
import { RoleCreateComponent } from '../role-create/role-create.component';
import { RoleEditComponent } from '../role-edit/role-edit.component';
import { PermissionManagementComponent } from '../permission-management/permission-management.component';

@Component({
  selector: 'app-role-management',
  templateUrl: './role-management.component.html',
  styleUrls: ['./role-management.component.scss']
})
export class RoleManagementComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Make Math available in template
  Math = Math;
  
  roles: Role[] = [];
  permissions: Permission[] = [];
  filteredRoles: Role[] = [];
  paginatedRoles: Role[] = [];
  loading = false;
  selectedRole: Role | null = null;
  submitting = false;
  selectedPermissions: string[] = [];
  
  // Search and filter properties
  searchTerm = '';
  statusFilter = '';
  
  // Pagination
  pageIndex = 1;
  pageSize = 10;
  pageSizeOption = [5, 10, 15, 25, 50, 100];
  total = 0;
  
  // Computed properties
  get activeRolesCount(): number {
    return this.roles.filter(role => role.isActive).length;
  }

  get inactiveRolesCount(): number {
    return this.roles.filter(role => !role.isActive).length;
  }

  get totalRolesCount(): number {
    return this.roles.length;
  }

  constructor(
    private userManagementService: UserManagementService,
    private message: NzMessageService,
    private modal: NzModalService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData(): void {
    this.loading = true;
    this.userManagementService.getRoles()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (roles) => {
          this.roles = roles;
          this.applyFilters();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading roles:', error);
          this.message.error('Failed to load roles');
          this.loading = false;
        }
      });

    this.userManagementService.getPermissions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (permissions) => {
          this.permissions = permissions;
        },
        error: (error) => {
          console.error('Error loading permissions:', error);
        }
      });
  }

  applyFilters(): void {
    let filtered = [...this.roles];

    // Apply search filter
    if (this.searchTerm.trim()) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(role => 
        role.name.toLowerCase().includes(search) ||
        role.description?.toLowerCase().includes(search)
      );
    }

    // Apply status filter
    if (this.statusFilter && this.statusFilter !== 'all') {
      const isActive = this.statusFilter === 'active';
      filtered = filtered.filter(role => role.isActive === isActive);
    }

    this.filteredRoles = filtered;
    this.total = filtered.length;
    this.updatePaginatedRoles();
  }

  updatePaginatedRoles(): void {
    const startIndex = (this.pageIndex - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedRoles = this.filteredRoles.slice(startIndex, endIndex);
  }

  onPageIndexChange(page: number): void {
    this.pageIndex = page;
    this.updatePaginatedRoles();
  }
  
  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.pageIndex = 1;  // Reset to first page when changing page size
    this.updatePaginatedRoles();
  }

  onSearch(): void {
    this.applyFilters();
  }

  onStatusFilterChange(value: string): void {
    this.statusFilter = value;
    this.applyFilters();
  }

  openCreateRoleModal(): void {
    const modal = this.modal.create({
      nzTitle: 'Create New Role',
      nzContent: RoleCreateComponent,
      nzFooter: null,
      nzWidth: 800,
      nzMaskClosable: false
    });
    modal.afterClose.subscribe(result => {
      if (result === 'success') {
        this.loadData();
      }
    });
  }

  openEditRoleModal(role: Role): void {
    const modal = this.modal.create({
      nzTitle: 'Edit Role',
      nzContent: RoleEditComponent,
      nzComponentParams: {
        role: role
      },
      nzFooter: null,
      nzWidth: 600,
      nzMaskClosable: false
    });
    modal.afterClose.subscribe(result => {
      if (result === 'success') {
        this.loadData();
      }
    });
  }

  openPermissionManagementModal(role: Role): void {
    if (!role || !role.id) {
      this.message.error('Invalid role selected');
      return;
    }
    
    this.selectedRole = role;
    this.selectedPermissions = role.permissions?.map(p => p.id) || [];
    
    const modal = this.modal.create({
      nzTitle: `Manage Permissions - ${role.name}`,
      nzContent: PermissionManagementComponent,
      nzComponentParams: {
        role: role
      },
      nzFooter: null,
      nzWidth: 800,
      nzMaskClosable: false
    });

    modal.afterClose.subscribe(result => {
      if (result === 'success') {
        this.loadData();
      }
    });
  }

  onDeleteRole(role: Role): void {
    this.modal.confirm({
      nzTitle: 'Confirm Delete',
      nzContent: `Are you sure you want to delete the role "${role.name}"? This action cannot be undone.`,
      nzOkText: 'Delete',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Cancel',
      nzOnOk: () => {
        this.userManagementService.deleteRole(role.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.message.success('Role deleted successfully');
              this.loadData();
            },
            error: (error) => {
              this.message.error('Failed to delete role: ' + error.message);
            }
          });
      }
    });
  }

  onDuplicateRole(role: Role): void {
    const duplicatedRole = {
      ...role,
      id: '',
      name: `${role.name} (Copy)`,
      description: role.description ? `${role.description} (Copy)` : ''
    };
    
    this.userManagementService.createRole(duplicatedRole)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
          this.message.success('Role duplicated successfully');
              this.loadData();
            },
            error: (error) => {
          this.message.error('Failed to duplicate role: ' + error.message);
        }
      });
  }

  onViewRoleDetails(role: Role): void {
    this.modal.info({
      nzTitle: `Role Details - ${role.name}`,
      nzContent: `
        <div class="role-details">
          <p><strong>Name:</strong> ${role.name}</p>
          <p><strong>Description:</strong> ${role.description || 'No description'}</p>
          <p><strong>Status:</strong> ${role.isActive ? 'Active' : 'Inactive'}</p>
          <p><strong>Users:</strong> ${role.userCount || 0} users</p>
          <p><strong>Permissions:</strong> ${role.permissions?.length || 0} permissions</p>
          <p><strong>Created:</strong> ${new Date(role.createdAt).toLocaleDateString()}</p>
        </div>
      `,
      nzWidth: 500
    });
  }

  onExportRoles(): void {
    // TODO: Implement export functionality
    this.message.info('Export functionality will be implemented soon');
  }

  getRolePermissions(role: Role): Permission[] {
    return role.permissions || [];
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

  onPermissionSubmit(permissions: string[]): void {
    if (!this.selectedRole) return;

    this.submitting = true;
    const assignment: RolePermissionAssignment = {
      roleId: this.selectedRole.id,
      permissionIds: permissions
    };

    this.userManagementService.assignPermissionsToRole(assignment)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.message.success('Permissions updated successfully');
          this.loadData();
          this.submitting = false;
        },
        error: (error) => {
          this.message.error('Failed to update permissions: ' + error.message);
          this.submitting = false;
        }
      });
  }
} 