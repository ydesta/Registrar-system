import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { GeneralInformationComponent } from "./general-information/general-information.component";
import { ApplicantRequestListComponent } from "./reviewer/applicant-request-list/applicant-request-list.component";
import { ApplicantRequestDetailComponent } from "./reviewer/applicant-request-detail/applicant-request-detail.component";
import { ApplicantProfileComponent } from "./applicant-profile/applicant-profile.component";
import { AuthGuardService } from "../services/guards/auth-guard.service";

const routes: Routes = [
  {
    path: "admission-request",
    component: GeneralInformationComponent
  },
  {
    path: "applicant-request-list",
    component: ApplicantRequestListComponent,
    canActivate: [AuthGuardService],
    data: { roles: ['Reviewer', 'Administrator', 'Admin', 'Super Admin'] }
  },
  {
    path: "applicant-request-detail",
    component: ApplicantRequestDetailComponent,
    canActivate: [AuthGuardService],
    data: { roles: ['Reviewer', 'Administrator', 'Admin', 'Super Admin'] }
  },
  {
    path: "applicant-profile",
    component: ApplicantProfileComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdmissionRequestRoutingModule { }
