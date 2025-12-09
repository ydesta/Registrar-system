import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { AccrediationComponent } from "./accrediation/accrediation.component";
import { AddAccrediationComponent } from "./add-accrediation/add-accrediation.component";
import { AddCurriculumComponent } from "./add-curriculum/add-curriculum.component";
import { AddStatusTrackingComponent } from "./add-status-tracking/add-status-tracking.component";
import { CurriculaComponent } from "./curricula.component";
import { StatusTrackingComponent } from "./status-tracking/status-tracking.component";
import { ManageQuadrantBreakdownComponent } from "./quadrant-breakdown/manage-quadrant-breakdown/manage-quadrant-breakdown.component";
import { QuadrantBreakdownFormComponent } from "./quadrant-breakdown/quadrant-breakdown-form/quadrant-breakdown-form.component";
import { ManageCurriculumBreakdownComponent } from "./curriculum-breakdown/manage-curriculum-breakdown/manage-curriculum-breakdown.component";
import { CurriculumBreakdownFormComponent } from "./curriculum-breakdown/curriculum-breakdown-form/curriculum-breakdown-form.component";
import { CurriculumCourseBreakdownListComponent } from "./curriculum-breakdown/curriculm-course-breakdown-list/curriculm-course-breakdown-list.component";
import { DataMigrationComponent } from "./data-migration/data-migration.component";
import { AuthGuard } from '../guards/auth.guard';

const routes: Routes = [
  { path: "", component: CurriculaComponent, canActivate: [AuthGuard] },
  { path: "add-curriculum/:id", component: AddCurriculumComponent, canActivate: [AuthGuard] },
  { path: "status-tracking", component: StatusTrackingComponent, canActivate: [AuthGuard] },
  { path: "add-status-tracking/:id", component: AddStatusTrackingComponent, canActivate: [AuthGuard] },
  { path: "accrediation", component: AccrediationComponent, canActivate: [AuthGuard] },
  { path: "quadrant-break-down", component: ManageQuadrantBreakdownComponent, canActivate: [AuthGuard] },
  {
    path: "quadrant-break-down-form",
    component: QuadrantBreakdownFormComponent,
    canActivate: [AuthGuard]
  },
  { path: "add-accrediation/:id", component: AddAccrediationComponent, canActivate: [AuthGuard] },
  {
    path: "curriculum-break-down",
    component: ManageCurriculumBreakdownComponent,
    canActivate: [AuthGuard]
  },
  {
    path: "curriculum-break-down-form",
    component: CurriculumBreakdownFormComponent,
    canActivate: [AuthGuard]
  },
  {
    path: "curriculum-break-down-list",
    component: CurriculumCourseBreakdownListComponent,
    canActivate: [AuthGuard]
  },
  {
    path: "data-migration",
    component: DataMigrationComponent,
    canActivate: [AuthGuard]
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CurriculaRoutingModule {}
