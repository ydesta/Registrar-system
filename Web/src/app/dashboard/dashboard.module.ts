import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxChartsModule } from '@swimlane/ngx-charts';

import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardComponent } from './dashboard.component';
import { StudentsModule } from '../students/students.module';
import { StudentDashboardComponent } from './student-dashboard/student-dashboard.component';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
//import { NgxChartsModule } from '@swimlane/ngx-charts';
//import { NzCardModule, NzGridModule, NzIconModule, NzTableModule, NzTabsModule, NzListModule, NzBadgeModule, NzTagModule } from 'ng-zorro-antd';
// Add these missing modules from your template
import { SharedModule } from '../shared-module/shared/shared.module';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzTimelineModule } from 'ng-zorro-antd/timeline';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
@NgModule({
  declarations: [
    DashboardComponent,
    StudentDashboardComponent,
    AdminDashboardComponent
  ],
  imports: [
    CommonModule,
    DashboardRoutingModule,
    StudentsModule,
    NgxChartsModule,
    SharedModule,
    NzBadgeModule,
    NzTagModule,
    NzProgressModule,
    NzListModule,
    NzGridModule,
    NzTimelineModule,
    NzCardModule,
    NzIconModule
  ]
})
export class DashboardModule { }
