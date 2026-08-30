import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { NzMessageService } from 'ng-zorro-antd/message';
import { UserManagementService } from '../../../services/user-management.service';
import { User, Role } from '../../../types/user-management.types';
import { ethiopianMobileValidator, normalizeEthiopianMobile, applyEthiopianMobileControl } from 'src/app/common/constant';

@Component({
  selector: 'app-user-details',
  templateUrl: './user-details.component.html',
  styleUrls: ['./user-details.component.scss']
})
export class UserDetailsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  user: User | null = null;
  loading = false;
  userId = '';
  isEditing = false;
  form!: FormGroup;
  availableRoles: Role[] = [];
  loadingRoles = false;

  constructor(
    private userManagementService: UserManagementService,
    private route: ActivatedRoute,
    private router: Router,
    private message: NzMessageService,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [ethiopianMobileValidator()]],
      selectedRoles: [[]]
    });
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

  loadUser(): void {
    this.loading = true;
    this.userManagementService.getUserById(this.userId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (user) => {
        this.user = user;
        this.populateForm();
        this.isEditing = this.route.snapshot.queryParamMap.get('edit') === 'true';
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
    this.userManagementService.getRoles().pipe(takeUntil(this.destroy$)).subscribe({
      next: (roles) => {
        this.availableRoles = roles;
        this.syncSelectedRolesFromUser();
        this.loadingRoles = false;
      },
      error: () => {
        this.loadingRoles = false;
      }
    });
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
    this.populateForm();
  }

  onPhoneBlur(): void {
    applyEthiopianMobileControl(this.form.get('phoneNumber'));
  }

  saveChanges(): void {
    if (!this.user || !this.form.valid) {
      return;
    }
    const formValue = this.form.value;
    const emailChanged = this.user.email !== formValue.email;
    const phoneNumber = formValue.phoneNumber
      ? normalizeEthiopianMobile(formValue.phoneNumber) || formValue.phoneNumber
      : formValue.phoneNumber;
    this.loading = true;
    const updatedUser: User = {
      ...this.user,
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      email: formValue.email,
      phoneNumber
    };
    let updateObservable = this.userManagementService.updateUser(this.userId, updatedUser, emailChanged);
    if (emailChanged) {
      updateObservable = updateObservable.pipe(
        switchMap(() => this.userManagementService.updateUserEmail(this.userId, formValue.email))
      );
    }
    updateObservable.pipe(
      switchMap(() => this.updateUserRoles(formValue.selectedRoles || [])),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (updatedUser) => {
        this.message.success('User updated successfully');
        const selectedRoleIds: string[] = formValue.selectedRoles || [];
        this.user = {
          ...(updatedUser || this.user!),
          firstName: formValue.firstName,
          lastName: formValue.lastName,
          email: formValue.email,
          phoneNumber,
          roles: this.availableRoles.filter(role => selectedRoleIds.includes(role.id))
        };
        this.isEditing = false;
        this.loading = false;
      },
      error: (error) => {
        this.message.error('Failed to update user: ' + (error?.message || 'Unknown error'));
        this.loading = false;
      }
    });
  }

  getRoleNameById(roleId: string): string {
    const role = this.availableRoles.find(r => r.id === roleId);
    return role ? role.name : 'Unknown Role';
  }

  private populateForm(): void {
    if (!this.user) {
      return;
    }
    this.form.patchValue({
      firstName: this.user.firstName || '',
      lastName: this.user.lastName || '',
      email: this.user.email || '',
      phoneNumber: normalizeEthiopianMobile(this.user.phoneNumber) || this.user.phoneNumber || '',
      selectedRoles: this.resolveSelectedRoleIds()
    });
  }

  private syncSelectedRolesFromUser(): void {
    if (!this.user || !this.availableRoles.length) {
      return;
    }
    this.form.patchValue({ selectedRoles: this.resolveSelectedRoleIds() });
  }

  private resolveSelectedRoleIds(): string[] {
    if (!this.user?.roles?.length || !this.availableRoles.length) {
      return [];
    }
    return this.user.roles
      .map(role => {
        if (role.id) {
          const byId = this.availableRoles.find(r => r.id === role.id);
          if (byId) {
            return byId.id;
          }
        }
        return this.availableRoles.find(r =>
          r.name?.localeCompare(role.name || '', undefined, { sensitivity: 'accent' }) === 0
        )?.id;
      })
      .filter((id): id is string => !!id);
  }

  private updateUserRoles(selectedRoleIds: string[]) {
    if (!this.user) {
      return of(null);
    }
    const roleNames = selectedRoleIds
      .map(roleId => this.availableRoles.find(role => role.id === roleId)?.name)
      .filter((name): name is string => !!name);
    const currentRoleNames = (this.user.roles || [])
      .map(role => role.name)
      .filter(name => !!name)
      .sort((a, b) => a.localeCompare(b));
    const nextRoleNames = [...roleNames].sort((a, b) => a.localeCompare(b));
    const unchanged =
      currentRoleNames.length === nextRoleNames.length &&
      currentRoleNames.every((name, index) => name === nextRoleNames[index]);
    if (unchanged) {
      return of(this.user);
    }
    return this.userManagementService.updateUserRoles(this.userId, roleNames).pipe(
      switchMap(() => this.userManagementService.getUserById(this.userId))
    );
  }
}
