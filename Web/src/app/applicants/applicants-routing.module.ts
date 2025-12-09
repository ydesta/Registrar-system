import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AddApplicantContactPersonComponent } from './add-applicant-contact-person/add-applicant-contact-person.component';
import { AddApplicantEducationBackgroundComponent } from './add-applicant-education-background/add-applicant-education-background.component';
import { AddApplicantHistoryComponent } from './add-applicant-history/add-applicant-history.component';
import { AddApplicantWorkExperienceComponent } from './add-applicant-work-experience/add-applicant-work-experience.component';
import { AddApplicantComponent } from './add-applicant/add-applicant.component';
import { ApplicantContactPersonComponent } from './applicant-contact-person/applicant-contact-person.component';
import { ApplicantEducationBackgroundComponent } from './applicant-education-background/applicant-education-background.component';
import { ApplicantHistoryComponent } from './applicant-history/applicant-history.component';
import { ApplicantWorkExperienceComponent } from './applicant-work-experience/applicant-work-experience.component';
import { ApplicantsComponent } from './applicants.component';
import { ViewStatusComponent } from './view-status/view-status.component';
import { AuthGuard } from '../guards/auth.guard';

const routes: Routes = [
  { path: '', component: ApplicantsComponent, canActivate: [AuthGuard] },
  {
    path: 'applicant-education',
    component: ApplicantEducationBackgroundComponent,
    canActivate: [AuthGuard]
  },
  { path: 'applicant-history', component: ApplicantHistoryComponent, canActivate: [AuthGuard] },
  { path: 'applicant-work', component: ApplicantWorkExperienceComponent, canActivate: [AuthGuard] },
  {
    path: 'applicant-contact-person',
    component: ApplicantContactPersonComponent,
    canActivate: [AuthGuard]
  },
  { path: 'register-applicant/:id', component: AddApplicantComponent, canActivate: [AuthGuard] },
  {
    path: 'add-applicant-education/:id',
    component: AddApplicantEducationBackgroundComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'add-applicant-history/:id',
    component: AddApplicantHistoryComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'add-applicant-work/:id',
    component: AddApplicantWorkExperienceComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'add-applicant-contact-person/:id',
    component: AddApplicantContactPersonComponent,
    canActivate: [AuthGuard]
  },
  { path: 'view-status', component: ViewStatusComponent, canActivate: [AuthGuard] },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ApplicantsRoutingModule {}
