import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { StudentSectionAssignmentsComponent } from './student-section-assignments.component';
import { SectionAssignedStudentsComponent } from './section-assigned-students/section-assigned-students.component';
import { ReassignStudentSectionComponent } from './reassign-student-section/reassign-student-section.component';
import { StudentLabSectionComponent } from './student-lab-section/student-lab-section.component';

const routes: Routes = [
  {
    path: 'student-section-assignments',
    component: StudentSectionAssignmentsComponent
  },
  {
    path: 'section-assigned-students',
    component: SectionAssignedStudentsComponent
  },
  {
    path: 'reassigne-student-section',
    component: ReassignStudentSectionComponent
  },
  {
    path: 'student-lab-section',
    component: StudentLabSectionComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class StudentSectionAssignmentsRoutingModule { } 