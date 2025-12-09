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
import { AuthGuard } from '../guards/auth.guard';

const routes: Routes = [
  { path: '', component: CollegesComponent, canActivate: [AuthGuard] },
  { path: 'add-college/:id', component: AddCollegeComponent, canActivate: [AuthGuard] },
  { path: 'batch', component: BatchComponent, canActivate: [AuthGuard] },
  { path: 'add-batch/:id', component: AddBatchComponent, canActivate: [AuthGuard] },
  { path: 'activity', component: ActivityComponent, canActivate: [AuthGuard] },
  { path: 'entry', component: EntryComponent, canActivate: [AuthGuard] },
  { path: 'add-entry/:id', component: AddEntryComponent, canActivate: [AuthGuard] },
  { path: 'add-activity/:id', component: AddActivityComponent, canActivate: [AuthGuard] },
  { path: 'academic-status', component: AcademicStatusComponent, canActivate: [AuthGuard] },
  { path: 'add-academic-status/:id', component: AddAcademicStatusComponent, canActivate: [AuthGuard] },
  { path: 'term-course-offering', component: TermCourseOfferingComponent, canActivate: [AuthGuard] },
  { path: 'add-term-course-offering/:id', component: AddTermCourseOfferingComponent, canActivate: [AuthGuard] },
  { path: 'academic-term-activity', component: AcademicTermActivityComponent, canActivate: [AuthGuard] },
  { path: 'add-academic-term-activity/:id', component: AddAcademicTermActivityComponent, canActivate: [AuthGuard] },
  { path: 'academic-term', component: AcademicTermComponent, canActivate: [AuthGuard] },
  { path: 'add-academic-term/:id', component: AddAcademicTermComponent, canActivate: [AuthGuard] },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CollegesRoutingModule { }
