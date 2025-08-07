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

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();
  private reloadSubject = new Subject<void>();
  Math = Math;
  users: User[] = [];
  loading = false;
  searchKey = '';
  pageIndex = 1;
  pageSize = 10;
  pageSizeOption = [5, 10, 15, 25, 50, 100];
  total = 0;
  statusFilter: 'all' | 'active' | 'inactive' = 'all';
  roleFilter: string = '';
  roles: any[] = [];
  
  // Statistics properties
  totalUsers = 0;
  activeUsers = 0;
  inactiveUsers = 0;

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
    private modal: NzModalService
  ) {}

  ngOnInit(): void {
    this.setupSearch();
    this.setupReloadDebounce();
    this.loadUsers();
    this.loadRoles();
    // Remove separate statistics call - will be handled in loadUsers
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
      this.pageIndex = 1; // Reset to first page when searching
      this.loadUsers();
    });
  }

  setupReloadDebounce(): void {
    this.reloadSubject.pipe(
      debounceTime(100), // Short debounce for reloads
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.reloadUsersOnly();
    });
  }

  onSearch(): void {
    this.searchSubject.next(this.searchKey);
  }

  loadUsers(): void {
    this.loading = true;
    
    // Load users first (priority)
    const usersObservable = this.userManagementService.getUsers(
      this.pageIndex,
      this.pageSize,
      this.searchKey || undefined,
      this.roleFilter || undefined,
      this.statusFilter !== 'all' ? (this.statusFilter === 'active') : undefined
    );

    // Load users with priority
    usersObservable.pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        console.log("Users response:", response);
        this.users = response.users;
        this.total = response.total;
        this.loading = false;
        
        // Load statistics after users are loaded (non-blocking)
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

  // Load statistics asynchronously to prevent UI blocking
  private loadStatisticsAsync(): void {
    this.userManagementService.getUserStatistics()
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (stats) => {
          this.totalUsers = stats.totalUsers;
          this.activeUsers = stats.activeUsers;
          this.inactiveUsers = stats.inactiveUsers;
        },
        error: (error) => {
          console.error('Failed to load user statistics:', error);
          // Fallback to calculating from current page data
          this.totalUsers = this.total;
          this.activeUsers = this.users.filter(u => u.isActive).length;
          this.inactiveUsers = this.users.filter(u => !u.isActive).length;
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

  // Optimized method to reload only users without statistics for better performance
  private reloadUsersOnly(): void {
    this.userManagementService.getUsers(
      this.pageIndex,
      this.pageSize,
      this.searchKey || undefined,
      this.roleFilter || undefined,
      this.statusFilter !== 'all' ? (this.statusFilter === 'active') : undefined
    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.users = response.users;
        this.total = response.total;
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

  loadUserStatistics(): void {
    // This method is now called from loadUsers() to avoid duplicate calls
    // Keeping for backward compatibility but it's no longer used
  }

  applyFilters(): void {
    // Server-side filtering is now handled in loadUsers()
    // This method is kept for compatibility but no longer needed for client-side filtering
  }

  updatePaginatedUsers(): void {
    // Server-side pagination is now handled in loadUsers()
    // This method is kept for compatibility but no longer needed
  }

  onPageIndexChange(page: number): void {
    this.pageIndex = page;
    this.loadUsers();
  }
  
  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.pageIndex = 1;  // Reset to first page when changing page size
    this.loadUsers();
  }

  onStatusFilterChange(value: 'all' | 'active' | 'inactive'): void {
    this.statusFilter = value;
    this.pageIndex = 1; // Reset to first page when filtering
    this.loadUsers();
  }

  onRoleFilterChange(value: string): void {
    this.roleFilter = value;
    this.pageIndex = 1; // Reset to first page when filtering
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
          // Show loading state during delete operation
          this.loading = true;
          
          // Use permanent delete to actually remove the user from the database
          this.userManagementService.deleteUser(user.id, true)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: () => {
                this.message.success('User permanently deleted successfully');
                // Use debounced reload to prevent rapid successive calls
                this.reloadSubject.next();
              },
              error: (error) => {
                this.message.error('Failed to delete user: ' + error.message);
                this.loading = false;
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