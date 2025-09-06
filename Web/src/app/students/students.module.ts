import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { StudentsRoutingModule } from "./students-routing.module";
import { StudentsComponent } from "./students.component";
import { AddStudentComponent } from "./add-student/add-student.component";
import { StudentGradeComponent } from "./student-grade/student-grade.component";
import { SharedModule } from "../shared-module/shared/shared.module";
import { StudentRegistrationComponent } from "./student-registration/student-registration.component";
import { StudentAcademicStatusHistoryComponent } from "./student-academic-status-history/student-academic-status-history.component";
import { StudentFeedbackComponent } from "./student-feedback/student-feedback.component";
import { StudentEntryTruckingComponent } from "./student-entry-trucking/student-entry-trucking.component";
import { StudentClearanceComponent } from "./student-clearance/student-clearance.component";
import { GradingSystemComponent } from "./grading-system/grading-system.component";
import { CourseAttendanceComponent } from "./course-attendance/course-attendance.component";
import { AddStudentRegistrationComponent } from "./add-student-registration/add-student-registration.component";
import { AddStudentGradeComponent } from "./add-student-grade/add-student-grade.component";
import { AddStudentFeedbackComponent } from "./add-student-feedback/add-student-feedback.component";
import { AddStudentEntryTruckingComponent } from "./add-student-entry-trucking/add-student-entry-trucking.component";
import { AddStudentClearanceComponent } from "./add-student-clearance/add-student-clearance.component";
import { AddStudentAcademicStatusHistoryComponent } from "./add-student-academic-status-history/add-student-academic-status-history.component";
import { AddGradingSystemComponent } from "./add-grading-system/add-grading-system.component";
import { AddCourseAttendanceComponent } from "./add-course-attendance/add-course-attendance.component";
import { AssignBatchComponent } from "./assign-batch/assign-batch.component";
import { CourseOfferingComponent } from "./course-offering/course-offering.component";
import { RouterModule, Routes } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { StudentGradeReportComponent } from "./student-grade-report/student-grade-report.component";
import { NgxPrintModule } from "ngx-print";
import { CourseRegistrationApprovalComponent } from "./course-registration-approval/course-registration-approval.component";
import { StudentCourseRegistrationComponent } from "./course-registration/student-course-registration/student-course-registration.component";
import { ManageStudentCourseRegistrationComponent } from './course-registration/manage-student-course-registration/manage-student-course-registration.component';
import { ManageWorkFlowComponent } from './common/manage-work-flow/manage-work-flow.component';
import { WorkFlowFormComponent } from './common/work-flow-form/work-flow-form.component';
import { DecisionDropdownComponent } from './course-registration-approval/decision-dropdown/decision-dropdown.component';
import { ImportStudentGradeComponent } from './import-student-grade/import-student-grade.component';
import { StudentProfileSummaryComponent } from './profile/student-profile-summary/student-profile-summary.component';
import { RegistrarStudentProfileSummaryComponent } from './profile/registrar-student-profile-summary/registrar-student-profile-summary.component';
import { ProfileSummaryComponent } from './profile/profile-summary/profile-summary.component';
import { RegisteredSemesterCoursesComponent } from './course-registration/registered-semester-courses/registered-semester-courses.component';
import { CourseEnrollmentDetailsComponent } from './course-registration/course-enrollment-details/course-enrollment-details.component';
import { AddDropCourseListComponent } from './course-registration/course-add/add-drop-course-list/add-drop-course-list.component';
import { TransfredCoursesComponent } from './course-registration/transfred-courses/transfred-courses.component';
import { WithdrawalComponent } from './course-registration/withdrawal/withdrawal.component';
import { ReactiveFormsModule } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzMessageModule } from 'ng-zorro-antd/message';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { AddCourseApprovalComponent } from './course-registration/course-add/add-course-approval/add-course-approval.component';
import { AddCourseRequestComponent } from "./course-registration/course-add/add-course-request/add-course-request.component";
import { RegisteredNewStudentListComponent } from './registered-new-student-list/registered-new-student-list.component';
import { ManageGradeChangeRequestComponent } from './grade-change-request/manage-grade-change-request/manage-grade-change-request.component';
import { GradeChangeRequestFormComponent } from './grade-change-request/grade-change-request-form/grade-change-request-form.component';
import { GradeChangeRequestListForApprovalComponent } from './grade-change-request/grade-change-request-list-for-approval/grade-change-request-list-for-approval.component';
import { ApprovalDecisionModalComponent } from './grade-change-request/approval-decision-modal/approval-decision-modal.component';
import { StudentConfirmationModalComponent } from './components/student-confirmation-modal/student-confirmation-modal.component';
import { SpecialCaseManualRegistrationComponent } from './special-case-manual-registration/special-case-manual-registration.component';
import { ConfirmationModalComponent } from './special-case-manual-registration/confirmation-modal/confirmation-modal.component';

const routes: Routes = [
  { path: "", component: StudentsComponent },
  { path: "students/:id", component: StudentsComponent }
];

@NgModule({
  declarations: [
    StudentsComponent,
    AddStudentComponent,
    StudentGradeComponent,
    StudentRegistrationComponent,
    StudentAcademicStatusHistoryComponent,
    StudentFeedbackComponent,
    StudentEntryTruckingComponent,
    StudentClearanceComponent,
    GradingSystemComponent,
    CourseAttendanceComponent,
    AddStudentRegistrationComponent,
    AddStudentGradeComponent,
    AddStudentFeedbackComponent,
    AddStudentEntryTruckingComponent,
    AddStudentClearanceComponent,
    AddStudentAcademicStatusHistoryComponent,
    AddGradingSystemComponent,
    AddCourseAttendanceComponent,
    AssignBatchComponent,
    CourseOfferingComponent,
    StudentGradeReportComponent,
    StudentCourseRegistrationComponent,
    CourseRegistrationApprovalComponent,
    ManageStudentCourseRegistrationComponent,
    ManageWorkFlowComponent,
    WorkFlowFormComponent,
    DecisionDropdownComponent,
    ImportStudentGradeComponent,
    StudentProfileSummaryComponent,
    RegistrarStudentProfileSummaryComponent,
    ProfileSummaryComponent,
    RegisteredSemesterCoursesComponent,
    CourseEnrollmentDetailsComponent,
    AddDropCourseListComponent,
    TransfredCoursesComponent,
    WithdrawalComponent,
    AddCourseApprovalComponent,
    AddCourseRequestComponent,
    RegisteredNewStudentListComponent,
    ManageGradeChangeRequestComponent,
    GradeChangeRequestFormComponent,
    GradeChangeRequestListForApprovalComponent,
    ApprovalDecisionModalComponent,
    StudentConfirmationModalComponent,
    SpecialCaseManualRegistrationComponent,
    ConfirmationModalComponent,
  ],
  imports: [
    CommonModule,
    StudentsRoutingModule,
    SharedModule,
    FormsModule,
    NgxPrintModule,
    ReactiveFormsModule,
    NzFormModule,
    NzSelectModule,
    NzTableModule,
    NzMessageModule,
    NzTagModule,
    NzEmptyModule,
    NzSpinModule,
    NzToolTipModule,
    NzModalModule,
    NzAlertModule,
    NzButtonModule,
    NzIconModule,
    NzRadioModule,
    NzCheckboxModule,
    NzCardModule,
    NzTabsModule,
    NzEmptyModule
  ],
  exports: [StudentProfileSummaryComponent, RegistrarStudentProfileSummaryComponent, ProfileSummaryComponent, AddCourseApprovalComponent]
})
export class StudentsModule { }
