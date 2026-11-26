import { UnauthorizedComponent } from "./unauthorized/unauthorized.component";
import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { CardPublicScanComponent } from "./students/card-public-scan/card-public-scan.component";

const routes: Routes = [
  { path: "card-scan/:token", component: CardPublicScanComponent },
  {
    path: "accounts",
    loadChildren: () =>
      import("./accounts/accounts.module").then(m => m.AccountsModule)
  },
  {
    path: 'portal',
    loadChildren: () => import('./portal/portal.module').then((m) => m.PortalModule),
  },
  { path: "unauthorized", component: UnauthorizedComponent },
  { path: "forgot-password", redirectTo: "/accounts/forgot-password" },
  { path: "reset-password", redirectTo: "/accounts/reset-password" },
  { path: "verify-email", redirectTo: "/accounts/verify-email", pathMatch: "prefix" },
  {
    path: "acadamic-programme",
    loadChildren: () =>
      import("./acadamic-programme/acadamic-programme.module").then(
        m => m.AcadamicProgrammeModule
      )
  },
  {
    path: "curricula",
    loadChildren: () =>
      import("./curricula/curricula.module").then(m => m.CurriculaModule)
  },
  {
    path: "graduation",
    loadChildren: () =>
      import("./graduation-requirement/graduation-requirement.module").then(
        m => m.GraduationRequirementModule
      )
  },
  {
    path: "course",
    loadChildren: () =>
      import("./courses/course.module").then(m => m.CourseModule)
  },
  {
    path: "dashboard",
    loadChildren: () =>
      import("./dashboard/dashboard.module").then(m => m.DashboardModule)
  },
  {
    path: "students",
    loadChildren: () =>
      import("./students/students.module").then(m => m.StudentsModule)
  },
  {
    path: "Semester",
    loadChildren: () =>
      import("./SemesterRegistration/semesters.module").then(
        m => m.SemestersModule
      )
  },
  {
    path: "banks",
    loadChildren: () => import("./banks/banks.module").then(m => m.BanksModule)
  },
  {
    path: "colleges",
    loadChildren: () =>
      import("./colleges/colleges.module").then(m => m.CollegesModule)
  },
  {
    path: "applicants",
    loadChildren: () =>
      import("./applicants/applicants.module").then(m => m.ApplicantsModule)
  },
  {
    path: "staffs",
    loadChildren: () =>
      import("./staffs/staffs.module").then(m => m.StaffsModule)
  },
  {
    path: "reports",
    loadChildren: () =>
      import("./reports/reports.module").then(m => m.ReportsModule)
  },
  {
    path: "student-application",
    loadChildren: () =>
      import("./admission-request/admission-request.module").then(
        m => m.AdmissionRequestModule
      )
  },
  {
    path: "user-management",
    loadChildren: () =>
      import("./user-management/user-management.module").then(
        m => m.UserManagementModule
      )
  },
  {
    path: "student-section",
    loadChildren: () =>
      import("./student-section-assignments/student-section-assignments.module").then(
        m => m.StudentSectionAssignmentsModule
      )
  },
  { path: "", pathMatch: "full", redirectTo: "/portal" },
  { path: "home", redirectTo: "/portal" },
  { path: "**", redirectTo: "/portal" }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
