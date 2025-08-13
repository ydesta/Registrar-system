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
  isUserReviewer: boolean = false;
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
  }

  ngOnInit(): void {
    this.initializeData();
    this.checkUserRole();
    this.getAcademicProgramList();
    this.getListOfDivisionStatus();
    
    this.subscription = this.sharedDataService.currentApplicantProfile.subscribe(
      status => {
        this.isApplicantProfile = status;        
      }
    );
    this.monitorAuthenticationState();
  }


  private checkUserRole(): void {
    const role = localStorage.getItem('role');
    const userType = localStorage.getItem('userType');
    
    if (role) {
      try {
        const roles = JSON.parse(role);
        if (Array.isArray(roles)) {
          this.isUserReviewer = roles.includes('Reviewer');
        } else {
          this.isUserReviewer = role === 'Reviewer';
        }
      } catch {
        this.isUserReviewer = role === 'Reviewer';
      }
    } else {
      this.isUserReviewer = userType === 'Reviewer';
    }
  }

  private monitorAuthenticationState(): void {
    setInterval(() => {
      const currentUserId = localStorage.getItem('userId');
      if (currentUserId && currentUserId !== this.userId) {
        this.userId = currentUserId;
        this.forceRefreshData();
      }
    }, 1000);
    window.addEventListener('storage', (event) => {
      if (event.key === 'userId' && event.newValue) {
        this.userId = event.newValue;
        this.forceRefreshData();
      }
    });
    window.addEventListener('focus', () => {
      const currentUserId = localStorage.getItem('userId');
      if (currentUserId && currentUserId !== this.userId) {
        this.userId = currentUserId;
        this.forceRefreshData();
      }
    });

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        const currentUserId = localStorage.getItem('userId');
        if (currentUserId && currentUserId !== this.userId) {
          this.userId = currentUserId;
          this.forceRefreshData();
        }
      }
    });
  }

  private initializeData(): void {
    this.route.queryParams.subscribe(params => {
      const routeApplicantId = params["id"];
      if (routeApplicantId && routeApplicantId !== this.applicantId) {
        this.applicantId = routeApplicantId;
        this.getApplicantacadamicPrgramtId(this.applicantId);
      } else if (!this.applicantId) {
        this.loadApplicantIdFromService();
      }
    });
  }

  private loadApplicantIdFromService(): void {
    this.generalInformationService.getOrStoreParentApplicantId(this.userId).subscribe({
      next: (applicantId) => {
        if (applicantId && applicantId !== this.applicantId) {
          this.applicantId = applicantId;
          this.getApplicantacadamicPrgramtId(applicantId);
        }
      },
      error: (error) => {
        setTimeout(() => this.loadApplicantIdFromService(), 3000);
      }
    });
  }

  getApplicantacadamicPrgramtId(id: string) {
    if (!id) {
      return;
    }
    
    this._academicProgramRequestService
      .getApplicantacadamicPrgramtId(id)
      .subscribe({
        next: (res) => {
          if (res && res.data) {
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
          } else {
            this.applicationProgramRequestList = [];
            this.countSubmitionCourse = 0;
            this.noOfApplicantProgramRequest = 0;
            this.isSubmittedApplicationForm = 0;
            this.sharedDataService.programUpdateMessage(0);
            this.sharedDataService.numberOfRequestUpdateMessage(0);
          }
        },
        error: (error) => {
          console.error('Error loading academic program requests:', error);
          this._customNotificationService.notification(
            "error",
            "Error",
            "Failed to load academic program data. Please refresh the page."
          );
          this.applicationProgramRequestList = [];
          this.countSubmitionCourse = 0;
          this.noOfApplicantProgramRequest = 0;
          this.isSubmittedApplicationForm = 0;
          this.sharedDataService.programUpdateMessage(0);
          this.sharedDataService.numberOfRequestUpdateMessage(0);
        }
      });
  }

  refreshData(): void {
    if (this.applicantId) {
      this.getApplicantacadamicPrgramtId(this.applicantId);
    } else {
      this.loadApplicantIdFromService();
    }
  }

  forceRefreshData(): void {
    this.applicationProgramRequestList = [];
    this.countSubmitionCourse = 0;
    this.noOfApplicantProgramRequest = 0;
    this.isSubmittedApplicationForm = 0;
    this.sharedDataService.programUpdateMessage(0);
    this.sharedDataService.numberOfRequestUpdateMessage(0);
    this.loadApplicantIdFromService();
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
          this._academicProgramRequestService.delete(id).subscribe({
            next: (res) => {
              if (res) {
                this._customNotificationService.notification(
                  "success",
                  "Success",
                  "Academic Program Record is deleted successfully."
                );
                this.refreshData();
              }
            },
            error: (error) => {
              this._customNotificationService.notification(
                "error",
                "Error",
                "Failed to delete academic program record. Please try again."
              );
            }
          });
        } catch (error) {
          this._customNotificationService.notification(
            "error",
            "Error",
            "An unexpected error occurred. Please try again."
          );
        }
      },
      nzCancelText: "No",
      nzOnCancel: () => {}
    });
  }

  editProgram(index: number) {
    this.applicationProgramRequestIndex = index;
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
      nzFooter: null,
      nzWidth: "60%"
    });
    
    modal.afterClose.subscribe(() => {
      this.refreshData();
    });
    
    const componentInstance = modal.getContentComponent();
    if (componentInstance) {
      componentInstance.dataUpdated.subscribe(() => {
        this.refreshData();
      });
    }
  }

  editModal(request: AcademicProgramRequest): void {
    const modal: NzModalRef = this._modal.create({
      nzTitle: "Edit Academic Program Request",
      nzContent: StudentProgramRequesterFormComponent,
      nzComponentParams: {
        studentProgramRequester: request
      },
      nzMaskClosable: false,
      nzFooter: null
    });
    
    modal.afterClose.subscribe(() => {
      this.refreshData();
    });
    
    const componentInstance = modal.getContentComponent();
    if (componentInstance) {
      componentInstance.dataUpdated.subscribe(() => {
        this.refreshData();
      });
    }
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
        this.refreshData();
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
      .subscribe({
        next: (res) => {
          if (res && res.data) {
            this.acadamicProgrammes = res.data;
          } else {
            this.acadamicProgrammes = [];
          }
        },
        error: (error) => {
          console.error('Error loading academic programs:', error);
          this.acadamicProgrammes = [];
        }
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
