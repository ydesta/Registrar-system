import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PaymentService } from '../../../services/payment.service';
import { PaymentGatewayRequest } from '../../../interfaces/payment.interface';
import { CustomNotificationService } from '../../../services/custom-notification.service';

@Component({
  selector: 'app-payment-options',
  templateUrl: './payment-options.component.html',
  styleUrls: ['./payment-options.component.scss']
})
export class PaymentOptionsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  registrationId: string;
  batchCode: string;
  requestType: number;
  registrationData: any = null;
  selectedCourses: any[] = [];

  numberOfCourses = 0;
  totalAmount = 0;
  currency = 'ETB';
  orderNumber: string;
  paymentOrderId: string;
  academicTerm: number
  academicYear: number
  selectedPaymentOption: 'receipt' | 'gateway' | null = null;

  isUploadingReceipt = false;
  isProcessingGatewayPayment = false;

  isLoading = false;
  errorMessage = '';
  successMessage = '';
  semester: string;
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private paymentService: PaymentService,
    private notificationService: CustomNotificationService
  ) {
  }

  ngOnInit(): void {
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        console.log("%%%     ", params);
        this.registrationId = params['registrationid'];
        this.batchCode = params['code'];
        this.semester = params['type'];
        this.requestType = this.getRequestType(params['type']);
        if (this.registrationId) {
          this.loadRegistrationData();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeReceiptForm(): void {
  }

  private getRequestType(type: string): number {
    switch (type) {
      case 'Add Request': return 2;
      case 'Semester': return 0;
      default: return 0;
    }
  }

  private async loadRegistrationData(): Promise<void> {
    try {
      this.isLoading = true;
      const response = await this.paymentService.getRegistrationPaymentStatus(this.registrationId).toPromise();
      if (response.status === 'success' && response.data) {
        const data = response.data;
        const result = response.data.paymentDetails;
        this.registrationData = data.registration;
        this.selectedCourses = data.paymentOrder?.selectedCourses || [];
        this.numberOfCourses = data.paymentOrder?.numberOfCourses || 0;
        this.orderNumber = data.paymentOrder?.orderNumber || '';
        this.academicTerm = data.paymentOrder?.academicTerm || '';
        this.academicYear = data.paymentOrder?.academicYear || '';
        this.totalAmount = result.amount || 0;
        this.paymentOrderId = data.paymentOrder.id;
        if (data.isPaid) {
          this.successMessage = 'Payment already completed for this registration';
          this.router.navigate(['/registration/success'], {
            queryParams: { registrationId: this.registrationId }
          });
        }
      } else {
        this.errorMessage = response.error || 'Failed to load registration data';
      }
    } catch (error) {
      this.errorMessage = 'Error loading registration data: ' + error.message;
    } finally {
      this.isLoading = false;
    }
  }

  selectPaymentOption(option: 'receipt' | 'gateway'): void {
    this.selectedPaymentOption = option;
    this.errorMessage = '';
    this.successMessage = '';
    if (option === 'receipt') {
      this.redirectToBankPayment();
    } else if (option === 'gateway') {
      this.isProcessingGatewayPayment = true;
      this.processGatewayPayment();
    }
  }
  async processGatewayPayment(): Promise<void> {
    this.isProcessingGatewayPayment = true;
    this.errorMessage = '';
    try {
      if (!this.orderNumber) {
        this.errorMessage = 'Order Number is required for EthSwitch payment';
        this.isProcessingGatewayPayment = false;
        return;
      }
      if (!this.registrationId) {
        this.errorMessage = 'Registration ID is required';
        this.isProcessingGatewayPayment = false;
        return;
      }
      if (!this.batchCode) {
        this.errorMessage = 'Batch code is required';
        this.isProcessingGatewayPayment = false;
        return;
      }
      if (!this.numberOfCourses == undefined || this.numberOfCourses === 0) {
        this.errorMessage = 'No courses selected for registration';
        this.isProcessingGatewayPayment = false;
        return;
      }
      if (this.totalAmount <= 0) {
        this.errorMessage = 'Total amount must be greater than zero';
        this.isProcessingGatewayPayment = false;
        return;
      }

      const initiatedPayment: PaymentGatewayRequest = {
        paymentOrderId: this.paymentOrderId,
        amount: this.totalAmount * 100,
        currency: "230",
        description: this.generatePaymentDescription()
      };
      const response = await this.paymentService.initiatePayment(initiatedPayment).toPromise();
      if (response.success) {
        this.successMessage = 'Payment initiated successfully. Redirecting to payment gateway...';
        this.notificationService.showSuccess('Payment initiated successfully');
        let paymentGatewayUrl = '';
        try {
          if (response.redirectUrl) {
            let ethSwitchResponse;
            if (typeof response.redirectUrl === 'string') {
              try {
                ethSwitchResponse = JSON.parse(response.redirectUrl);
              } catch (stringParseError) {
                if (response.redirectUrl.includes('epg.ethswitch.et')) {
                  paymentGatewayUrl = response.redirectUrl;
                } else {
                  throw new Error('Unable to parse redirectUrl as JSON or URL: ' + response.redirectUrl);
                }
              }
            } else if (typeof response.redirectUrl === 'object') {
              ethSwitchResponse = response.redirectUrl;
            } else {
              throw new Error('Unexpected redirectUrl type: ' + typeof response.redirectUrl);
            }
            if (ethSwitchResponse && !paymentGatewayUrl) {
              if (ethSwitchResponse.formUrl) {
                paymentGatewayUrl = ethSwitchResponse.formUrl;
              } else if (ethSwitchResponse.errorCode === 0) {
                this.errorMessage = 'EthSwitch returned success but no payment URL';
                this.notificationService.showError('EthSwitch returned success but no payment URL');
                this.isProcessingGatewayPayment = false;
                return;
              } else {
                this.errorMessage = 'EthSwitch error: ' + (ethSwitchResponse.message || 'Unknown error');
                this.notificationService.showError('EthSwitch error: ' + (ethSwitchResponse.message || 'Unknown error'));
                this.isProcessingGatewayPayment = false;
                return;
              }
            }

            if (!paymentGatewayUrl) {
              this.errorMessage = 'No payment gateway URL found in EthSwitch response';
              this.notificationService.showError('No payment gateway URL found in EthSwitch response');
              this.isProcessingGatewayPayment = false;
              return;
            }
          } else {
            this.errorMessage = 'No redirect URL received from payment gateway';
            this.notificationService.showError('No redirect URL received from payment gateway');
            this.isProcessingGatewayPayment = false;
            return;
          }
        } catch (parseError) {
          this.errorMessage = 'Error processing EthSwitch response: ' + parseError.message;
          this.notificationService.showError('Error processing EthSwitch response: ' + parseError.message);
          this.isProcessingGatewayPayment = false;
          return;
        }
        if (paymentGatewayUrl) {
          setTimeout(() => {
            this.paymentService.redirectToPaymentGateway(paymentGatewayUrl);
          }, 1500);
        } else {
          this.errorMessage = 'No valid payment gateway URL found';
          this.notificationService.showError('No valid payment gateway URL found');
        }
      } else {
        const errorMsg = response.message || 'Failed to initiate payment';
        this.errorMessage = errorMsg;
        this.notificationService.showError(errorMsg);
      }
    } catch (error) {
      const errorMsg = 'Error processing payment: ' + (error.message || 'Unknown error');
      this.errorMessage = errorMsg;
      this.notificationService.showError('Failed to process payment');
    } finally {
      this.isProcessingGatewayPayment = false;
    }
  }
  goBack(): void {
    this.router.navigate(['/students/course-registration']);
  }
  redirectToBankPayment(): void {
    const semester = this.semester;
    this.router.navigate(['/banks/add-student-payment'], {
      queryParams: {
        registrationid: this.registrationId,
        code: this.batchCode,
        type: semester
      }
    });
  }

  private getSemesterType(): string {
    switch (this.registrationData?.academicTerm) {
      case 1: return 'Winter';
      case 2: return 'Spring';
      case 3: return 'Summer';
      case 4: return 'Autumn';
      default: return 'Semester';
    }
  }

  private generatePaymentDescription(): string {
    const termNames = {
      1: 'Winter',
      2: 'Spring',
      3: 'Summer',
      4: 'Autumn',
    };
    const termName = termNames[this.registrationData?.academicTerm] || 'Term';
    const courseCount = this.selectedCourses.length;
    return `${termName} ${this.registrationData?.academicYear} Course Registration (${courseCount} courses)`;
  }
  formatCurrency(amount: number, currency: string): string {
    const currencyMap: { [key: string]: string } = {
      '230': 'ETB',
      'ETB': 'ETB',
      'USD': 'USD',
      'EUR': 'EUR'
    };
    const isoCurrency = currencyMap[currency] || 'ETB';
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: isoCurrency
    }).format(amount);
  }
  get canProcessGatewayPayment(): boolean {
    const canProcess = !this.isProcessingGatewayPayment &&
      this.registrationData &&
      this.totalAmount > 0;
    return canProcess;
  }

  getAcademicTermDescription(termId: number): string {
    const academicTerms = [
      { Id: 1, Description: "Winter" },
      { Id: 2, Description: "Spring" },
      { Id: 3, Description: "Summer" },
      { Id: 4, Description: "Autumn" },
    ];
    const term = academicTerms.find(t => t.Id === termId);
    return term ? term.Description : `Term ${termId}`;
  }
}
