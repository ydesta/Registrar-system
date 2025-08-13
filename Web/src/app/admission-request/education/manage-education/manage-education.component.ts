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
    private route: ActivatedRoute,
    private educationBackgroundService: EducationBackgroundService,
    private generalInformationService: GeneralInformationService,
    private sharingDataService: SharingDataService    
  ) {
    this.userId = localStorage.getItem('userId');
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

    // Listen for user authentication changes and data updates
    this.subscription.add(
      this.sharingDataService.otherCurrentMessage.subscribe(count => {
        // If the count changes, it might indicate a new login or data refresh
        if (count !== this.educationLists.length && this.applicantId) {
          this.refreshData();
        }
      })
    );

    // Monitor authentication state changes
    this.monitorAuthenticationState();
  }

  private monitorAuthenticationState(): void {
    // Check for authentication state changes every 1 second for faster response
    setInterval(() => {
      const currentUserId = localStorage.getItem('userId');
      if (currentUserId && currentUserId !== this.userId) {
        // User has changed or re-logged in
        console.log('User authentication state changed, refreshing education data...');
        this.userId = currentUserId;
        this.forceRefreshData();
      }
    }, 1000);

    // Also listen to storage events (for cross-tab authentication changes)
    window.addEventListener('storage', (event) => {
      if (event.key === 'userId' && event.newValue) {
        console.log('Storage event detected, user authentication changed...');
        this.userId = event.newValue;
        this.forceRefreshData();
      }
    });

    // Listen to focus events (when user returns to the tab)
    window.addEventListener('focus', () => {
      const currentUserId = localStorage.getItem('userId');
      if (currentUserId && currentUserId !== this.userId) {
        console.log('Tab focus detected, checking authentication state...');
        this.userId = currentUserId;
        this.forceRefreshData();
      }
    });

    // Listen to visibility change events (when tab becomes visible)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        const currentUserId = localStorage.getItem('userId');
        if (currentUserId && currentUserId !== this.userId) {
          console.log('Page visibility changed, checking authentication state...');
          this.userId = currentUserId;
          this.forceRefreshData();
        }
      }
    });
  }

  private initializeData(): void {
    // Subscribe to route parameter changes
    this.route.queryParams.subscribe(params => {
      const routeApplicantId = params["id"];
      if (routeApplicantId && routeApplicantId !== this.applicantId) {
        this.applicantId = routeApplicantId;
        this.getApplicantEducationByApplicantId(this.applicantId);
      } else if (!this.applicantId) {
        // If no route params and no applicantId, get from service
        this.loadApplicantIdFromService();
      }
    });
  }

  private loadApplicantIdFromService(): void {
    this.generalInformationService.getOrStoreParentApplicantId(this.userId).subscribe({
      next: (applicantId) => {
        if (applicantId && applicantId !== this.applicantId) {
          this.applicantId = applicantId;
          this.getApplicantEducationByApplicantId(applicantId);
        }
      },
      error: (error) => {
        console.error('Error loading applicant ID:', error);
        // Retry after a delay
        setTimeout(() => this.loadApplicantIdFromService(), 3000);
      }
    });
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
          this.educationBackgroundService.delete(id).subscribe({
            next: (res) => {
              if (res) {
                this._customNotificationService.notification(
                  "success",
                  "Success",
                  "Education Record is deleted successfully."
                );
                this.refreshData();
              }
            },
            error: (error) => {
              console.error('Error deleting education:', error);
              this._customNotificationService.notification(
                "error",
                "Error",
                "Failed to delete education record. Please try again."
              );
            }
          });
        } catch (error) {
          console.error('Error in delete operation:', error);
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

  editEducation(index: number) {
    this.educationIndex = index;
    this.educationModalVisible = true;
  }

  getApplicantEducationByApplicantId(id: string) {
    if (!id) {
      console.warn('No applicant ID provided for education lookup');
      return;
    }
    
    this.educationBackgroundService
      .getApplicantEducationByApplicantId(id)
      .subscribe({
        next: (res) => {
          if (res && res.data) {
            this.educationLists = res.data;
            this.sharingDataService.otherUpdateMessage(this.educationLists.length);
          } else {
            this.educationLists = [];
            this.sharingDataService.otherUpdateMessage(0);
          }
        },
        error: (error) => {
          console.error('Error loading education records:', error);
          this._customNotificationService.notification(
            "error",
            "Error",
            "Failed to load education data. Please refresh the page."
          );
          this.educationLists = [];
          this.sharingDataService.otherUpdateMessage(0);
        }
      });
  }

  refreshData(): void {
    if (this.applicantId) {
      this.getApplicantEducationByApplicantId(this.applicantId);
    } else {
      // If no applicantId, try to load it first
      this.loadApplicantIdFromService();
    }
  }

  forceRefreshData(): void {
    // Clear current data and force reload
    this.educationLists = [];
    this.sharingDataService.otherUpdateMessage(0);
    
    // Reload applicantId and data
    this.loadApplicantIdFromService();
  }

  openModal(): void {
    const modal: NzModalRef = this._modal.create({
      nzTitle: "Education Background",
      nzContent: EducationFormComponent,
      nzComponentParams: {
        applicationId: this.applicantId
      },
      nzMaskClosable: false,
      nzFooter: null,
      nzWidth: "50%"
    });
    
    // Listen to modal close and data updates
    modal.afterClose.subscribe(() => {
      this.refreshData();
    });
    
    // Get the component instance to listen to dataUpdated event
    const componentInstance = modal.getContentComponent();
    if (componentInstance) {
      componentInstance.dataUpdated.subscribe(() => {
        this.refreshData();
      });
    }
  }

  editModal(education: ApplicantEducationBackgroundRequest): void {
    const modal: NzModalRef = this._modal.create({
      nzTitle: "Education Background",
      nzContent: EducationFormComponent,
      nzComponentParams: {
        educationBackground: education
      },
      nzMaskClosable: false,
      nzFooter: null,
      nzWidth: "50%"
    });
    
    // Listen to modal close and data updates
    modal.afterClose.subscribe(() => {
      this.refreshData();
    });
    
    // Get the component instance to listen to dataUpdated event
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
