import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ApplicantsRoutingModule } from './applicants-routing.module';
import { ApplicantsComponent } from './applicants.component';
import { AddApplicantComponent } from './add-applicant/add-applicant.component';
import { AddApplicantHistoryComponent } from './add-applicant-history/add-applicant-history.component';
import { ApplicantHistoryComponent } from './applicant-history/applicant-history.component';
import { ApplicantEducationBackgroundComponent } from './applicant-education-background/applicant-education-background.component';
import { AddApplicantEducationBackgroundComponent } from './add-applicant-education-background/add-applicant-education-background.component';
import { AddApplicantWorkExperienceComponent } from './add-applicant-work-experience/add-applicant-work-experience.component';
import { ApplicantWorkExperienceComponent } from './applicant-work-experience/applicant-work-experience.component';
import { ApplicantContactPersonComponent } from './applicant-contact-person/applicant-contact-person.component';
import { AddApplicantContactPersonComponent } from './add-applicant-contact-person/add-applicant-contact-person.component';
import { SharedModule } from '../shared-module/shared/shared.module';
import { SafePipe } from '../safe.pipe';
import { DemoPipe } from '../demo.pipe';
import { ViewStatusComponent } from './view-status/view-status.component';

@NgModule({
  declarations: [
    ApplicantsComponent,
    AddApplicantComponent,
    AddApplicantHistoryComponent,
    ApplicantHistoryComponent,
    ApplicantEducationBackgroundComponent,
    AddApplicantEducationBackgroundComponent,
    AddApplicantWorkExperienceComponent,
    ApplicantWorkExperienceComponent,
    ApplicantContactPersonComponent,
    AddApplicantContactPersonComponent,
    SafePipe,
    DemoPipe,
    ViewStatusComponent,
   
  ],
  imports: [
    CommonModule,
    ApplicantsRoutingModule,
    SharedModule
  ]
})
export class ApplicantsModule { }
