import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { AcademicProgramRequestService } from '../services/academic-program-request.service';
import { ApplicantFeeViewModel } from '../model/applicant-fee-view-model.model';
import { PaymentModalComponent } from '../../banks/add-student-payment/payment-modal/payment-modal.component';
import { environment } from 'src/environments/environment';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-application-fee',
  templateUrl: './application-fee.component.html',
  styleUrls: ['./application-fee.component.scss']
})
export class ApplicationFeeComponent implements OnInit, OnDestroy {
  @Input() applicantId: string;
  @Output() paymentStatusChange = new EventEmitter<string>();
  @Output() paymentSuccessful = new EventEmitter<void>();
  
  applicationFee: ApplicantFeeViewModel | null = null;
  loading = false;
  paymentStatus: string = 'Not Paid';
  isPaymentButtonDisabled = false;

  private authCheckInterval: any;
  private subscriptions: Subscription[] = [];
  private isMonitoringStarted = false;

  constructor(
    private academicProgramRequestService: AcademicProgramRequestService,
    private modal: NzModalService
  ) { }

  ngOnInit(): void {
    if (this.applicantId) {
      this.loadApplicationFee();
    }
    this.startAuthenticationMonitoring();
  }

  ngOnDestroy(): void {
    if (this.authCheckInterval) {
      clearInterval(this.authCheckInterval);
    }
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private startAuthenticationMonitoring(): void {
    if (this.isMonitoringStarted) {
      return;
    }

    this.isMonitoringStarted = true;

    this.authCheckInterval = setInterval(() => {
      this.checkAuthenticationAndRefresh();
    }, 5000);

    const storageSub = window.addEventListener('storage', (event) => {
      if (event.key === 'userId' || event.key === 'token') {
        this.forceRefreshData();
      }
    });

    const focusSub = window.addEventListener('focus', () => {
      this.checkAuthenticationAndRefresh();
    });

    const visibilitySub = document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.checkAuthenticationAndRefresh();
      }
    });

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

    if (currentUserId && currentToken && this.applicantId) {
      this.refreshData();
    }
  }

  private refreshData(): void {
    if (this.applicantId) {
      this.loadApplicationFee();
    }
  }

  private forceRefreshData(): void {
    if (this.applicantId) {
      this.loadApplicationFee();
    }
  }

  loadApplicationFee() {
    if (this.applicantId) {
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
        },
        error: (error) => {
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
  }

  getFileName() {
    if (!this.applicationFee?.fileName) return;
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
        paidFor: 1
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
          nzCentered: true,
          nzOnOk: () => {
            this.paymentSuccessful.emit();
          }
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
}
