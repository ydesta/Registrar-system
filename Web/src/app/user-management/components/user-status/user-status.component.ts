import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { NzMessageService } from 'ng-zorro-antd/message';
import { UserManagementService } from '../../../services/user-management.service';
import { UserStatusUpdate } from '../../../services/user-management.interface';
import { User } from '../../../types/user-management.types';

@Component({
  selector: 'app-user-status',
  templateUrl: './user-status.component.html',
  styleUrls: ['./user-status.component.scss']
})
export class UserStatusComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  user: User | null = null;
  loading = false;
  userId: string = '';

  constructor(
    private userManagementService: UserManagementService,
    private route: ActivatedRoute,
    private router: Router,
    private message: NzMessageService
  ) {}

  ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('id') || '';
    if (this.userId) {
      this.loadUser();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUser(): void {
    this.loading = true;
    this.userManagementService.getUserById(this.userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user) => {
          this.user = user;
          this.loading = false;
        },
        error: (error) => {
          this.message.error('Failed to load user: ' + error.message);
          this.loading = false;
        }
      });
  }

  onToggleStatus(): void {
    if (this.user) {
      const statusUpdate: UserStatusUpdate = {
        userId: this.user.id,
        isActive: !this.user.isActive
      };

      this.userManagementService.updateUserStatus(statusUpdate)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.message.success(`User ${this.user?.isActive ? 'deactivated' : 'activated'} successfully`);
            this.loadUser();
          },
          error: (error) => {
            this.message.error('Failed to update user status: ' + error.message);
          }
        });
    }
  }

  onBack(): void {
    this.router.navigate(['/user-management/users']);
  }
} 