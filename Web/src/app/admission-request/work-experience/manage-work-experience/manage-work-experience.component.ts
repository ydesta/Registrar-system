import { Component, OnInit } from "@angular/core";
import { WorkExperienceFormComponent } from "../work-experience-form/work-experience-form.component";
import { NzModalRef, NzModalService } from "ng-zorro-antd/modal";
import { CustomNotificationService } from "src/app/services/custom-notification.service";
import { ActivatedRoute } from "@angular/router";
import { GeneralInformationService } from "../../services/general-information.service";
import { WorkExperienceService } from "../../services/work-experience.service";
import { ApplicantWorkExperienceRequest } from "../../model/applicant-work-experience-request.model";
import { ManageFilesComponent } from "../../file-management/manage-files/manage-files.component";
import { SharingDataService } from "../../services/sharing-data.service";
import { Subscription } from "rxjs";

@Component({
  selector: "app-manage-work-experience",
  templateUrl: "./manage-work-experience.component.html",
  styleUrls: ["./manage-work-experience.component.scss"]
})
export class ManageWorkExperienceComponent implements OnInit {
 
  exprienceModalVisible = false;
  workExperienceIndex = 0;
  workExperienceLists: ApplicantWorkExperienceRequest[] = [];
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
    private generalInformationService: GeneralInformationService,
    private workExperienceService: WorkExperienceService,
    private sharingDataService: SharingDataService
  ) {
    this.userId = localStorage.getItem("userId");
    route.queryParams.subscribe(p => {
      this.applicantId = p["id"];
      if (this.applicantId != undefined) {
        this.getApplicantExperienceByApplicantId(this.applicantId);
      }
    });
  }

  ngOnInit(): void {
    const userId = localStorage.getItem('userId');
    this.generalInformationService.getOrStoreParentApplicantId(userId).subscribe(applicantId => {
      this.applicantId = applicantId;
      this.getApplicantExperienceByApplicantId(applicantId);
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
  openModal(): void {
    const modal: NzModalRef = this._modal.create({
      nzTitle: "Work Experience",
      nzContent: WorkExperienceFormComponent,
      nzComponentParams: {
        applicationId: this.applicantId
      },
      nzMaskClosable: false,
      nzFooter: null
    });
    modal.afterClose.subscribe(() => {
      this.getApplicantExperienceByApplicantId(this.applicantId);
    });
  }
  closeModal(): void {
    this.modalRef.close();
  }
  getApplicantExperienceByApplicantId(applicantId: string) {
    this.workExperienceService
      .getApplicantExperienceByApplicantId(applicantId)
      .subscribe(res => {
        this.workExperienceLists = res.data;
      });
  }
  editExperience(index: number) {
    this.workExperienceIndex = index;
    //this.patchEducationValue(this.educationLists[this.educationIndex]);
    this.exprienceModalVisible = true;
  }
  delete(id: string) {
    this._modal.confirm({
      nzTitle: "Are you sure delete this Education Record?",
      nzOkText: "Yes",
      nzOkType: "primary",
      nzOkDanger: true,
      nzOnOk: () => {
        try {
          this.workExperienceService.delete(id).subscribe(res => {
            if (res) {
              this._customNotificationService.notification(
                "success",
                "Success",
                "Education Record is deleted succesfully."
              );
              this.getApplicantExperienceByApplicantId(this.applicantId);
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
      nzOnCancel: () => { }
    });
  }
  editModal(experience: ApplicantWorkExperienceRequest): void {
    // console.log("GGG    ", experience);
    const modal: NzModalRef = this._modal.create({
      nzTitle: "Edit Work Experience",
      nzContent: WorkExperienceFormComponent,
      nzComponentParams: {
        workExperience: experience
      },
      nzMaskClosable: false,
      nzFooter: null
    });
    modal.afterClose.subscribe(() => {
      this.getApplicantExperienceByApplicantId(this.applicantId);
    });
  }
  viewFile(data: any) {
    this._modal.create({
      nzTitle: "Work Experience",
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
