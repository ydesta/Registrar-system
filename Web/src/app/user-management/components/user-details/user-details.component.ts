import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { UserManagementService } from '../../../services/user-management.service';
import { User, Role } from '../../../types/user-management.types';

@Component({
  selector: 'app-user-details',
  templateUrl: './user-details.component.html',
  styleUrls: ['./user-details.component.scss']
})
export class UserDetailsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  user: User | null = null;
  loading = false;
  userId: string = '';
  isEditing = false;
  form!: FormGroup;
  availableRoles: Role[] = [];
  loadingRoles = false;

  constructor(
    private userManagementService: UserManagementService,
    private route: ActivatedRoute,
    private router: Router,
    private message: NzMessageService,
    private fb: FormBuilder,
    private modalService: NzModalService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('id') || '';
    
    if (this.userId) {
      this.loadUser();
      this.loadRoles();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.form = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: [''],
      selectedRoles: [[]]
    });
  }

  loadUser(): void {
    this.loading = true;
    this.userManagementService.getUserById(this.userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user) => {
          this.user = user;
          this.populateForm();
          
          // Check if edit mode is requested via query parameter
          const editMode = this.route.snapshot.queryParamMap.get('edit');
          if (editMode === 'true') {
            this.isEditing = true; // Start in edit mode
          }
          
          this.loading = false;
        },
        error: (error) => {
          this.message.error('Failed to load user: ' + error.message);
          this.loading = false;
        }
      });
  }

  loadRoles(): void {
    this.loadingRoles = true;
    this.userManagementService.getRoles()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (roles) => {
          this.availableRoles = roles;
          this.loadingRoles = false;
        },
        error: (error) => {
          console.error('Error loading roles:', error);
          this.loadingRoles = false;
        }
      });
  }

  private populateForm(): void {
    if (this.user) {
      this.form.patchValue({
        firstName: this.user.firstName || '',
        lastName: this.user.lastName || '',
        email: this.user.email || '',
        phoneNumber: this.user.phoneNumber || '',
        selectedRoles: this.user.roles.map(role => role.id)
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/user-management/users']);
  }

  startEditing(): void {
    this.isEditing = true;
    this.populateForm();
  }

  cancelEditing(): void {
    this.isEditing = false;
    this.populateForm(); // Reset form to original values
  }

  saveChanges(): void {
    if (!this.user || !this.form.valid) return;
    
    const formValue = this.form.value;
    const updatedUser: User = {
      ...this.user,
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      email: formValue.email,
      phoneNumber: formValue.phoneNumber
    };
    
    this.loading = true;
    this.userManagementService.updateUser(this.userId, updatedUser)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.message.success('User updated successfully');
          this.user = updatedUser;
          this.isEditing = false;
          this.loading = false;
        },
        error: (error) => {
          this.message.error('Failed to update user: ' + error.message);
          this.loading = false;
        }
      });
  }

  getRoleNameById(roleId: string): string {
    const role = this.availableRoles.find(r => r.id === roleId);
    return role ? role.name : 'Unknown Role';
  }

  // Legacy methods for backward compatibility
  onBack(): void {
    this.goBack();
  }

  onEdit(): void {
    this.startEditing();
  }

  onCancel(): void {
    this.cancelEditing();
  }

  onSave(): void {
    this.saveChanges();
  }
} 