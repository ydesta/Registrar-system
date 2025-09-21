import { Component, OnInit } from '@angular/core';
import { PaymentService } from '../../services/payment.service';
import { PaymentOrderRequest, PaymentGatewayRequest, PaymentOrder } from '../../interfaces/payment.interface';
import { Router } from '@angular/router';

@Component({
  selector: 'app-standalone-payment',
  templateUrl: './standalone-payment.component.html',
  styleUrls: ['./standalone-payment.component.scss']
})
export class StandalonePaymentComponent implements OnInit {
  
  // Payment form data
  paymentOrderRequest: PaymentOrderRequest = {
    studentCourseOfferingId: '',
    academicTerm: 1,
    academicYear: 2024,
    numberOfCourses: 1,
    totalAmount: 0,
    currency: 'ETB',
    processingOption: 0,
    description: '',
    maxPaymentAttempts: 3
  };

  paymentGatewayRequest: PaymentGatewayRequest = {
    paymentOrderId: '',
    amount: 0,
    currency: 'ETB',
    description: ''
  };

  // UI state
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  currentPaymentOrder: PaymentOrder | null = null;
  
  // Academic terms (matching Common.Enum.AcademicTerm)
  academicTerms = [
    { Id: 1, Description: "Winter" },  
    { Id: 2, Description: "Spring" },
    { Id: 3, Description: "Summer" },
    { Id: 4, Description: "Autumn" }, 
  ];

  constructor(
    private paymentService: PaymentService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Initialize with sample data or load from route parameters
    this.loadPaymentData();
  }

  private loadPaymentData(): void {
    // This would typically load data from route parameters or a service
    // For example, from course registration or student dashboard
    this.paymentOrderRequest = {
      studentCourseOfferingId: 'sample-course-offering-id',
      academicTerm: 1,
      academicYear: 2024,
      numberOfCourses: 3,
      totalAmount: 1500.00,
      currency: 'ETB',
      processingOption: 0,
      description: 'Semester tuition fee payment',
      maxPaymentAttempts: 3
    };

    this.paymentGatewayRequest.amount = this.paymentOrderRequest.totalAmount;
    this.paymentGatewayRequest.currency = this.paymentOrderRequest.currency;
    this.paymentGatewayRequest.description = this.paymentOrderRequest.description;
  }

  /**
   * Step 1 & 2: Create payment order and redirect to payment gateway
   */
  async initiatePayment(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      // Call the complete payment flow service
      const completeFlowRequest = {
        orderRequest: this.paymentOrderRequest,
        gatewayRequest: this.paymentGatewayRequest
      };
      const response = await this.paymentService.processCompletePaymentFlow(completeFlowRequest).toPromise();

      if (response.status === 'success' && response.data) {
        this.currentPaymentOrder = response.data.paymentOrder;
        this.successMessage = 'Payment order created successfully. Redirecting to payment gateway...';
        
        // Step 2: Redirect to payment gateway
        if (response.data.redirectUrl) {
          this.paymentService.redirectToPaymentGateway(response.data.redirectUrl);
        } else {
          this.errorMessage = 'No redirect URL received from payment gateway';
        }
      } else {
        this.errorMessage = response.error || 'Failed to create payment order';
      }
    } catch (error) {
      this.errorMessage = 'An error occurred while processing payment: ' + error.message;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Step 3: Handle payment callback (typically called by payment gateway)
   * This method would be called when the user returns from the payment gateway
   */
  async handlePaymentCallback(orderId: string, status: string, message: string): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      const response = await this.paymentService.handlePaymentCallback(
        orderId,
        status,
        message
      ).toPromise();

      if (response.status === 'success' && response.data) {
        this.currentPaymentOrder = response.data.paymentOrder;
        
        // Step 4: Redirect to appropriate page based on payment result
        if (response.data.isPaymentSuccessful) {
          this.successMessage = 'Payment completed successfully!';
          this.router.navigate([response.data.redirectUrl]);
        } else {
          this.errorMessage = 'Payment failed. Please try again.';
          this.router.navigate([response.data.redirectUrl]);
        }
      } else {
        this.errorMessage = response.error || 'Failed to process payment callback';
      }
    } catch (error) {
      this.errorMessage = 'An error occurred while processing payment callback: ' + error.message;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Check payment order status
   */
  async checkPaymentStatus(paymentOrderId: string): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      const response = await this.paymentService.getPaymentOrderStatus(paymentOrderId).toPromise();

      if (response.status === 'success' && response.data) {
        this.currentPaymentOrder = response.data.paymentOrder;
        
        if (response.data.isPaid) {
          this.successMessage = 'Payment is completed!';
          this.router.navigate([response.data.redirectUrl]);
        } else if (response.data.canRetryPayment) {
          this.errorMessage = 'Payment is pending or failed. You can retry the payment.';
        } else {
          this.errorMessage = 'Payment cannot be retried. Please contact support.';
        }
      } else {
        this.errorMessage = response.error || 'Failed to get payment status';
      }
    } catch (error) {
      this.errorMessage = 'An error occurred while checking payment status: ' + error.message;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Retry payment for failed orders
   */
  async retryPayment(): Promise<void> {
    if (this.currentPaymentOrder) {
      this.paymentGatewayRequest.paymentOrderId = this.currentPaymentOrder.id;
      await this.initiatePayment();
    }
  }

  /**
   * Cancel payment
   */
  cancelPayment(): void {
    this.currentPaymentOrder = null;
    this.errorMessage = '';
    this.successMessage = '';
  }

  /**
   * Format currency for display
   */
  formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  /**
   * Get payment status text
   */
  getPaymentStatusText(status: number): string {
    return this.paymentService.getPaymentStatusText(status);
  }

  /**
   * Get payment order status text
   */
  getPaymentOrderStatusText(status: number): string {
    return this.paymentService.getPaymentOrderStatusText(status);
  }

  /**
   * Get academic term description
   */
  getAcademicTermDescription(termId: number): string {
    const term = this.academicTerms.find(t => t.Id === termId);
    return term ? term.Description : `Term ${termId}`;
  }
}