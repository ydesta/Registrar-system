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
import { AuthService } from "src/app/services/auth.service";
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
  private authSubscription!: Subscription;
  private isInitialized = false;

  constructor(
    private modalRef: NzModalRef,
    private _modal: NzModalService,
    private _customNotificationService: CustomNotificationService,
    private _academicProgramRequestService: AcademicProgramRequestService,
    private route: ActivatedRoute,
    private generalInformationService: GeneralInformationService,
    private sharedDataService: SharingDataService,
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
        this.checkUserRole();
        this.getAcademicProgramList();
        this.getListOfDivisionStatus();
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
        console.log('User authenticated, initializing student program requester component...');
        this.userId = localStorage.getItem('userId');
        this.clearCachedData();
        this.initializeData();
        this.checkUserRole();
        this.getAcademicProgramList();
        this.getListOfDivisionStatus();
        this.isInitialized = true;
      } else if (!isAuth && this.isInitialized) {
        console.log('User logged out, clearing student program requester component state...');
        this.clearComponentState();
        this.isInitialized = false;
      }
    });

    // Monitor login changes
    this.authSubscription.add(
      this.authService.loginChanged.subscribe(isLoggedIn => {
        if (isLoggedIn && !this.isInitialized) {
          console.log('Login detected, initializing student program requester component...');
          this.userId = localStorage.getItem('userId');
          this.clearCachedData();
          this.initializeData();
          this.checkUserRole();
          this.getAcademicProgramList();
          this.getListOfDivisionStatus();
          this.isInitialized = true;
        } else if (!isLoggedIn) {
          console.log('Logout detected, clearing student program requester component state...');
          this.clearComponentState();
          this.isInitialized = false;
        }
      })
    );

    // Monitor current user changes
    this.authSubscription.add(
      this.authService.currentUser$.subscribe(user => {
        if (user && user.id !== this.userId) {
          console.log('User changed, updating student program requester component...');
          this.userId = user.id;
          this.clearCachedData();
          if (this.isInitialized) {
            this.refreshData();
          } else {
            this.initializeData();
            this.checkUserRole();
            this.getAcademicProgramList();
            this.getListOfDivisionStatus();
            this.isInitialized = true;
          }
        }
      })
    );
  }

  private setupDataSubscriptions(): void {
    this.subscription = this.sharedDataService.currentApplicantProfile.subscribe(
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
    this.applicationProgramRequestList = [];
    this.applicantId = null;
  }

  private clearComponentState(): void {
    this.applicationProgramRequestList = [];
    this.applicantId = null;
    this.noOfApplicantProgramRequest = 0;
    this.isSubmittedApplicationForm = 0;
    this.countSubmitionCourse = 0;
    this.isApplicantProfile = false;
    this.applicationProgramRequestIndex = -1;
    this.applicationProgramRequestModalVisible = false;
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
  if (!this.userId) {
    console.warn('No userId available, cannot load applicant ID');
    return;
  }

  this.generalInformationService.getOrStoreParentApplicantId(this.userId).subscribe({
    next: (applicantId) => {
      if (applicantId && applicantId !== this.applicantId) {
        this.applicantId = applicantId;
        console.log("Applicant ID loaded successfully:", this.applicantId);
        this.getApplicantacadamicPrgramtId(applicantId);
      } else if (!applicantId) {
        console.warn('No applicant found for user:', this.userId);
        // Don't retry - this is a valid state where no applicant exists
        return;
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
    console.error('Authentication error in student program requester component:', error);
    
    if (error.status === 401 || error.status === 403) {
      // User is not authenticated, clear state and wait for login
      this.clearComponentState();
      this.isInitialized = false;
      
      // Show user-friendly message
      this._customNotificationService.notification(
        "warning",
        "Authentication Required",
        "Please log in to view your academic program data."
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
          this.handleAuthError(error);
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
    
    // Clear cached data first
    this.clearCachedData();
    
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
    // Validate that we have an applicantId before opening the modal
    if (!this.applicantId) {
      console.error("Cannot open modal: applicantId is not available");
      this._customNotificationService.notification(
        "error",
        "Error",
        "Cannot create program request: Applicant information not loaded. Please refresh the page and try again."
      );
      return;
    }

    console.log("Opening modal with applicantId:", this.applicantId);
    
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
    // Validate that we have the required data before opening the modal
    if (!request) {
      console.error("Cannot edit: request object is null or undefined");
      return;
    }

    const applicantId = request.applicantId || this.applicantId;
    if (!applicantId) {
      console.error("Cannot edit: applicantId is not available");
      this._customNotificationService.notification(
        "error",
        "Error",
        "Cannot edit program request: Applicant information not available. Please refresh the page and try again."
      );
      return;
    }

    console.log("Opening edit modal with applicantId:", applicantId);
    
    const modal: NzModalRef = this._modal.create({
      nzTitle: "Edit Academic Program Request",
      nzContent: StudentProgramRequesterFormComponent,
      nzComponentParams: {
        studentProgramRequester: request,
        applicantId: applicantId
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
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }
}
