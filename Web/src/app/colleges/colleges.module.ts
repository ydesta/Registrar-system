import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CollegesRoutingModule } from './colleges-routing.module';
import { CollegesComponent } from './colleges.component';
import { AddCollegeComponent } from './add-college/add-college.component';
import { AddBatchComponent } from './add-batch/add-batch.component';
import { BatchComponent } from './batch/batch.component';
import { ActivityComponent } from './activity/activity.component';
import { AddActivityComponent } from './add-activity/add-activity.component';
import { AddAcademicTermComponent } from './add-academic-term/add-academic-term.component';
import { AcademicTermComponent } from './academic-term/academic-term.component';
import { AcademicTermActivityComponent } from './academic-term-activity/academic-term-activity.component';
import { AddAcademicTermActivityComponent } from './add-academic-term-activity/add-academic-term-activity.component';
import { AddTermCourseOfferingComponent } from './add-term-course-offering/add-term-course-offering.component';
import { TermCourseOfferingComponent } from './term-course-offering/term-course-offering.component';
import { AcademicStatusComponent } from './academic-status/academic-status.component';
import { AddAcademicStatusComponent } from './add-academic-status/add-academic-status.component';
import { AddEntryComponent } from './add-entry/add-entry.component';
import { EntryComponent } from './entry/entry.component';
import { SharedModule } from '../shared-module/shared/shared.module';
import { NgxPrintModule } from 'ngx-print';
import { CourseOfferingInstructorAssignmentComponent } from './course-offering-instructor-assignment/course-offering-instructor-assignment.component';
import { NzModalRef } from 'ng-zorro-antd/modal';

@NgModule({
  declarations: [
    CollegesComponent,
    AddCollegeComponent,
    AddBatchComponent,
    BatchComponent,
    ActivityComponent,
    AddActivityComponent,
    AddAcademicTermComponent,
    AcademicTermComponent,
    AcademicTermActivityComponent,
    AddAcademicTermActivityComponent,
    AddTermCourseOfferingComponent,
    TermCourseOfferingComponent,
    AcademicStatusComponent,
    AddAcademicStatusComponent,
    AddEntryComponent,
    EntryComponent,
    CourseOfferingInstructorAssignmentComponent
  ],
  imports: [
    CommonModule,
    CollegesRoutingModule,
    SharedModule,
    NgxPrintModule
  ],
  providers: [
    {
      provide: NzModalRef,
      useValue: {
        getInstance: () => {
          return {
            setFooterWithTemplate: () => {}
          };
        }
      }
    }
  ]
})
export class CollegesModule { }
