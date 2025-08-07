import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { StudentSectionAssignmentsComponent } from './student-section-assignments.component';
import { SectionAssignedStudentsComponent } from './section-assigned-students/section-assigned-students.component';

const routes: Routes = [
  {
    path: 'student-section-assignments',
    component: StudentSectionAssignmentsComponent
  },
  {
    path: 'section-assigned-students',
    component: SectionAssignedStudentsComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class StudentSectionAssignmentsRoutingModule { } 