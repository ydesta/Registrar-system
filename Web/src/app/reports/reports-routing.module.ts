import { RegisteredStudentComponent } from './registered-student/registered-student.component';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CourseReportComponent } from './course-report/course-report.component';
import { ReportsComponent } from './reports.component';
import { RegisteredStudentPerCourseComponent } from './registered-student-per-course/registered-student-per-course.component';
import { RegisteredStudentPerBatch } from './model/registered-student-per-batch.model';
import { RegisteredStudentPerBatchComponent } from './registered-student-per-batch/registered-student-per-batch.component';
import { CourseOfferedPerAcademicTermComponent } from './course-offered-per-academic-term/course-offered-per-academic-term.component';
import { AcademicTermRegistrationSlipComponent } from './academic-term-registration-slip/academic-term-registration-slip.component';
import { TranscriptSearchComponent } from './transcript-search/transcript-search.component';
import { StudentSemsterCourseRegistrationSlipComponent } from './student-semster-course-registration-slip/student-semster-course-registration-slip.component';
import { AuthGuard } from '../guards/auth.guard';

const routes: Routes = [
  { path: '', component: ReportsComponent, canActivate: [AuthGuard] },

  { path: 'course-report', component: CourseReportComponent, canActivate: [AuthGuard] },
  { path: 'registered-student', component: RegisteredStudentPerCourseComponent, canActivate: [AuthGuard] },
  { path: 'registered-student-per-batch', component: RegisteredStudentPerBatchComponent, canActivate: [AuthGuard] },
  { path: 'course-offered-per-term', component: CourseOfferedPerAcademicTermComponent, canActivate: [AuthGuard] },
  { path: 'academic-term-registration-slip', component: AcademicTermRegistrationSlipComponent, canActivate: [AuthGuard] },
  { path: 'transcript-search', component: TranscriptSearchComponent, canActivate: [AuthGuard] },
  { path: 'registration-slip', component: StudentSemsterCourseRegistrationSlipComponent, canActivate: [AuthGuard] },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ReportsRoutingModule { }
