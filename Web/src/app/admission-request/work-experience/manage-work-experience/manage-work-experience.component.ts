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
    private route: ActivatedRoute,
    private generalInformationService: GeneralInformationService,
    private workExperienceService: WorkExperienceService,
    private sharingDataService: SharingDataService
  ) {
    this.userId = localStorage.getItem("userId");
  }

  ngOnInit(): void {
    this.initializeData();
    
    this.sharingDataService.programCurrentMessage.subscribe(res => {
      this.isSubmittedApplicationForm = res;
    });
    
    this.subscription = this.sharingDataService.currentApplicantProfile.subscribe(
      status => {
        this.isApplicantProfile = status;        
      }
    );

    this.monitorAuthenticationState();
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
        console.log('Storage event detected, user authentication changed...');
        this.userId = event.newValue;
        this.forceRefreshData();
      }
    });

    window.addEventListener('focus', () => {
      const currentUserId = localStorage.getItem('userId');
      if (currentUserId && currentUserId !== this.userId) {
        console.log('Tab focus detected, checking authentication state...');
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
        this.getApplicantExperienceByApplicantId(this.applicantId);
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
          this.getApplicantExperienceByApplicantId(applicantId);
        }
      },
      error: (error) => {
        setTimeout(() => this.loadApplicantIdFromService(), 3000);
      }
    });
  }

  openModal(): void {
    const modal: NzModalRef = this._modal.create({
      nzTitle: "Work Experience",
      nzContent: WorkExperienceFormComponent,
      nzComponentParams: {
        applicationId: this.applicantId
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

  closeModal(): void {
    this.modalRef.close();
  }

  getApplicantExperienceByApplicantId(applicantId: string) {
    if (!applicantId) {
      return;
    }
    
    this.workExperienceService
      .getApplicantExperienceByApplicantId(applicantId)
      .subscribe({
        next: (res) => {
          if (res && res.data) {
            this.workExperienceLists = res.data;
          } else {
            this.workExperienceLists = [];
          }
        },
        error: (error) => {
          console.error('Error loading work experience records:', error);
          this._customNotificationService.notification(
            "error",
            "Error",
            "Failed to load work experience data. Please refresh the page."
          );
          this.workExperienceLists = [];
        }
      });
  }

  refreshData(): void {
    if (this.applicantId) {
      this.getApplicantExperienceByApplicantId(this.applicantId);
    } else {
      this.loadApplicantIdFromService();
    }
  }

  forceRefreshData(): void {
    this.workExperienceLists = [];
    this.loadApplicantIdFromService();
  }

  editExperience(index: number) {
    this.workExperienceIndex = index;
    this.exprienceModalVisible = true;
  }

  delete(id: string) {
    this._modal.confirm({
      nzTitle: "Are you sure delete this Work Experience Record?",
      nzOkText: "Yes",
      nzOkType: "primary",
      nzOkDanger: true,
      nzOnOk: () => {
        try {
          this.workExperienceService.delete(id).subscribe({
            next: (res) => {
              if (res) {
                this._customNotificationService.notification(
                  "success",
                  "Success",
                  "Work Experience Record is deleted successfully."
                );
                this.refreshData();
              }
            },
            error: (error) => {
              console.error('Error deleting work experience:', error);
              this._customNotificationService.notification(
                "error",
                "Error",
                "Failed to delete work experience record. Please try again."
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
      nzOnCancel: () => { }
    });
  }

  editModal(experience: ApplicantWorkExperienceRequest): void {
    const modal: NzModalRef = this._modal.create({
      nzTitle: "Edit Work Experience",
      nzContent: WorkExperienceFormComponent,
      nzComponentParams: {
        workExperience: experience
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
