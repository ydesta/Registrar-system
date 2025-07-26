import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AcademicStatusComponent } from './academic-status/academic-status.component';
import { AcademicTermActivityComponent } from './academic-term-activity/academic-term-activity.component';
import { AcademicTermComponent } from './academic-term/academic-term.component';
import { ActivityComponent } from './activity/activity.component';
import { AddAcademicStatusComponent } from './add-academic-status/add-academic-status.component';
import { AddAcademicTermActivityComponent } from './add-academic-term-activity/add-academic-term-activity.component';
import { AddAcademicTermComponent } from './add-academic-term/add-academic-term.component';
import { AddActivityComponent } from './add-activity/add-activity.component';
import { AddBatchComponent } from './add-batch/add-batch.component';
import { AddCollegeComponent } from './add-college/add-college.component';
import { AddEntryComponent } from './add-entry/add-entry.component';
import { AddTermCourseOfferingComponent } from './add-term-course-offering/add-term-course-offering.component';
import { BatchComponent } from './batch/batch.component';
import { CollegesComponent } from './colleges.component';
import { EntryComponent } from './entry/entry.component';
import { TermCourseOfferingComponent } from './term-course-offering/term-course-offering.component';

const routes: Routes = [
  { path: '', component: CollegesComponent },
  { path: 'add-college/:id', component: AddCollegeComponent },
  { path: 'batch', component: BatchComponent },
  { path: 'add-batch/:id', component: AddBatchComponent },
  { path: 'activity', component: ActivityComponent },
  { path: 'entry', component: EntryComponent },
  { path: 'add-entry/:id', component: AddEntryComponent },
  { path: 'add-activity/:id', component: AddActivityComponent },
  { path: 'academic-status', component: AcademicStatusComponent },
  { path: 'add-academic-status/:id', component: AddAcademicStatusComponent },
  { path: 'term-course-offering', component: TermCourseOfferingComponent },
  { path: 'add-term-course-offering/:id', component: AddTermCourseOfferingComponent },
  { path: 'academic-term-activity', component: AcademicTermActivityComponent },
  { path: 'add-academic-term-activity/:id', component: AddAcademicTermActivityComponent },
  { path: 'academic-term', component: AcademicTermComponent },
  { path: 'add-academic-term/:id', component: AddAcademicTermComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CollegesRoutingModule { }
