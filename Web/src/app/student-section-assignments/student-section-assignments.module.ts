import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { StudentSectionAssignmentsComponent } from './student-section-assignments.component';
import { SectionAssignedStudentsComponent } from './section-assigned-students/section-assigned-students.component';
import { StudentSectionAssignmentsRoutingModule } from './student-section-assignments-routing.module';

// ng-zorro imports
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';

@NgModule({
  declarations: [
    StudentSectionAssignmentsComponent,
    SectionAssignedStudentsComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    StudentSectionAssignmentsRoutingModule,
    NzCardModule,
    NzFormModule,
    NzSelectModule,
    NzButtonModule,
    NzIconModule,
    NzTableModule,
    NzTagModule,
    NzSpaceModule,
    NzAlertModule,
    NzEmptyModule,
    NzCheckboxModule,
    NzInputNumberModule,
    NzCollapseModule
  ],
  exports: [
    StudentSectionAssignmentsComponent,
    SectionAssignedStudentsComponent
  ]
})
export class StudentSectionAssignmentsModule { } 