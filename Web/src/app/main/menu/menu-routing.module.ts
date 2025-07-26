import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { UnauthorizedComponent } from 'src/app/unauthorized/unauthorized.component';

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: '/dashboard' },
  { path: 'unauthorized', component: UnauthorizedComponent },
  {
    path: 'acadamic-programme',
    loadChildren: () =>
      import('../../acadamic-programme/acadamic-programme.module').then(
        (m) => m.AcadamicProgrammeModule
      ),
  },
  {
    path: 'accounts',
    loadChildren: () =>
      import('../../accounts/accounts.module').then((m) => m.AccountsModule),
  },
  {
    path: 'curricula',
    loadChildren: () =>
      import('../../curricula/curricula.module').then((m) => m.CurriculaModule),
  },
  {
    path: 'graduation',
    loadChildren: () =>
      import('../../graduation-requirement/graduation-requirement.module').then(
        (m) => m.GraduationRequirementModule
      ),
  },
  {
    path: 'course',
    loadChildren: () =>
      import('../../courses/course.module').then((m) => m.CourseModule),
  },
  {
    path: 'dashboard',
    loadChildren: () =>
      import('../../dashboard/dashboard.module').then((m) => m.DashboardModule),
  },
  {
    path: 'students',
    loadChildren: () =>
      import('../../students/students.module').then((m) => m.StudentsModule),
  },

  {
    path: 'Semester',
    loadChildren: () =>
      import('../../SemesterRegistration/semesters.module').then(
        (m) => m.SemestersModule
      ),
  },

  {
    path: 'banks',
    loadChildren: () =>
      import('../../banks/banks.module').then((m) => m.BanksModule),
  },
  {
    path: 'colleges',
    loadChildren: () =>
      import('../../colleges/colleges.module').then((m) => m.CollegesModule),
  },
  {
    path: 'applicants',
    loadChildren: () =>
      import('../../applicants/applicants.module').then(
        (m) => m.ApplicantsModule
      ),
  },
  {
    path: 'staffs',
    loadChildren: () =>
      import('../../staffs/staffs.module').then((m) => m.StaffsModule),
  },
  {
    path: 'reports',
    loadChildren: () =>
      import('../../reports/reports.module').then((m) => m.ReportsModule),
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MenuRoutingModule {}
