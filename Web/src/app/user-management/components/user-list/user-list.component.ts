import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { UserManagementService } from '../../../services/user-management.service';
import { UserStatusUpdate } from '../../../services/user-management.interface';
import { User } from '../../../types/user-management.types';
import { CustomNotificationService } from '../../../services/custom-notification.service';
import { ConfirmationDialogService } from '../../../services/confirmation-dialog.service';
import { UserCreateComponent } from '../user-create/user-create.component';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();
  Math = Math;
  users: User[] = [];
  filteredUsers: User[] = [];
  paginatedUsers: User[] = [];
  loading = false;
  searchKey = '';
  pageIndex = 1;
  pageSize = 10;
  pageSizeOption = [5, 10, 15, 25, 50, 100];
  total = 0;
  statusFilter: 'all' | 'active' | 'inactive' = 'all';
  roleFilter: string = '';
  roles: any[] = [];
  get activeUsersCount(): number {
    return this.users.filter(u => u.isActive).length;
  }

  get inactiveUsersCount(): number {
    return this.users.filter(u => !u.isActive).length;
  }

  get totalRolesCount(): number {
    return this.roles.length;
  }

  constructor(
    private userManagementService: UserManagementService,
    private customNotificationService: CustomNotificationService,
    private confirmationDialogService: ConfirmationDialogService,
    private router: Router,
    private message: NzMessageService,
    private modal: NzModalService
  ) {}

  ngOnInit(): void {
    this.setupSearch();
    this.loadUsers();
    this.loadRoles();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setupSearch(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(searchText => {
      this.applyFilters();
    });
  }

  onSearch(): void {
    this.searchSubject.next(this.searchKey);
  }

  loadUsers(): void {
    this.loading = true;
    this.userManagementService.getUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (users) => {
          this.users = users;
          this.applyFilters();
          this.loading = false;
        },
        error: (error) => {
          this.customNotificationService.notification(
            'error',
            'Error',
            error.error?.message || 'Failed to fetch user data. Please check your connection and try again.'
          );
          this.loading = false;
        }
      });
  }

  loadRoles(): void {
    this.userManagementService.getRoles()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (roles) => {
          this.roles = roles;
        },
        error: (error) => {
        }
      });
  }

  applyFilters(): void {
    let filtered = [...this.users];

    // Search filter
    if (this.searchKey) {
      const search = this.searchKey.toLowerCase();
      filtered = filtered.filter(user => 
        user.firstName.toLowerCase().includes(search) ||
        user.lastName.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search) ||
        (user.phoneNumber && user.phoneNumber.toLowerCase().includes(search))
      );
    }

    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(user => 
        this.statusFilter === 'active' ? user.isActive : !user.isActive
      );
    }

    if (this.roleFilter) {
      filtered = filtered.filter(user => 
        user.roles.some(role => role.name === this.roleFilter)
      );
    }

    this.filteredUsers = filtered;
    this.total = filtered.length;
    this.updatePaginatedUsers();
  }

  updatePaginatedUsers(): void {
    const startIndex = (this.pageIndex - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedUsers = this.filteredUsers.slice(startIndex, endIndex);
  }

  onPageIndexChange(page: number): void {
    this.pageIndex = page;
    this.updatePaginatedUsers();
  }
  
  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.pageIndex = 1;  // Reset to first page when changing page size
    this.updatePaginatedUsers();
  }

  onStatusFilterChange(value: 'all' | 'active' | 'inactive'): void {
    this.statusFilter = value;
    this.applyFilters();
  }

  onRoleFilterChange(value: string): void {
    this.roleFilter = value;
    this.applyFilters();
  }

  openAddUserModal(): void {
    const modal = this.modal.create({
      nzTitle: 'Add New User',
      nzContent: UserCreateComponent,
      nzFooter: null,
      nzWidth: 700,
      nzMaskClosable: false
    });
    modal.afterClose.subscribe(result => {
      if (result === 'success') {
        this.loadUsers();
      }
    });
  }

  onViewUser(userId: string): void {
    this.router.navigate(['/user-management/user', userId]);
  }

  onEditUser(userId: string): void {
    this.router.navigate(['/user-management/user', userId], { queryParams: { edit: 'true' } });
  }

  onResetPassword(userId: string): void {
    const user = this.users.find(u => u.id === userId);
    if (!user) {
      this.message.error('User not found');
      return;
    }

    this.confirmationDialogService.showPasswordRegeneration(user)
      .then(confirmed => {
        if (confirmed) {
          this.regeneratePassword(userId, user);
        }
      });
  }

  onToggleUserStatus(user: User): void {
    const action = user.isActive ? 'deactivate' : 'activate';
    
    if (user.isActive) {
      this.confirmationDialogService.showUserDeactivation(user)
        .then(confirmed => {
          if (confirmed) {
            this.performStatusUpdate(user, false);
          }
        });
    } else {
      this.confirmationDialogService.showUserActivation(user)
        .then(confirmed => {
          if (confirmed) {
            this.performStatusUpdate(user, true);
          }
        });
    }
  }

  private performStatusUpdate(user: User, isActive: boolean): void {
    const statusUpdate: UserStatusUpdate = {
      userId: user.id,
      isActive: isActive
    };

    this.userManagementService.updateUserStatus(statusUpdate)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          const action = isActive ? 'activated' : 'deactivated';
          this.message.success(`User ${action} successfully`);
          this.loadUsers();
        },
        error: (error) => {
          const action = isActive ? 'activate' : 'deactivate';
          this.message.error(`Failed to ${action} user: ` + error.message);
        }
      });
  }

  onDeleteUser(user: User): void {
    this.confirmationDialogService.showUserDeletion(user)
      .then(confirmed => {
        if (confirmed) {
          this.userManagementService.deleteUser(user.id)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: () => {
                this.message.success('User deleted successfully');
                this.loadUsers();
              },
              error: (error) => {
                this.message.error('Failed to delete user: ' + error.message);
              }
            });
        }
      });
  }

  onExportUsers(): void {
    this.userManagementService.exportUsers('excel')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          const downloadURL = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = downloadURL;
          link.download = 'users-list.xlsx';
          link.click();
          this.customNotificationService.notification(
            'success',
            'Success',
            'Excel file is downloaded successfully.'
          );
        },
        error: (error) => {
          this.customNotificationService.notification(
            'error',
            'Error',
            'Failed to export data'
          );
        }
      });
  }

  getDisplayName(user: User): string {
    return `${user.firstName} ${user.lastName}`;
  }

  getRoleNames(user: User): string {
    return user.roles.map(role => role.name).join(', ');
  }

  getStatusTag(user: User): { text: string; color: string } {
    return user.isActive 
      ? { text: 'Active', color: 'green' }
      : { text: 'Inactive', color: 'red' };
  }

  getEmailStatus(user: User): { text: string; color: string } {
    return user.isEmailConfirmed 
      ? { text: 'Confirmed', color: 'green' }
      : { text: 'Pending', color: 'orange' };
  }

  getPhoneStatus(user: User): { text: string; color: string } {
    return user.isPhoneConfirmed 
      ? { text: 'Confirmed', color: 'green' }
      : { text: 'Pending', color: 'orange' };
  }

  formatDate(dateString: string): string {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  }

  private regeneratePassword(userId: string, user: User): void {
    this.userManagementService.regeneratePassword(userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.customNotificationService.notification(
            'success',
            'Password Regenerated Successfully! 🔐',
            `New login credentials have been sent to ${user.email}. The user will receive an email with their updated password.`
          );
        },
        error: (error) => {
          this.customNotificationService.notification(
            'error',
            'Password Regeneration Failed ❌',
            'Failed to regenerate password: ' + (error.error?.message || error.message)
          );
        }
      });
  }
} 