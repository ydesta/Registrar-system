import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PaymentService } from '../../../services/payment.service';
import { CustomNotificationService } from '../../../services/custom-notification.service';
import { ResponseDtos } from 'src/app/interfaces/payment.interface';

@Component({
  selector: 'app-payment-callback',
  templateUrl: './payment-callback.component.html',
  styleUrls: ['./payment-callback.component.scss']
})
export class PaymentCallbackComponent implements OnInit {
  isProcessing = true;
  paymentStatus: 'success' | 'error' | 'pending' = 'pending';
  message = 'Processing payment...';
  orderId: string | null = null;
  isLoading = false;
  isCheckingStatus = false;
  isHandlingCallback = false;

  // Data
  orderNumber: string = '';
  gatewayResponse: string = '';
  callbackResult: any = null;

  // Messages
  errorMessage = '';
  successMessage = '';
  infoMessage = '';
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private paymentService: PaymentService,
    private notificationService: CustomNotificationService
  ) { }

  ngOnInit(): void {
    this.checkOrderStatusAndHandleCallback();
  }

  private async processCallback(): Promise<void> {
    try {
      this.route.queryParams.subscribe(async params => {
        const orderId = params['orderNumber'] || params['orderNumber'];
        const status = params['status'] || params['result'];
        const message = params['message'] || params['description'] || '';

        if (!orderId) {
          this.paymentStatus = 'error';
          this.message = 'No order ID provided in callback';
          this.isProcessing = false;
          return;
        }

        this.orderId = orderId;

        // Process the callback
        const response = await this.paymentService.handleRegistrationPaymentCallback(
          orderId,
          status || 'unknown',
          message
        ).toPromise();

        if (response.status === 'success' && response.data) {
          this.paymentStatus = 'success';
          this.message = 'Payment processed successfully!';
          this.notificationService.showSuccess('Payment completed successfully');

          // Redirect to registration success page
          setTimeout(() => {
            this.router.navigate(['/banks/registration/success'], {
              queryParams: {
                registrationId: response.data.registrationId,
                paymentMethod: 'gateway'
              }
            });
          }, 2000);
        } else {
          this.paymentStatus = 'error';
          this.message = response.error || 'Payment processing failed';
          this.notificationService.showError(this.message);

          // Redirect to registration payment options page
          setTimeout(() => {
            this.router.navigate(['/banks/registration/payment-options'], {
              queryParams: {
                registrationid: orderId,
                error: this.message
              }
            });
          }, 2000);
        }

        this.isProcessing = false;
      });
    } catch (error) {
      this.paymentStatus = 'error';
      this.message = 'An error occurred while processing the payment';
      this.isProcessing = false;
      this.notificationService.showError('Payment processing failed');
      console.error('Error processing payment callback:', error);
    }
  }

  goToPayment(): void {
    this.router.navigate(['/banks/payment']);
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
  async checkOrderStatusAndHandleCallback(): Promise<void> {
    try {
      this.route.queryParams.subscribe(async params => {
        const orderId = 'a9bf4b34-fabc-4a5b-8008-4923f85c6026'; //params['orderNumber'] || params['orderNumber'];
        if (!orderId) {
          this.paymentStatus = 'error';
          this.message = 'No order ID provided in callback';
          this.isProcessing = false;
          return;
        }

        this.orderNumber = orderId;
        const response: ResponseDtos = await this.paymentService.checkOrderStatusAndHandleCallback(this.orderNumber).toPromise();

        if (response.status === 'success' && response.data) {
          this.callbackResult = response.data;

          if (response.data.isPaymentSuccessful) {
            this.successMessage = 'Payment successful! Registration has been processed.';
            this.notificationService.showSuccess(this.successMessage);

            if (response.data.registration?.id) {
              setTimeout(() => {
                this.router.navigate(['/students/manage-student-course-registration'], {
                  queryParams: { registrationId: response.data.registration.id }
                });
              }, 2000);
            }
          } else {
            this.infoMessage = `Payment status: ${response.data.status} - ${response.data.message}`;
            this.notificationService.notification("", "", this.infoMessage);
          }
          this.gatewayResponse = response.data.gatewayResponse || 'No gateway response';
        } else {
          this.errorMessage = response.error || 'Failed to check order status and handle callback';
          this.notificationService.showError(this.errorMessage);
        }
      });
    } catch (error) {
      this.errorMessage = 'An error occurred while checking order status: ' + error.message;
      this.notificationService.showError(this.errorMessage);
    } finally {
      this.isHandlingCallback = false;
    }
  }
}
