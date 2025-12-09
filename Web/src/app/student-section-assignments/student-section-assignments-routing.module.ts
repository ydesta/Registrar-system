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
import { UnassignedStudentsComponent } from './unassigned-students/unassigned-students.component';
import { AssignStudentToSectionComponent } from './assign-student-to-section/assign-student-to-section.component';
import { AuthGuard } from '../guards/auth.guard';
import { AuthGuardService } from '../services/guards/auth-guard.service';

const routes: Routes = [
  {
    path: 'student-section-assignments',
    component: StudentSectionAssignmentsComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'section-assigned-students',
    component: SectionAssignedStudentsComponent,
    canActivate: [AuthGuardService],
    data: { roles: ['Section Report Viewer', 'Administrator', 'Admin', 'Super Admin', 'Academic Director'] }
  },
  {
    path: 'reassigne-student-section',
    component: ReassignStudentSectionComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'student-lab-section',
    component: StudentLabSectionComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'instructor-sections',
    component: InstructorSectionsComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'instructor-section-form',
    component: InstructorSectionFormComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'instructor-section-form/:id',
    component: InstructorSectionFormComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'assigned-instructor-section',
    component: ViewAssignedInstructorSectionsComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'course-section-assignment',
    component: StudentCourseSectionAssignmentComponent,
    canActivate: [AuthGuard]
  },
   {
    path: 'unassigned-students',
    component: UnassignedStudentsComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'assign-student-to-section',
    component: AssignStudentToSectionComponent,
    canActivate: [AuthGuard]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class StudentSectionAssignmentsRoutingModule { } 