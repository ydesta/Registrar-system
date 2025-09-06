import { Component } from "@angular/core";
import { ApplicantContactPersonRequest } from "../../model/applicant-contact-person-request.model";
import { NzModalRef, NzModalService } from "ng-zorro-antd/modal";
import { ActivatedRoute } from "@angular/router";
import { CustomNotificationService } from "src/app/services/custom-notification.service";
import { GeneralInformationService } from "../../services/general-information.service";
import { ApplicantContactPersonService } from "../../services/applicant-contact-person.service";
import { ContactPersonFormComponent } from "../contact-person-form/contact-person-form.component";
import { SharingDataService } from "../../services/sharing-data.service";
import { AuthService } from "src/app/services/auth.service";
import { Subscription } from "rxjs";

@Component({
  selector: "app-manage-contact-person-form",
  templateUrl: "./manage-contact-person-form.component.html",
  styleUrls: ["./manage-contact-person-form.component.scss"]
})
export class ManageContactPersonFormComponent {
  contactPersonLists: ApplicantContactPersonRequest[] = [];
  applicantId: string;
  userId: string;
  ContactIndex = -1;
  noumberOfContact = 0;
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
    private applicantContactPersonService: ApplicantContactPersonService,
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
        console.log('User authenticated, initializing component...');
        this.userId = localStorage.getItem('userId');
        this.clearCachedData();
        this.initializeData();
        this.isInitialized = true;
      } else if (!isAuth && this.isInitialized) {
        console.log('User logged out, clearing component state...');
        this.clearComponentState();
        this.isInitialized = false;
      }
    });

    // Monitor login changes
    this.authSubscription.add(
      this.authService.loginChanged.subscribe(isLoggedIn => {
        if (isLoggedIn && !this.isInitialized) {
          console.log('Login detected, initializing component...');
          this.userId = localStorage.getItem('userId');
          this.clearCachedData();
          this.initializeData();
          this.isInitialized = true;
        } else if (!isLoggedIn) {
          console.log('Logout detected, clearing component state...');
          this.clearComponentState();
          this.isInitialized = false;
        }
      })
    );

    // Monitor current user changes
    this.authSubscription.add(
      this.authService.currentUser$.subscribe(user => {
        if (user && user.id !== this.userId) {
          console.log('User changed, updating component...');
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
      this.sharingDataService.currentMessage.subscribe(count => {
        // If the count changes, it might indicate a new login or data refresh
        if (count !== this.noumberOfContact && this.applicantId) {
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
    this.contactPersonLists = [];
    this.noumberOfContact = 0;
    this.applicantId = null;
  }

  private clearComponentState(): void {
    this.contactPersonLists = [];
    this.noumberOfContact = 0;
    this.applicantId = null;
    this.isSubmittedApplicationForm = 0;
    this.isApplicantProfile = false;
  }

  private initializeData(): void {
    // Subscribe to route parameter changes
    this.route.queryParams.subscribe(params => {
      const routeApplicantId = params["id"];
      if (routeApplicantId && routeApplicantId !== this.applicantId) {
        this.applicantId = routeApplicantId;
        this.getApplicantContactPersonByApplicantId(this.applicantId);
      } else if (!this.applicantId) {
        // If no route params and no applicantId, get from service
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
        console.log("contact person applicantId    ", applicantId);
        if (applicantId && applicantId !== this.applicantId) {
          this.applicantId = applicantId;
          this.getApplicantContactPersonByApplicantId(applicantId);
        } else if (!applicantId) {
          console.warn('No applicant found for user:', this.userId);
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


  deleteContact(id: string) {
    this._modal.confirm({
      nzTitle: "Are you sure delete this Contact Record?",
      nzOkText: "Yes",
      nzOkType: "primary",
      nzOkDanger: true,
      nzOnOk: () => {
        try {
          this.applicantContactPersonService.delete(id).subscribe({
            next: (res) => {
              if (res) {
                this._customNotificationService.notification(
                  "success",
                  "Success",
                  "Contact Record is deleted successfully."
                );
                this.refreshData();
              }
            },
            error: (error) => {
              console.error('Error deleting contact:', error);
              this._customNotificationService.notification(
                "error",
                "Error",
                "Failed to delete contact. Please try again."
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

  getApplicantContactPersonByApplicantId(id: string) {
    if (!id) {
      console.warn('No applicant ID provided for contact person lookup');
      return;
    }
    
    this.applicantContactPersonService
      .getApplicantContactPersonId(id)
      .subscribe({
        next: (res) => {
          if (res && res.data) {
            this.contactPersonLists = res.data;
            this.noumberOfContact = this.contactPersonLists.length;
            this.sharingDataService.updateMessage(this.noumberOfContact);
          } else {
            this.contactPersonLists = [];
            this.noumberOfContact = 0;
            this.sharingDataService.updateMessage(0);
          }
        },
        error: (error) => {
          console.error('Error loading contact persons:', error);
          this.handleAuthError(error);
          this.contactPersonLists = [];
          this.noumberOfContact = 0;
          this.sharingDataService.updateMessage(0);
        }
      });
  }

  refreshData(): void {
    if (this.applicantId) {
      this.getApplicantContactPersonByApplicantId(this.applicantId);
    } else {
      // If no applicantId, try to load it first
      this.loadApplicantIdFromService();
    }
  }

  forceRefreshData(): void {
    // Clear current data and force reload
    this.contactPersonLists = [];
    this.noumberOfContact = 0;
    this.sharingDataService.updateMessage(0);
    
    // Clear cached data first
    this.clearCachedData();
    
    // Reload applicantId and data
    this.loadApplicantIdFromService();
  }

  // Add method to handle authentication errors gracefully
  private handleAuthError(error: any): void {
    console.error('Authentication error in component:', error);
    
    if (error.status === 401 || error.status === 403) {
      // User is not authenticated, clear state and wait for login
      this.clearComponentState();
      this.isInitialized = false;
      
      // Show user-friendly message
      this._customNotificationService.notification(
        "warning",
        "Authentication Required",
        "Please log in to view your contact person data."
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
      nzTitle: "Applicant Contact Person",
      nzContent: ContactPersonFormComponent,
      nzComponentParams: {
        applicationId: this.applicantId
      },
      nzMaskClosable: false,
      nzFooter: null
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

  editModal(data: ApplicantContactPersonRequest): void {
    const modal: NzModalRef = this._modal.create({
      nzTitle: "Edit Applicant Contact Person",
      nzContent: ContactPersonFormComponent,
      nzComponentParams: {
        contactPerson: data
      },
      nzMaskClosable: false,
      nzFooter: null
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
  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }
}
