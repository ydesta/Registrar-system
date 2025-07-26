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

const routes: Routes = [
  { path: '', component: ReportsComponent },

  { path: 'course-report', component: CourseReportComponent },
  { path: 'registered-student', component: RegisteredStudentPerCourseComponent },
  { path: 'registered-student-per-batch', component: RegisteredStudentPerBatchComponent },
  { path: 'course-offered-per-term', component: CourseOfferedPerAcademicTermComponent },
  { path: 'academic-term-registration-slip', component: AcademicTermRegistrationSlipComponent },
  { path: 'transcript-search', component: TranscriptSearchComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ReportsRoutingModule { }
