import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { StudentSectionAssignmentsComponent } from './student-section-assignments.component';
import { SectionAssignedStudentsComponent } from './section-assigned-students/section-assigned-students.component';
import { ReassignStudentSectionComponent } from './reassign-student-section/reassign-student-section.component';
import { StudentLabSectionComponent } from './student-lab-section/student-lab-section.component';
import { InstructorSectionsComponent } from './instructor-sections/instructor-sections.component';
import { InstructorSectionFormComponent } from './instructor-sections/instructor-section-form/instructor-section-form.component';
import { ViewAssignedInstructorSectionsComponent } from './instructor-sections/view-assigned-instructor-sections/view-assigned-instructor-sections.component';
import { StudentCourseSectionAssignmentComponent } from './student-course-section-assignment/student-course-section-assignment.component';

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
  },
  {
    path: 'instructor-sections',
    component: InstructorSectionsComponent
  },
  {
    path: 'instructor-section-form',
    component: InstructorSectionFormComponent
  },
  {
    path: 'instructor-section-form/:id',
    component: InstructorSectionFormComponent
  },
  {
    path: 'assigned-instructor-section',
    component: ViewAssignedInstructorSectionsComponent
  },
  {
    path: 'course-section-assignment',
    component: StudentCourseSectionAssignmentComponent
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class StudentSectionAssignmentsRoutingModule { } 