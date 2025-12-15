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
import { AuthService } from "src/app/services/auth.service";
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
  private authSubscription!: Subscription;
  private isInitialized = false;

  constructor(
    private modalRef: NzModalRef,
    private _modal: NzModalService,
    private _customNotificationService: CustomNotificationService,
    private route: ActivatedRoute,
    private educationBackgroundService: EducationBackgroundService,
    private generalInformationService: GeneralInformationService,
    private sharingDataService: SharingDataService,
    private authService: AuthService
  ) {
    this.userId = localStorage.getItem('userId');
  }

  ngOnInit(): void {
    // Subscribe to authentication state changes first
    this.setupAuthenticationMonitoring();
    
    // Initialize data only after authentication is confirmed
    this.authService.isAuthenticated().then(isAuth => {
      if (isAuth) {
        this.initializeData();
        this.isInitialized = true;
      }
    });

    // Set up other subscriptions
    this.setupDataSubscriptions();
  }

  private setupAuthenticationMonitoring(): void {
    // Monitor authentication state changes
    this.authSubscription = this.authService.isAuthenticated$.subscribe(isAuth => {
      if (isAuth && !this.isInitialized) {
        this.userId = localStorage.getItem('userId');
        this.clearCachedData();
        this.initializeData();
        this.isInitialized = true;
      } else if (!isAuth && this.isInitialized) {
        this.clearComponentState();
        this.isInitialized = false;
      }
    });

    // Monitor login changes
    this.authSubscription.add(
      this.authService.loginChanged.subscribe(isLoggedIn => {
        if (isLoggedIn && !this.isInitialized) {
          this.userId = localStorage.getItem('userId');
          this.clearCachedData();
          this.initializeData();
          this.isInitialized = true;
        } else if (!isLoggedIn) {
          this.clearComponentState();
          this.isInitialized = false;
        }
      })
    );

    // Monitor current user changes
    this.authSubscription.add(
      this.authService.currentUser$.subscribe(user => {
        if (user && user.id !== this.userId) {
          this.userId = user.id;
          this.clearCachedData();
          if (this.isInitialized) {
            this.refreshData();
          } else {
            this.initializeData();
            this.isInitialized = true;
          }
        }
      })
    );
  }

  private setupDataSubscriptions(): void {
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
  }

  private clearCachedData(): void {
    // Clear cached applicant ID from localStorage
    localStorage.removeItem('parent_applicant_id');
    
    // Clear cached data from the service
    this.generalInformationService.clearParentApplicantIdCache();
    
    // Clear component data
    this.educationLists = [];
    this.applicantId = null;
  }

  private clearComponentState(): void {
    this.educationLists = [];
    this.applicantId = null;
    this.isSubmittedApplicationForm = 0;
    this.isApplicantProfile = false;
    this.educationIndex = -1;
    this.educationModalVisible = false;
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
    if (!this.userId) {
      return;
    }

    this.generalInformationService.getOrStoreParentApplicantId(this.userId).subscribe({
      next: (applicantId) => {
        if (applicantId && applicantId !== this.applicantId) {
          this.applicantId = applicantId;
          this.getApplicantEducationByApplicantId(applicantId);
        } else if (!applicantId) {
          // Don't retry - this is a valid state where no applicant exists
          return;
        }
      },
      error: (error) => {
        // Handle cooldown error specifically
        if (error.message && error.message.includes('Fetch cooldown active')) {
          // Wait a bit longer and try again, or check if there's a cached value
          setTimeout(() => this.loadApplicantIdFromService(), 1000);
          return;
        }
        
        this.handleAuthError(error);
        
        // Don't retry automatically on authentication errors
        if (error.status === 401 || error.status === 403) {
          return;
        }
        // Retry for other errors after a delay
        setTimeout(() => this.loadApplicantIdFromService(), 3000);
      }
    });
  }

  // Add method to handle authentication errors gracefully
  private handleAuthError(error: any): void {
    if (error.status === 401 || error.status === 403) {
      // User is not authenticated, clear state and wait for login
      this.clearComponentState();
      this.isInitialized = false;
      
      // Show user-friendly message
      this._customNotificationService.notification(
        "warning",
        "Authentication Required",
        "Please log in to view your education data."
      );
    } else if (error.status === 0 || error.status >= 500) {
      // Network or server error
      this._customNotificationService.notification(
        "error",
        "Connection Error",
        "Unable to connect to the server. Please check your connection and try again."
      );
    }
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
              this._customNotificationService.notification(
                "error",
                "Error",
                "Failed to delete education record. Please try again."
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

  editEducation(index: number) {
    this.educationIndex = index;
    this.educationModalVisible = true;
  }

  getApplicantEducationByApplicantId(id: string) {
    if (!id) {
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
          this.handleAuthError(error);
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
    
    // Clear cached data first
    this.clearCachedData();
    
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
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }
}
