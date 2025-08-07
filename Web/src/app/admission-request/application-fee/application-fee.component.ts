import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { AcademicProgramRequestService } from '../services/academic-program-request.service';
import { ApplicantFeeViewModel } from '../model/applicant-fee-view-model.model';
import { PaymentModalComponent } from '../../banks/add-student-payment/payment-modal/payment-modal.component';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-application-fee',
  templateUrl: './application-fee.component.html',
  styleUrls: ['./application-fee.component.scss']
})
export class ApplicationFeeComponent implements OnInit {
  @Input() applicantId: string;
  @Output() paymentStatusChange = new EventEmitter<string>();
  @Output() paymentSuccessful = new EventEmitter<void>();
  
  applicationFee: ApplicantFeeViewModel | null = null;
  loading = false;
  paymentStatus: string = 'Not Paid';
  isPaymentButtonDisabled = false;

  constructor(
    private academicProgramRequestService: AcademicProgramRequestService,
    private modal: NzModalService
  ) { }

  ngOnInit(): void {
    if (this.applicantId) {
      this.getApplicationFee(this.applicantId);
    }
  }

  getApplicationFee(applicantId: string) {
    this.loading = true;
    this.academicProgramRequestService.getApplicationFee(applicantId).subscribe({
      next: (response) => {
        console.log('Application Fee:', response);
        this.applicationFee = response[0] as any;
        this.paymentStatus = this.applicationFee?.status || 'Not Paid';
        this.isPaymentButtonDisabled = this.paymentStatus === 'Paid';
        this.loading = false;
        // Emit payment status to parent component
        this.paymentStatusChange.emit(this.paymentStatus);
      },
      error: (error) => {
        console.error('Error fetching application fee:', error);
        this.loading = false;
        // Set default values if error occurs
        this.applicationFee = {
          paymentType: 'Application Fee',
          amount: 0,
          status: 'Not Paid',
          fileName: null
        };
        this.paymentStatus = 'Not Paid';
        this.isPaymentButtonDisabled = false;
        // Emit payment status to parent component
        this.paymentStatusChange.emit(this.paymentStatus);
      }
    });
  }
  getFileName() {
    if (!this.applicationFee.fileName) return;
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
        // Payment was successful, refresh the application fee data
        this.getApplicationFee(this.applicantId);
        
        // Show success message
        this.modal.success({
          nzTitle: 'Payment Successful!',
          nzContent: 'Your application fee payment has been processed successfully.',
          nzOkText: 'OK',
          nzCentered: true,
          nzOnOk: () => {
            // Emit event to parent component to navigate to next tab
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
