import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UserManagementHomeComponent } from './user-management-home.component';
import { UserListComponent } from './components/user-list/user-list.component';
import { RoleManagementComponent } from './components/role-management/role-management.component';
import { PermissionManagementComponent } from './components/permission-management/permission-management.component';
import { UserActivityComponent } from './components/user-activity/user-activity.component';
import { UserDetailsComponent } from './components/user-details/user-details.component';
import { AuthGuardService } from '../services/guards/auth-guard.service';

const routes: Routes = [
  { 
    path: '', 
    component: UserManagementHomeComponent,
    canActivate: [AuthGuardService],
    data: { roles: ['Administrator', 'Admin', 'Super Admin'] }
  },
  { 
    path: 'users', 
    component: UserListComponent,
    canActivate: [AuthGuardService],
    data: { roles: ['Administrator', 'Admin', 'Super Admin'] }
  },
  { 
    path: 'roles', 
    component: RoleManagementComponent,
    canActivate: [AuthGuardService],
    data: { roles: ['Administrator', 'Admin', 'Super Admin'] }
  },
  { 
    path: 'permissions', 
    component: PermissionManagementComponent,
    canActivate: [AuthGuardService],
    data: { roles: ['Administrator', 'Admin', 'Super Admin'] }
  },
  { 
    path: 'activity', 
    component: UserActivityComponent,
    canActivate: [AuthGuardService],
    data: { roles: ['Administrator', 'Admin', 'Super Admin'] }
  },
  { 
    path: 'user/:id', 
    component: UserDetailsComponent,
    canActivate: [AuthGuardService],
    data: { roles: ['Administrator', 'Admin', 'Super Admin'] }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UserManagementRoutingModule { } 