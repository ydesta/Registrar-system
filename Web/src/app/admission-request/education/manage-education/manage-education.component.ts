import { Component, OnInit } from "@angular/core";
import { NzModalRef, NzModalService } from "ng-zorro-antd/modal";
import { CustomNotificationService } from "src/app/services/custom-notification.service";
import { EducationFormComponent } from "../education-form/education-form.component";
import { ActivatedRoute } from "@angular/router";
import { EducationBackgroundService } from "../../services/education-background.service";
import { GeneralInformationService } from "../../services/general-information.service";
import { ApplicantEducationBackgroundRequest } from "../../model/applicant-education-background-request.model";
import { ManageFilesComponent } from "../../file-management/manage-files/manage-files.component";
import { SharingDataService } from "../../services/sharing-data.service";
import { Subscription } from "rxjs";

@Component({
  selector: "app-manage-education",
  templateUrl: "./manage-education.component.html",
  styleUrls: ["./manage-education.component.scss"]
})
export class ManageEducationComponent implements OnInit {
  /**
 *
 */
  educationLists: ApplicantEducationBackgroundRequest[] = [];
  steps = 0;
  educationIndex = -1;
  educationModalVisible = false;
  applicantId: string;
  userId: string;
  isSubmittedApplicationForm = 0;
  isApplicantProfile: boolean = false;
  private subscription!: Subscription;
  constructor(
    private modalRef: NzModalRef,
    private _modal: NzModalService,
    private _customNotificationService: CustomNotificationService,
    route: ActivatedRoute,
    private educationBackgroundService: EducationBackgroundService,
    private generalInformationService: GeneralInformationService,
    private sharingDataService: SharingDataService    
  ) {
     this.userId = localStorage.getItem('userId');
    route.queryParams.subscribe(p => {
      this.applicantId = p["id"];
      if (this.applicantId != undefined) {
        this.getApplicantEducationByApplicantId(this.applicantId);
      }
    });
  }
  ngOnInit(): void {
    const userId = localStorage.getItem('userId');
    this.generalInformationService.getOrStoreParentApplicantId(userId).subscribe(applicantId => {
      this.applicantId = applicantId;
      this.getApplicantEducationByApplicantId(applicantId);
    });
    this.sharingDataService.programCurrentMessage.subscribe(res => {
      this.isSubmittedApplicationForm = res;
    });
    this.subscription = this.sharingDataService.currentApplicantProfile.subscribe(
      status => {
        this.isApplicantProfile = status;        
      }
    );
  }
  educationHandleCancel() {
    this.educationModalVisible = false;
    this.educationIndex = -1;
  }

  showAddEducationModal() {
    this.educationModalVisible = true;
  }
  deleteEducation(id: string) {
    this._modal.confirm({
      nzTitle: "Are you sure delete this Education Record?",
      nzOkText: "Yes",
      nzOkType: "primary",
      nzOkDanger: true,
      nzOnOk: () => {
        try {
          this.educationBackgroundService.delete(id).subscribe(res => {
            if (res) {
              this._customNotificationService.notification(
                "success",
                "Success",
                "Education Record is deleted succesfully."
              );
              this.getApplicantEducationByApplicantId(this.applicantId);
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
  editEducation(index: number) {
    this.educationIndex = index;
    //this.patchEducationValue(this.educationLists[this.educationIndex]);
    this.educationModalVisible = true;
  }
  getApplicantEducationByApplicantId(id: string) {
    this.educationBackgroundService
      .getApplicantEducationByApplicantId(id)
      .subscribe(res => {
        this.educationLists = res.data;
        this.sharingDataService.otherUpdateMessage(this.educationLists.length);
      });
  }

  openModal(): void {
    const modal: NzModalRef = this._modal.create({
      nzTitle: "Education Background",
      nzContent: EducationFormComponent,
      nzComponentParams: {
        applicationId: this.applicantId
      },
      nzMaskClosable: false,
      nzFooter: null
    });
    modal.afterClose.subscribe(() => {
      this.getApplicantEducationByApplicantId(this.applicantId);
    });
  }

  editModal(education: ApplicantEducationBackgroundRequest): void {
    const modal: NzModalRef = this._modal.create({
      nzTitle: "Education Background",
      nzContent: EducationFormComponent,
      nzComponentParams: {
        educationBackground: education
      },
      nzMaskClosable: false,
      nzFooter: null
    });
    modal.afterClose.subscribe(() => {
      this.getApplicantEducationByApplicantId(this.applicantId);
    });
  }

  closeModal(): void {
    this.modalRef.close();
  }
  viewFile(data: any) {
    this._modal.create({
      nzTitle: "Education Background",
      nzContent: ManageFilesComponent,
      nzComponentParams: {
        areaId: data.id
      },
      nzMaskClosable: false,
      nzFooter: null,
      nzWidth: "50%"
    });
  }
  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
