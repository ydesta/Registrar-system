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

const routes: Routes = [
  { path: "", component: CurriculaComponent },
  { path: "add-curriculum/:id", component: AddCurriculumComponent },
  { path: "status-tracking", component: StatusTrackingComponent },
  { path: "add-status-tracking/:id", component: AddStatusTrackingComponent },
  { path: "accrediation", component: AccrediationComponent },
  { path: "quadrant-break-down", component: ManageQuadrantBreakdownComponent },
  {
    path: "quadrant-break-down-form",
    component: QuadrantBreakdownFormComponent
  },
  { path: "add-accrediation/:id", component: AddAccrediationComponent },
  {
    path: "curriculum-break-down",
    component: ManageCurriculumBreakdownComponent
  },
  {
    path: "curriculum-break-down-form",
    component: CurriculumBreakdownFormComponent
  },
  {
    path: "curriculum-break-down-list",
    component: CurriculumCourseBreakdownListComponent
  },
  {
    path: "data-migration",
    component: DataMigrationComponent
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CurriculaRoutingModule {}
