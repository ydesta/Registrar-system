import { Component } from "@angular/core";
import { ApplicantContactPersonRequest } from "../../model/applicant-contact-person-request.model";
import { NzModalRef, NzModalService } from "ng-zorro-antd/modal";
import { ActivatedRoute } from "@angular/router";
import { CustomNotificationService } from "src/app/services/custom-notification.service";
import { GeneralInformationService } from "../../services/general-information.service";
import { ApplicantContactPersonService } from "../../services/applicant-contact-person.service";
import { ContactPersonFormComponent } from "../contact-person-form/contact-person-form.component";
import { SharingDataService } from "../../services/sharing-data.service";
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
  constructor(
    private modalRef: NzModalRef,
    private _modal: NzModalService,
    private _customNotificationService: CustomNotificationService,
    private route: ActivatedRoute,
    private generalInformationService: GeneralInformationService,
    private applicantContactPersonService: ApplicantContactPersonService,
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
      this.sharingDataService.currentMessage.subscribe(count => {
        // If the count changes, it might indicate a new login or data refresh
        if (count !== this.noumberOfContact && this.applicantId) {
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
        console.log('User authentication state changed, refreshing data...');
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
        this.getApplicantContactPersonByApplicantId(this.applicantId);
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
          this.getApplicantContactPersonByApplicantId(applicantId);
        }
      },
      error: (error) => {
        console.error('Error loading applicant ID:', error);
        // Retry after a delay
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
          this._customNotificationService.notification(
            "error",
            "Error",
            "Failed to load contact person data. Please refresh the page."
          );
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
    
    // Reload applicantId and data
    this.loadApplicantIdFromService();
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
  }
}
