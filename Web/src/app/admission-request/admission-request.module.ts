import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

// Import common styles for the module
import "./styles/common.scss";

import { AdmissionRequestRoutingModule } from "./admission-request-routing.module";
import { GeneralInformationComponent } from "./general-information/general-information.component";
import { EducationFormComponent } from "./education/education-form/education-form.component";
import { ManageEducationComponent } from "./education/manage-education/manage-education.component";
import { ManageWorkExperienceComponent } from "./work-experience/manage-work-experience/manage-work-experience.component";
import { WorkExperienceFormComponent } from "./work-experience/work-experience-form/work-experience-form.component";
import { ContactPersonFormComponent } from "./contact-person/contact-person-form/contact-person-form.component";
import { StudentProgramRequesterFormComponent } from "./student-program-requester/student-program-requester-form/student-program-requester-form.component";
import { ManageStudentProgramRequesterComponent } from "./student-program-requester/manage-student-program-requester/manage-student-program-requester.component";
import { SharedModule } from "../shared-module/shared/shared.module";
import { InstructionComponent } from "./instruction/instruction.component";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { NzModalRef } from "ng-zorro-antd/modal";
import { SchoolWithStudentAgreementComponent } from './school-with-student-agreement/school-with-student-agreement.component';
import { AcademicProgramRequestComponent } from './academic-program-request/academic-program-request.component';
import { DisabledTabDirective } from './directives/disabled-tab.directive';
import { ManageFilesComponent } from './file-management/manage-files/manage-files.component';
import { ManageContactPersonFormComponent } from './contact-person/manage-contact-person-form/manage-contact-person-form.component';
import { ApplicantRequestListComponent } from './reviewer/applicant-request-list/applicant-request-list.component';
import { ApplicantRequestDetailComponent } from './reviewer/applicant-request-detail/applicant-request-detail.component';
import { ApplicantReviewerDecisionComponent } from './reviewer/applicant-reviewer-decision/applicant-reviewer-decision.component';
import { AdmissionTabsComponent } from './shared/admission-tabs/admission-tabs.component';
import { AddressComponent } from "./applicant-profile/address/address.component";
import { ApplicantProfileComponent } from "./applicant-profile/applicant-profile.component";
import { StudentsModule } from "../students/students.module";

@NgModule({
  declarations: [
    GeneralInformationComponent,
    EducationFormComponent,
    ManageEducationComponent,
    ManageWorkExperienceComponent,
    WorkExperienceFormComponent,
    ContactPersonFormComponent,
    StudentProgramRequesterFormComponent,
    ManageStudentProgramRequesterComponent,
    InstructionComponent,
    SchoolWithStudentAgreementComponent,
    AcademicProgramRequestComponent,
    DisabledTabDirective,
    ManageFilesComponent,
    ManageContactPersonFormComponent,
    ApplicantRequestListComponent,
    ApplicantRequestDetailComponent,
    ApplicantReviewerDecisionComponent,
    AdmissionTabsComponent,
    ApplicantProfileComponent,
    AddressComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AdmissionRequestRoutingModule,
    SharedModule,
    StudentsModule
  ],
  providers: [
    {
      provide: NzModalRef,
      useValue: {
        getInstance: () => {
          return {
            setFooterWithTemplate: () => { }
          };
        }
      }
    }
  ]
})
export class AdmissionRequestModule { }
