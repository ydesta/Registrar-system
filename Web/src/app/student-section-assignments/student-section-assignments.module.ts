import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { StudentSectionAssignmentsComponent } from './student-section-assignments.component';
import { SectionAssignedStudentsComponent } from './section-assigned-students/section-assigned-students.component';
import { StudentSectionAssignmentsRoutingModule } from './student-section-assignments-routing.module';

// ng-zorro imports
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';

import { ReassignStudentSectionComponent } from './reassign-student-section/reassign-student-section.component';
import { NzTransferModule } from 'ng-zorro-antd/transfer';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { StudentLabSectionComponent } from './student-lab-section/student-lab-section.component';
import { InstructorSectionFormComponent } from './instructor-sections/instructor-section-form/instructor-section-form.component';
import { InstructorSectionsComponent } from './instructor-sections/instructor-sections.component';
import { ManageInstructorTableComponent } from './instructor-sections/instructor-section-table/instructor-section-table.component';
import { ViewAssignedInstructorSectionsComponent } from './instructor-sections/view-assigned-instructor-sections/view-assigned-instructor-sections.component';
import { StudentCourseSectionAssignmentComponent } from './student-course-section-assignment/student-course-section-assignment.component';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { UnassignedStudentsComponent } from './unassigned-students/unassigned-students.component';
import { AssignStudentToSectionComponent } from './assign-student-to-section/assign-student-to-section.component';

@NgModule({
  declarations: [
    StudentSectionAssignmentsComponent,
    SectionAssignedStudentsComponent,
    ReassignStudentSectionComponent,
    StudentLabSectionComponent,
    InstructorSectionsComponent,
    InstructorSectionFormComponent,
    ManageInstructorTableComponent,
    ViewAssignedInstructorSectionsComponent,
    StudentCourseSectionAssignmentComponent,
    UnassignedStudentsComponent,
    AssignStudentToSectionComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    StudentSectionAssignmentsRoutingModule,
    NzCardModule,
    NzFormModule,
    NzSelectModule,
    NzButtonModule,
    NzIconModule,
    NzToolTipModule,
    NzTableModule,
    NzTagModule,
    NzSpaceModule,
    NzAlertModule,
    NzEmptyModule,
    NzCheckboxModule,
    NzInputNumberModule,
    NzCollapseModule,
    NzGridModule,
    NzInputModule,
    NzTransferModule,
    NzSwitchModule,
    NzModalModule,
    NzDropDownModule,
    NzSpinModule
  ],
  exports: [
    StudentSectionAssignmentsComponent,
    SectionAssignedStudentsComponent
  ]
})
export class StudentSectionAssignmentsModule { } 