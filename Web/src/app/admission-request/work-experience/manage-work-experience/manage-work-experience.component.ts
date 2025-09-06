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
import { AuthService } from "src/app/services/auth.service";
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
  private authSubscription!: Subscription;
  private isInitialized = false;

  constructor(
    private modalRef: NzModalRef,
    private _modal: NzModalService,
    private _customNotificationService: CustomNotificationService,
    private route: ActivatedRoute,
    private generalInformationService: GeneralInformationService,
    private workExperienceService: WorkExperienceService,
    private sharingDataService: SharingDataService,
    private authService: AuthService
  ) {
    this.userId = localStorage.getItem("userId");
  }

  ngOnInit(): void {
    // Subscribe to authentication state changes first
    this.setupAuthenticationMonitoring();
    
    // Initialize data only after authentication is confirmed
    this.authService.isAuthenticated().then(isAuth => {
      if (isAuth) {
        this.initializeData();
        this.isInitialized = true;
      } else {
        console.log('User not authenticated, waiting for login...');
      }
    });

    // Set up other subscriptions
    this.setupDataSubscriptions();
  }

  private setupAuthenticationMonitoring(): void {
    // Monitor authentication state changes
    this.authSubscription = this.authService.isAuthenticated$.subscribe(isAuth => {
      if (isAuth && !this.isInitialized) {
        console.log('User authenticated, initializing work experience component...');
        this.userId = localStorage.getItem('userId');
        this.clearCachedData();
        this.initializeData();
        this.isInitialized = true;
      } else if (!isAuth && this.isInitialized) {
        console.log('User logged out, clearing work experience component state...');
        this.clearComponentState();
        this.isInitialized = false;
      }
    });

    // Monitor login changes
    this.authSubscription.add(
      this.authService.loginChanged.subscribe(isLoggedIn => {
        if (isLoggedIn && !this.isInitialized) {
          console.log('Login detected, initializing work experience component...');
          this.userId = localStorage.getItem('userId');
          this.clearCachedData();
          this.initializeData();
          this.isInitialized = true;
        } else if (!isLoggedIn) {
          console.log('Logout detected, clearing work experience component state...');
          this.clearComponentState();
          this.isInitialized = false;
        }
      })
    );

    // Monitor current user changes
    this.authSubscription.add(
      this.authService.currentUser$.subscribe(user => {
        if (user && user.id !== this.userId) {
          console.log('User changed, updating work experience component...');
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
  }

  private clearCachedData(): void {
    // Clear cached applicant ID from localStorage
    localStorage.removeItem('parent_applicant_id');
    
    // Clear cached data from the service
    this.generalInformationService.clearParentApplicantIdCache();
    
    // Clear component data
    this.workExperienceLists = [];
    this.applicantId = null;
  }

  private clearComponentState(): void {
    this.workExperienceLists = [];
    this.applicantId = null;
    this.isSubmittedApplicationForm = 0;
    this.isApplicantProfile = false;
    this.workExperienceIndex = 0;
    this.exprienceModalVisible = false;
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
    if (!this.userId) {
      console.warn('No userId available, cannot load applicant ID');
      return;
    }

    this.generalInformationService.getOrStoreParentApplicantId(this.userId).subscribe({
      next: (applicantId) => {
        if (applicantId && applicantId !== this.applicantId) {
          this.applicantId = applicantId;
          this.getApplicantExperienceByApplicantId(applicantId);
        }
      },
      error: (error) => {
        console.error('Error loading applicant ID:', error);
        
        // Handle cooldown error specifically
        if (error.message && error.message.includes('Fetch cooldown active')) {
          console.log('Fetch cooldown active, waiting for cached value...');
          // Wait a bit longer and try again, or check if there's a cached value
          setTimeout(() => this.loadApplicantIdFromService(), 1000);
          return;
        }
        
        this.handleAuthError(error);
        
        // Don't retry automatically on authentication errors
        if (error.status === 401 || error.status === 403) {
          console.log('Authentication error, user may need to login again');
          return;
        }
        // Retry for other errors after a delay
        setTimeout(() => this.loadApplicantIdFromService(), 3000);
      }
    });
  }

  // Add method to handle authentication errors gracefully
  private handleAuthError(error: any): void {
    console.error('Authentication error in work experience component:', error);
    
    if (error.status === 401 || error.status === 403) {
      // User is not authenticated, clear state and wait for login
      this.clearComponentState();
      this.isInitialized = false;
      
      // Show user-friendly message
      this._customNotificationService.notification(
        "warning",
        "Authentication Required",
        "Please log in to view your work experience data."
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
          this.handleAuthError(error);
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
    
    // Clear cached data first
    this.clearCachedData();
    
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
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }
}
