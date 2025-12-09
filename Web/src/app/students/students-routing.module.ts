import { CourseRegistrationApprovalComponent } from "./course-registration-approval/course-registration-approval.component";
import { StudentCourseRegistrationComponent } from "./course-registration/student-course-registration/student-course-registration.component";
import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { AuthGuard } from '../guards/auth.guard';
import { AddCourseAttendanceComponent } from "./add-course-attendance/add-course-attendance.component";
import { AddGradingSystemComponent } from "./add-grading-system/add-grading-system.component";
import { AddStudentAcademicStatusHistoryComponent } from "./add-student-academic-status-history/add-student-academic-status-history.component";
import { AddStudentClearanceComponent } from "./add-student-clearance/add-student-clearance.component";
import { AddStudentEntryTruckingComponent } from "./add-student-entry-trucking/add-student-entry-trucking.component";
import { AddStudentFeedbackComponent } from "./add-student-feedback/add-student-feedback.component";
import { AddStudentGradeComponent } from "./add-student-grade/add-student-grade.component";
import { AddStudentRegistrationComponent } from "./add-student-registration/add-student-registration.component";
import { AddStudentComponent } from "./add-student/add-student.component";
import { AssignBatchComponent } from "./assign-batch/assign-batch.component";
import { CourseAttendanceComponent } from "./course-attendance/course-attendance.component";
import { CourseOfferingComponent } from "./course-offering/course-offering.component";
import { GradingSystemComponent } from "./grading-system/grading-system.component";
import { StudentAcademicStatusHistoryComponent } from "./student-academic-status-history/student-academic-status-history.component";
import { StudentClearanceComponent } from "./student-clearance/student-clearance.component";
import { StudentEntryTruckingComponent } from "./student-entry-trucking/student-entry-trucking.component";
import { StudentFeedbackComponent } from "./student-feedback/student-feedback.component";
import { StudentGradeReportComponent } from "./student-grade-report/student-grade-report.component";
import { StudentGradeComponent } from "./student-grade/student-grade.component";
import { StudentRegistrationComponent } from "./student-registration/student-registration.component";
import { StudentsComponent } from "./students.component";
import { ManageStudentCourseRegistrationComponent } from "./course-registration/manage-student-course-registration/manage-student-course-registration.component";
import { ImportStudentGradeComponent } from "./import-student-grade/import-student-grade.component";
import { RegisteredSemesterCoursesComponent } from "./course-registration/registered-semester-courses/registered-semester-courses.component";
import { CourseEnrollmentDetailsComponent } from "./course-registration/course-enrollment-details/course-enrollment-details.component";
import { StudentProfileSummaryComponent } from "./profile/student-profile-summary/student-profile-summary.component";
import { AddCourseApprovalComponent } from "./course-registration/course-add/add-course-approval/add-course-approval.component";
import { AddCourseRequestComponent } from "./course-registration/course-add/add-course-request/add-course-request.component";
import { RegisteredNewStudentListComponent } from "./registered-new-student-list/registered-new-student-list.component";
import { ManageGradeChangeRequestComponent } from "./grade-change-request/manage-grade-change-request/manage-grade-change-request.component";
import { GradeChangeRequestListForApprovalComponent } from "./grade-change-request/grade-change-request-list-for-approval/grade-change-request-list-for-approval.component";
import { GradeChangeRequestFormComponent } from "./grade-change-request/grade-change-request-form/grade-change-request-form.component";
import { SpecialCaseManualRegistrationComponent } from "./special-case-manual-registration/special-case-manual-registration.component";

const routes: Routes = [
  { path: "", component: StudentsComponent, canActivate: [AuthGuard] },
  { path: "assign-batch", component: AssignBatchComponent, canActivate: [AuthGuard] },
  { path: "student-registration", component: StudentRegistrationComponent, canActivate: [AuthGuard] },
  { path: "entry-trucking", component: StudentEntryTruckingComponent, canActivate: [AuthGuard] },
  {
    path: "student-status-history",
    component: StudentAcademicStatusHistoryComponent,
    canActivate: [AuthGuard]
  },
  { path: "StudentGrades", component: StudentGradeComponent, canActivate: [AuthGuard] },
  { path: "grading-system", component: GradingSystemComponent, canActivate: [AuthGuard] },
  { path: "student-attendance", component: CourseAttendanceComponent, canActivate: [AuthGuard] },
  { path: "student-clearance", component: StudentClearanceComponent, canActivate: [AuthGuard] },
  { path: "student-feedback", component: StudentFeedbackComponent, canActivate: [AuthGuard] },
  { path: "add-student/:id", component: AddStudentComponent, canActivate: [AuthGuard] },
  {
    path: "add-student-registration/:id",
    component: AddStudentRegistrationComponent,
    canActivate: [AuthGuard]
  },
  {
    path: "add-entry-trucking/:id",
    component: AddStudentEntryTruckingComponent,
    canActivate: [AuthGuard]
  },
  {
    path: "add-student-status-history/:id",
    component: AddStudentAcademicStatusHistoryComponent,
    canActivate: [AuthGuard]
  },
  { path: "add-student-grade/:id", component: AddStudentGradeComponent, canActivate: [AuthGuard] },
  { path: "add-grading-system/:id", component: AddGradingSystemComponent, canActivate: [AuthGuard] },
  {
    path: "add-student-attendance/:id",
    component: AddCourseAttendanceComponent,
    canActivate: [AuthGuard]
  },
  {
    path: "add-student-clearance/:id",
    component: AddStudentClearanceComponent,
    canActivate: [AuthGuard]
  },
  { path: "student-course", component: CourseOfferingComponent, canActivate: [AuthGuard] },
  { path: "add-student-feedback/:id", component: AddStudentFeedbackComponent, canActivate: [AuthGuard] },
  { path: "student-grade-report", component: StudentGradeReportComponent, canActivate: [AuthGuard] },
  {
    path: "student-course-registration",
    component: StudentCourseRegistrationComponent,
    canActivate: [AuthGuard]
  },
  {
    path: "course-registration-approval",
    component: CourseRegistrationApprovalComponent,
    canActivate: [AuthGuard]
  },
  {
    path: "manage-student-course-registration",
    component: ManageStudentCourseRegistrationComponent,
    canActivate: [AuthGuard]
  },
  {
    path: "register-semester-course",
    component: CourseEnrollmentDetailsComponent,
    canActivate: [AuthGuard]
  },
  {
    path: "import-student-grade",
    component: ImportStudentGradeComponent,
    canActivate: [AuthGuard]
  },
  {
    path: "student-profile-summary",
    component: StudentProfileSummaryComponent,
    canActivate: [AuthGuard]
  },
  {
    path: "course-add-approval",
    component: AddCourseApprovalComponent,
    canActivate: [AuthGuard]
  },
  {
    path: "course-add-request",
    component: AddCourseRequestComponent,
    canActivate: [AuthGuard]
  },
  {
    path: "new-registered-list",
    component: RegisteredNewStudentListComponent,
    canActivate: [AuthGuard]
  },
  {
    path: "grade-change-request",
    component: ManageGradeChangeRequestComponent,
    canActivate: [AuthGuard]
  },
   {
    path: "grade-change-request-form",
    component: GradeChangeRequestFormComponent,
    canActivate: [AuthGuard]
  },
  {
    path: "grade-change-request-for-approval",
    component: GradeChangeRequestListForApprovalComponent,
    canActivate: [AuthGuard]
  },
  {
    path: "profile/:id",
    component: StudentProfileSummaryComponent,
    canActivate: [AuthGuard]
  },
  {
    path: "edit/:id",
    component: AddStudentComponent,
    canActivate: [AuthGuard]
  },
  {
    path: "special-case-manual-registration",
    component: SpecialCaseManualRegistrationComponent,
    canActivate: [AuthGuard]
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class StudentsRoutingModule { }
