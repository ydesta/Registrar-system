import { Component, OnInit } from "@angular/core";
import { NzModalRef, NzModalService } from "ng-zorro-antd/modal";
import { CustomNotificationService } from "src/app/services/custom-notification.service";
import { StudentProgramRequesterFormComponent } from "../student-program-requester-form/student-program-requester-form.component";
import { ApplicantReviewerDecisionComponent } from "../../reviewer/applicant-reviewer-decision/applicant-reviewer-decision.component";
import {
  ACADEMIC_STUDENT_STATUS_DESCRIPTIONS,
  Division_Status,
  REQUEST_STATUS_DESCRIPTIONS
} from "src/app/common/constant";
import { AcademicProgramRequestService } from "../../services/academic-program-request.service";
import { ActivatedRoute } from "@angular/router";
import { GeneralInformationService } from "../../services/general-information.service";
import { AcadamicProgramme } from "../../model/acadamic-programme.model";
import { AcademicProgramRequest } from "../../model/academic-program-request.model";
import { StaticData } from "../../model/StaticData";
import { SharingDataService } from "../../services/sharing-data.service";
import { Subscription } from "rxjs";

@Component({
  selector: "app-manage-student-program-requester",
  templateUrl: "./manage-student-program-requester.component.html",
  styleUrls: ["./manage-student-program-requester.component.scss"]
})
export class ManageStudentProgramRequesterComponent implements OnInit {
  /**
 *
 */
  applicationProgramRequestList: AcademicProgramRequest[] = [];
  steps = 0;
  applicationProgramRequestIndex = -1;
  applicationProgramRequestModalVisible = false;
  applicantId: string;
  userId: string;
  acadamicProgrammes: AcadamicProgramme[] = [];
  divisionStatusist: StaticData[] = [];
  noOfApplicantProgramRequest = 0;
  isSubmittedApplicationForm = 0;
  countSubmitionCourse = 0;
  isApplicantProfile: boolean = false;
    private subscription!: Subscription;
  constructor(
    private modalRef: NzModalRef,
    private _modal: NzModalService,
    private _customNotificationService: CustomNotificationService,
    private _academicProgramRequestService: AcademicProgramRequestService,
    private route: ActivatedRoute,
    private generalInformationService: GeneralInformationService,
    private sharedDataService: SharingDataService
  ) {
    this.userId = localStorage.getItem("userId");
    route.queryParams.subscribe(p => {
      this.applicantId = p["id"];
      if (this.applicantId != undefined) {
        this.getApplicantacadamicPrgramtId(this.applicantId);
      }
    });
  }
  ngOnInit(): void {
    this.getAcademicProgramList();
    this.subscription = this.sharedDataService.currentApplicantProfile.subscribe(
      status => {
        this.isApplicantProfile = status;        
      }
    );
    this.getListOfDivisionStatus();
    if (this.applicantId == undefined) {
      const userId = localStorage.getItem('userId');
      this.generalInformationService.getOrStoreParentApplicantId(userId).subscribe(applicantId => {
        this.applicantId = applicantId;
        this.getApplicantacadamicPrgramtId(applicantId);
      });
    }
  }
  getApplicantacadamicPrgramtId(id: string) {
    this._academicProgramRequestService
      .getApplicantacadamicPrgramtId(id)
      .subscribe(res => {
        this.applicationProgramRequestList = res.data;
        this.countSubmitionCourse = this.applicationProgramRequestList.length;
        const requestList = this.applicationProgramRequestList.filter(
          item =>
            item.studentStatus == 0 ||
            item.studentStatus == 1 ||
            item.studentStatus == 2 ||
            item.approvalStatus == 3
        );

        const submiitedList = this.applicationProgramRequestList.filter(
          item =>
            (item.studentStatus == 3 ||
              item.studentStatus == 1 ||
              item.studentStatus == 2) &&
            (item.approvalStatus == 3 ||
              item.approvalStatus == 1 ||
              item.approvalStatus == 2)
        );
        this.noOfApplicantProgramRequest = requestList.length;
        this.isSubmittedApplicationForm = submiitedList.length;
        this.sharedDataService.programUpdateMessage(
          this.isSubmittedApplicationForm
        );
        this.sharedDataService.numberOfRequestUpdateMessage(
          this.countSubmitionCourse
        );
      });
  }
  programHandleCancel() {
    this.applicationProgramRequestModalVisible = false;
    this.applicationProgramRequestIndex = -1;
  }

  showAddProgramModal() {
    this.applicationProgramRequestModalVisible = true;
  }
  delete(id: number) {
    this._modal.confirm({
      nzTitle: "Are you sure delete this program Record?",
      nzOkText: "Yes",
      nzOkType: "primary",
      nzOkDanger: true,
      nzOnOk: () => {
        try {
          this._academicProgramRequestService.delete(id).subscribe(res => {
            if (res) {
              this._customNotificationService.notification(
                "success",
                "Success",
                "Education Record is deleted succesfully."
              );
              this.getApplicantacadamicPrgramtId(this.applicantId);
            }
          });
        } catch (error) {
          this._customNotificationService.notification(
            "error",
            "Error",
            "Try again."
          );
        }
      },
      nzCancelText: "No",
      nzOnCancel: () => {}
    });
  }
  editProgram(index: number) {
    this.applicationProgramRequestIndex = index;
    //this.patchEducationValue(this.educationLists[this.educationIndex]);
    this.applicationProgramRequestModalVisible = true;
  }
  openModal(): void {
    const modal: NzModalRef = this._modal.create({
      nzTitle: "Student Program Request",
      nzContent: StudentProgramRequesterFormComponent,
      nzComponentParams: {
        applicantId: this.applicantId
      },
      nzMaskClosable: false,
      nzFooter: null
    });
    modal.afterClose.subscribe(() => {
      this.getApplicantacadamicPrgramtId(this.applicantId);
    });
  }
  editModal(request: AcademicProgramRequest): void {
    const modal: NzModalRef = this._modal.create({
      nzTitle: "Education Background",
      nzContent: StudentProgramRequesterFormComponent,
      nzComponentParams: {
        studentProgramRequester: request
      },
      nzMaskClosable: false,
      nzFooter: null
    });
    modal.afterClose.subscribe(() => {
      this.getApplicantacadamicPrgramtId(this.applicantId);
    });
  }
  openDecisionModal(request: AcademicProgramRequest): void {
    const modal: NzModalRef = this._modal.create({
      nzTitle: "Review Decision",
      nzContent: ApplicantReviewerDecisionComponent,
      nzComponentParams: {
        academicProgramRequest: request,
        applicantId: request.applicantId,
        academicProgramId: request.acadamicProgrammeId
      },
      nzWidth: 600,
      nzMaskClosable: false,
      nzFooter: null
    });
    
    modal.afterClose.subscribe((result) => {
      if (result) {
        // Refresh the data after decision is submitted
        this.getApplicantacadamicPrgramtId(this.applicantId);
        this._customNotificationService.notification(
          "success",
          "Success",
          "Decision submitted successfully."
        );
      }
    });
  }
  closeModal(): void {
    this.modalRef.close();
  }
  getReguestStatus(status: any) {
    return REQUEST_STATUS_DESCRIPTIONS[status];
  }
  getStudentStatus(status: any) {
    return ACADEMIC_STUDENT_STATUS_DESCRIPTIONS[status];
  }
  setTaxStatusColor(status) {
    switch (status) {
      case 0:
        return "red";
      case 1:
        return "red";
      case 2:
        return "blue";
      case 3:
        return "green";
      default:
        return "black";
    }
  }
  getAcademicProgramList() {
    this._academicProgramRequestService
      .getAacadamicPrgramtList()
      .subscribe(res => {
        this.acadamicProgrammes = res.data;
      });
  }
  getAcademicProgramDescription(Id: any) {
    const program = this.acadamicProgrammes.find(item => item.id == Id);
    return program ? program.acadamicProgrammeTitle : "";
  }
  getListOfDivisionStatus() {
    let division: StaticData = new StaticData();
    Division_Status.forEach(pair => {
      division = {
        Id: pair.Id.toString(),
        Description: pair.Description
      };
      this.divisionStatusist.push(division);
    });
  }
  getDivisionStatusDescription(Id: any) {
    const program = this.divisionStatusist.find(item => item.Id == Id);
    return program ? program.Description : "";
  }
  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
