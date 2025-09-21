import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { UserManagementRoutingModule } from './user-management-routing.module';
import { UserManagementHomeComponent } from './user-management-home.component';

// Component imports
import { UserListComponent } from './components/user-list/user-list.component';
import { RoleManagementComponent } from './components/role-management/role-management.component';
import { RoleCreateComponent } from './components/role-create/role-create.component';
import { RoleEditComponent } from './components/role-edit/role-edit.component';
import { PermissionManagementComponent } from './components/permission-management/permission-management.component';
import { UserActivityComponent } from './components/user-activity/user-activity.component';
import { UserCreateComponent } from './components/user-create/user-create.component';
import { UserDetailsComponent } from './components/user-details/user-details.component';
import { UserStatusComponent } from './components/user-status/user-status.component';
import { ResetPasswordComponent } from './components/reset-password/reset-password.component';
import { CreateUserComponent } from './components/create-user/create-user.component';
import { UserCredentialsComponent } from './components/user-credentials/user-credentials.component';

// Ng-Zorro Modules
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzMessageModule } from 'ng-zorro-antd/message';
import { NzNotificationModule } from 'ng-zorro-antd/notification';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { NzModalRef } from 'ng-zorro-antd/modal';

@NgModule({
  declarations: [
    UserManagementHomeComponent,
    UserListComponent,
    RoleManagementComponent,
    RoleCreateComponent,
    RoleEditComponent,
    PermissionManagementComponent,
    UserActivityComponent,
    UserCreateComponent,
    UserDetailsComponent,
    UserStatusComponent,
    ResetPasswordComponent,
    CreateUserComponent,
    UserCredentialsComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    UserManagementRoutingModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzSpinModule,
    NzAlertModule,
    NzTableModule,
    NzModalModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzDatePickerModule,
    NzSwitchModule,
    NzTagModule,
    NzToolTipModule,
    NzPopconfirmModule,
    NzMessageModule,
    NzNotificationModule,
    NzAvatarModule,
    NzEmptyModule,
    NzDividerModule,
    NzDropDownModule,
    NzPaginationModule,
    NzDescriptionsModule,
    NzTabsModule,
    NzCheckboxModule,
    NzMenuModule,
    NzProgressModule,
    NzSpaceModule,
    NzCollapseModule
  ],
  providers: [
    {
      provide: NzModalRef,
      useValue: {
        getInstance: () => {
          return {
            setFooterWithTemplate: () => {}
          };
        }
      }
    }
  ]
})
export class UserManagementModule { } 