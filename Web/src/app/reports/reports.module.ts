import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { ReportsRoutingModule } from './reports-routing.module';
import { ReportsComponent } from './reports.component';
import { NgxPrintModule } from 'ngx-print';
import { SharedModule } from '../shared-module/shared/shared.module';
import { CourseReportComponent } from './course-report/course-report.component';
import { RegisteredStudentComponent } from './registered-student/registered-student.component';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { RegisteredStudentPerCourseComponent } from './registered-student-per-course/registered-student-per-course.component';
import { RegisteredStudentPerBatchComponent } from './registered-student-per-batch/registered-student-per-batch.component';
import { CourseOfferedPerAcademicTermComponent } from './course-offered-per-academic-term/course-offered-per-academic-term.component';
import { AcademicTermRegistrationSlipComponent } from './academic-term-registration-slip/academic-term-registration-slip.component';
import { TranscriptSearchComponent } from './transcript-search/transcript-search.component';
import { ReactiveFormsModule } from '@angular/forms';
@NgModule({
  declarations: [
    ReportsComponent,
    CourseReportComponent,
    RegisteredStudentComponent,
    RegisteredStudentPerCourseComponent,
    RegisteredStudentPerBatchComponent,
    CourseOfferedPerAcademicTermComponent,
    AcademicTermRegistrationSlipComponent,
     TranscriptSearchComponent,
  ],
  imports: [
    CommonModule,
    ReportsRoutingModule,
    NgxPrintModule,
    SharedModule,
    NzRadioModule,
    NzCollapseModule,
    NzCardModule,
    NzButtonModule,
    NzTableModule,
    NzGridModule,
    NzTypographyModule,
    NzIconModule,
    NzDividerModule,
    NzSpaceModule,
    NzTagModule,
    NzProgressModule,
    ReactiveFormsModule,
  ],
})
export class ReportsModule {}
