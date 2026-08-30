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
import { CreateUserComponent } from '../create-user/create-user.component';
import { ExcelExportService } from '../../../reports/services/excel-export.service';

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
  loading = false;
  exporting = false;
  searchKey = '';
  pageIndex = 1;
  pageSize = 10;
  pageSizeOption = [5, 10, 15, 25, 50, 100];
  total = 0;
  statusFilter: 'all' | 'active' | 'inactive' = 'all';
  roleFilter = '';
  roles: any[] = [];
  totalUsers = 0;
  activeUsers = 0;
  inactiveUsers = 0;
  sortBy = 'CreatedAt';
  sortDescending = true;
  sortOrders: Record<string, 'ascend' | 'descend' | null> = {
    fullName: null,
    email: null,
    phoneNumber: null,
    roles: null,
    status: null
  };

  get activeUsersCount(): number {
    return this.activeUsers;
  }

  get inactiveUsersCount(): number {
    return this.inactiveUsers;
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
    private modal: NzModalService,
    private excelExportService: ExcelExportService
  ) {}

  ngOnInit(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.pageIndex = 1;
      this.loadUsers();
    });
    this.loadUsers();
    this.loadRoles();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearch(): void {
    this.searchSubject.next(this.searchKey);
  }

  loadUsers(): void {
    this.loading = true;
    this.userManagementService.getUsers(
      this.pageIndex,
      this.pageSize,
      this.searchKey || undefined,
      this.roleFilter || undefined,
      this.statusFilter !== 'all' ? (this.statusFilter === 'active') : undefined,
      this.sortBy,
      this.sortDescending
    ).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        this.users = response.users;
        this.total = response.total;
        this.loading = false;
        this.loadStatisticsAsync();
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
    this.userManagementService.getRoles().pipe(takeUntil(this.destroy$)).subscribe({
      next: (roles) => {
        this.roles = roles;
      },
      error: () => {}
    });
  }

  onSort(column: string, order: string | null): void {
    Object.keys(this.sortOrders).forEach(key => {
      this.sortOrders[key] = key === column ? (order as 'ascend' | 'descend' | null) : null;
    });

    if (!order) {
      this.sortBy = 'CreatedAt';
      this.sortDescending = true;
    } else {
      this.sortBy = column;
      this.sortDescending = order === 'descend';
    }
    this.pageIndex = 1;
    this.loadUsers();
  }

  onPageIndexChange(page: number): void {
    this.pageIndex = page;
    this.loadUsers();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.pageIndex = 1;
    this.loadUsers();
  }

  onStatusFilterChange(value: 'all' | 'active' | 'inactive'): void {
    this.statusFilter = value;
    this.pageIndex = 1;
    this.loadUsers();
  }

  onRoleFilterChange(value: string): void {
    this.roleFilter = value;
    this.pageIndex = 1;
    this.loadUsers();
  }

  openAddUserModal(): void {
    const modal = this.modal.create({
      nzTitle: 'Create New User',
      nzContent: CreateUserComponent,
      nzFooter: null,
      nzWidth: 900,
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
    this.confirmationDialogService.showPasswordRegeneration(user).then(confirmed => {
      if (confirmed) {
        this.regeneratePassword(userId, user);
      }
    });
  }

  onConfirmEmail(user: User): void {
    this.modal.confirm({
      nzTitle: 'Confirm Email',
      nzContent: `Manually confirm email for <strong>${this.getDisplayName(user)}</strong> (${user.email})? The student will be able to sign in without the email link.`,
      nzOkText: 'Confirm Email',
      nzOkType: 'primary',
      nzOnOk: () =>
        new Promise<void>((resolve, reject) => {
          this.userManagementService.confirmUserEmail(user.id).pipe(takeUntil(this.destroy$)).subscribe({
            next: (res) => {
              this.message.success(res?.message || 'Email confirmed successfully');
              this.loadUsers();
              resolve();
            },
            error: (error) => {
              this.message.error(error?.error?.message || error?.message || 'Failed to confirm email');
              reject();
            }
          });
        })
    });
  }

  onResendEmailVerification(user: User): void {
    this.modal.confirm({
      nzTitle: 'Resend Verification Email',
      nzContent: `Send a new verification email to <strong>${user.email}</strong>?`,
      nzOkText: 'Send Email',
      nzOkType: 'primary',
      nzOnOk: () =>
        new Promise<void>((resolve, reject) => {
          this.userManagementService.resendUserEmailVerification(user.id).pipe(takeUntil(this.destroy$)).subscribe({
            next: (res) => {
              this.message.success(res?.message || 'Verification email sent');
              resolve();
            },
            error: (error) => {
              this.message.error(error?.error?.message || error?.message || 'Failed to resend verification email');
              reject();
            }
          });
        })
    });
  }

  onToggleUserStatus(user: User): void {
    const dialog = user.isActive
      ? this.confirmationDialogService.showUserDeactivation(user)
      : this.confirmationDialogService.showUserActivation(user);
    dialog.then(confirmed => {
      if (confirmed) {
        this.performStatusUpdate(user, !user.isActive);
      }
    });
  }

  onDeleteUser(user: User): void {
    this.confirmationDialogService.showUserDeletion(user).then(confirmed => {
      if (!confirmed) {
        return;
      }
      this.loading = true;
      this.userManagementService.deleteUser(user.id, true).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          this.message.success('User permanently deleted successfully');
          this.loadUsers();
        },
        error: (error) => {
          this.message.error('Failed to delete user: ' + error.message);
          this.loading = false;
        }
      });
    });
  }

  onExportUsers(): void {
    this.exporting = true;
    const exportPageSize = Math.min(Math.max(this.total || this.pageSize, this.pageSize), 20000);
    this.userManagementService.getUsers(
      1,
      exportPageSize,
      this.searchKey || undefined,
      this.roleFilter || undefined,
      this.statusFilter !== 'all' ? (this.statusFilter === 'active') : undefined,
      this.sortBy,
      this.sortDescending
    ).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        if (!response.users?.length) {
          this.customNotificationService.notification('error', 'Error', 'No users to export.');
          this.exporting = false;
          return;
        }

        const rows = response.users.map(user => ({
          'Full Name': this.getDisplayName(user),
          Email: user.email,
          'Phone Number': user.phoneNumber || '',
          Roles: this.getRoleNames(user),
          Status: user.isActive ? 'Active' : 'Inactive',
          'Email Verification': user.isEmailConfirmed ? 'Confirmed' : 'Pending',
          'Phone Verification': user.phoneNumber
            ? (user.isPhoneConfirmed ? 'Confirmed' : 'Pending')
            : '',
          'Created At': this.formatDate(user.createdAt),
          'Last Login': user.lastLoginAt ? this.formatDate(user.lastLoginAt) : ''
        }));

        this.excelExportService.exportAsExcelFile(rows, 'users-list', 'Users');
        this.customNotificationService.notification(
          'success',
          'Success',
          `Exported ${rows.length} users to Excel.`
        );
        this.exporting = false;
      },
      error: () => {
        this.customNotificationService.notification('error', 'Error', 'Failed to export data');
        this.exporting = false;
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
    if (!dateString) {
      return '-';
    }
    return new Date(dateString).toLocaleDateString();
  }

  private loadStatisticsAsync(): void {
    this.userManagementService.getUserStatistics().pipe(takeUntil(this.destroy$)).subscribe({
      next: (stats) => {
        this.totalUsers = stats.totalUsers;
        this.activeUsers = stats.activeUsers;
        this.inactiveUsers = stats.inactiveUsers;
      },
      error: () => {
        this.totalUsers = this.total;
        this.activeUsers = this.users.filter(u => u.isActive).length;
        this.inactiveUsers = this.users.filter(u => !u.isActive).length;
      }
    });
  }

  private performStatusUpdate(user: User, isActive: boolean): void {
    const statusUpdate: UserStatusUpdate = { userId: user.id, isActive };
    this.userManagementService.updateUserStatus(statusUpdate).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.message.success(`User ${isActive ? 'activated' : 'deactivated'} successfully`);
        this.loadUsers();
      },
      error: (error) => {
        this.message.error(`Failed to ${isActive ? 'activate' : 'deactivate'} user: ` + error.message);
      }
    });
  }

  private regeneratePassword(userId: string, user: User): void {
    this.userManagementService.regeneratePassword(userId).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
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
