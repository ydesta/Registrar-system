import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { AcademicProgramRequestService } from '../services/academic-program-request.service';
import { ApplicantFeeViewModel } from '../model/applicant-fee-view-model.model';
import { PaymentModalComponent } from '../../banks/add-student-payment/payment-modal/payment-modal.component';
import { environment } from 'src/environments/environment';
import { Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { GeneralInformationService } from '../services/general-information.service';

@Component({
  selector: 'app-application-fee',
  templateUrl: './application-fee.component.html',
  styleUrls: ['./application-fee.component.scss']
})
export class ApplicationFeeComponent implements OnInit, OnDestroy {
  @Input() applicantId: string;
  @Input() isTabActive: boolean = false;
  @Output() paymentStatusChange = new EventEmitter<string>();
  // @Output() paymentSuccessful = new EventEmitter<void>(); // Removed - no longer needed
  
  applicationFee: ApplicantFeeViewModel | null = null;
  loading = false;
  paymentStatus: string = 'Not Paid';
  isPaymentButtonDisabled = false;

  private authCheckInterval: any;
  private subscriptions: Subscription[] = [];
  private isMonitoringStarted = false;
  private userId: string;

  constructor(
    private academicProgramRequestService: AcademicProgramRequestService,
    private modal: NzModalService,
    private route: ActivatedRoute,
    private generalInformationService: GeneralInformationService
  ) { 
    this.userId = localStorage.getItem("userId");
  }

  ngOnInit(): void {
    this.initializeData();
    this.startAuthenticationMonitoring();
  }

  ngOnDestroy(): void {
    if (this.authCheckInterval) {
      clearInterval(this.authCheckInterval);
    }
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // Watch for tab activation changes
  ngOnChanges(): void {
    if (this.isTabActive && this.applicantId && !this.applicationFee) {
      // Tab just became active and we don't have data, load it
      this.loadApplicationFee();
    }
  }

  private initializeData(): void {
    // First try to get applicantId from route params
    this.route.queryParams.subscribe(params => {
      const routeApplicantId = params["id"];
      if (routeApplicantId && routeApplicantId !== this.applicantId) {
        this.applicantId = routeApplicantId;
        this.loadApplicationFee();
      } else if (!this.applicantId) {
        this.loadApplicantIdFromService();
      } else {
        this.loadApplicationFee();
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
        this.loadApplicationFee();
      } else if (!applicantId) {
        // data is null — NOT an error
       // console.warn('No applicant found.');
       
      }
    },
    // error: (error) => {
    //   console.error('Error fetching applicant ID:', error);

    //   if (
    //     error.message?.includes('Network') ||
    //     error.message?.includes('Server')
    //   ) {
    //     console.log('Retrying in 3 seconds...');
    //     setTimeout(() => this.loadApplicantIdFromService(), 3000);
    //   } else {
       
    //   }
    // }
  });
}


  private startAuthenticationMonitoring(): void {
    if (this.isMonitoringStarted) {
      return;
    }

    this.isMonitoringStarted = true;

    // Monitor authentication state changes
    this.authCheckInterval = setInterval(() => {
      this.checkAuthenticationAndRefresh();
    }, 1000);

    // Monitor storage changes (for multi-tab scenarios)
    const storageSub = window.addEventListener('storage', (event) => {
      if (event.key === 'userId' || event.key === 'token') {
        this.forceRefreshData();
      }
    });

    // Monitor focus events
    const focusSub = window.addEventListener('focus', () => {
      this.checkAuthenticationAndRefresh();
    });

    // Monitor visibility changes
    const visibilitySub = document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.checkAuthenticationAndRefresh();
      }
    });

    // Clean up event listeners
    this.subscriptions.push(
      new Subscription(() => {
        window.removeEventListener('storage', storageSub as any);
        window.removeEventListener('focus', focusSub as any);
        document.removeEventListener('visibilitychange', visibilitySub as any);
      })
    );
  }

  private checkAuthenticationAndRefresh(): void {
    const currentUserId = localStorage.getItem('userId');
    const currentToken = localStorage.getItem('token');

    // Check if user ID has changed
    if (currentUserId && currentUserId !== this.userId) {
      this.userId = currentUserId;
      this.forceRefreshData();
      return;
    }

    // Check if we have valid authentication and applicantId
    if (currentUserId && currentToken && this.applicantId) {
      // Only refresh if we haven't loaded data yet or if it's been a while
      if (!this.applicationFee || this.shouldRefreshData()) {
        this.refreshData();
      }
    }
  }

  private shouldRefreshData(): boolean {
    // Refresh data if it's been more than 5 minutes since last load
    const lastRefresh = localStorage.getItem('applicationFeeLastRefresh');
    if (!lastRefresh) return true;
    
    const lastRefreshTime = new Date(lastRefresh).getTime();
    const currentTime = new Date().getTime();
    const fiveMinutes = 5 * 60 * 1000;
    
    return (currentTime - lastRefreshTime) > fiveMinutes;
  }

  private refreshData(): void {
    if (this.applicantId) {
      this.loadApplicationFee();
    }
  }

  private forceRefreshData(): void {
    // Clear existing data and reload
    this.applicationFee = null;
    this.paymentStatus = 'Not Paid';
    this.isPaymentButtonDisabled = false;
    
    if (this.applicantId) {
      this.loadApplicationFee();
    } else {
      this.loadApplicantIdFromService();
    }
  }

  loadApplicationFee() {
    if (!this.applicantId) {
      return;
    }
    
    this.loading = true;
    this.academicProgramRequestService.getApplicationFee(this.applicantId).subscribe({
      next: (response) => {
        if (response && Array.isArray(response) && response.length > 0) {
          this.applicationFee = response[0];
          this.paymentStatus = this.applicationFee?.status || 'Not Paid';
          this.isPaymentButtonDisabled = this.paymentStatus === 'Paid';
        } else if (response && typeof response === 'object') {
          this.applicationFee = response;
          this.paymentStatus = this.applicationFee?.status || 'Not Paid';
          this.isPaymentButtonDisabled = this.paymentStatus === 'Paid';
        } else {
          this.applicationFee = {
            paymentType: 'Application Fee',
            amount: 0,
            status: 'Not Paid',
            fileName: null
          };
          this.paymentStatus = 'Not Paid';
          this.isPaymentButtonDisabled = false;
        }
        this.loading = false;
        this.paymentStatusChange.emit(this.paymentStatus);
        
        // Store last refresh time
        localStorage.setItem('applicationFeeLastRefresh', new Date().toISOString());
      },
      error: (error) => {
        console.error('Error loading application fee:', error);
        this.loading = false;
        this.applicationFee = {
          paymentType: 'Application Fee',
          amount: 0,
          status: 'Not Paid',
          fileName: null
        };
        this.paymentStatus = 'Not Paid';
        this.isPaymentButtonDisabled = false;
        this.paymentStatusChange.emit(this.paymentStatus);
      }
    });
  }

  getFileName() {
    if (!this.shouldShowReceipt()) {
      // This shouldn't happen since the button is hidden, but adding safety check
      return;
    }
    
    const profilePicture =
      environment.fileUrl +
      "/Resources/coursepayment/" +
      this.applicationFee.fileName;
    window.open(profilePicture, '_blank');
  }

  openPaymentModal() {
    if (!this.applicationFee) {
      return;
    }

    const modalRef = this.modal.create({
      nzContent: PaymentModalComponent,
      nzWidth: 800,
      nzCentered: true,
      nzComponentParams: {
        studentCourseRegistrationID: this.applicantId,
        totalAmount: this.applicationFee.amount,
        type: 0,
        paidFor: 1,
        shouldNavigate: false // Prevent navigation - stay on current page
      },
      nzFooter: null
    });

    modalRef.afterClose.subscribe(result => {
      if (result) {
        this.loadApplicationFee();
        
        this.modal.success({
          nzTitle: 'Payment Successful!',
          nzContent: 'Your application fee payment has been processed successfully.',
          nzOkText: 'OK',
          nzCentered: true
        });
      }
    });
  }

  getStatusColor(): string {
    switch (this.paymentStatus) {
      case 'Paid':
        return 'green';
      case 'Not Paid':
        return 'red';
      case 'Pending':
        return 'orange';
      default:
        return 'default';
    }
  }

  shouldShowReceipt(): boolean {
    return this.isPaymentButtonDisabled && 
           !!this.applicationFee?.fileName && 
           this.applicationFee.fileName.trim() !== '';
  }
}
