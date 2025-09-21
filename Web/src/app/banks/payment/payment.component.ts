import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PaymentService } from '../../services/payment.service';
import { PaymentOrderRequest, PaymentGatewayRequest } from '../../interfaces/payment.interface';
import { CustomNotificationService } from '../../services/custom-notification.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss']
})
export class PaymentComponent implements OnInit {
  paymentForm: FormGroup;
  isProcessing = false;
  paymentOrderId: string | null = null;
  today = new Date().toISOString().split('T')[0]; // For date input min value

  constructor(
    private fb: FormBuilder,
    private paymentService: PaymentService,
    private notificationService: CustomNotificationService,
    private router: Router
  ) {
    this.paymentForm = this.createForm();
  }

  ngOnInit(): void {
    // Initialize form or load existing payment order
  }

  private createForm(): FormGroup {
    return this.fb.group({
      studentCourseOfferingId: ['', Validators.required],
      academicTerm: [1, Validators.required],
      academicYear: [new Date().getFullYear(), Validators.required],
      numberOfCourses: [1, [Validators.required, Validators.min(1)]],
      totalAmount: [0, [Validators.required, Validators.min(0.01)]],
      currency: ['ETB', Validators.required],
      processingOption: [1, Validators.required], // 1 = Immediate, 2 = PayLater
      description: [''],
      // returnUrl removed - now uses configuration
      orderNumber: [{ value: '', disabled: true }], // Made readonly and disabled
      transactionId: [{ value: '', disabled: true }], // Made readonly and disabled
      paymentDueDate: [null],
      paymentExpiryDate: [null],
      maxPaymentAttempts: [3, [Validators.min(1), Validators.max(10)]]
    });
  }

  async createPaymentOrder(): Promise<void> {
    if (this.paymentForm.valid) {
      this.isProcessing = true;
      try {
        const request: PaymentOrderRequest = this.paymentForm.getRawValue(); // Use getRawValue to get disabled fields
        
        // TransactionId will be provided by the payment gateway
        // No local generation needed
        
        // Set default expiry date for pay later if not provided
        if (request.processingOption === 2 && !request.paymentExpiryDate) { // 2 = PayLater
          request.paymentExpiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
        }
        
        const response = await this.paymentService.createPaymentOrder(request).toPromise();
        
        if (response.status === 'success') {
          this.paymentOrderId = response.data.id;
          // Update form with generated order number
          this.paymentForm.patchValue({
            orderNumber: response.data.orderNumber
          });
          
          const processingOption = request.processingOption === 1 ? 'Pay Now' : 'Pay Later'; // 1 = Immediate
          this.notificationService.showSuccess(`Payment order created successfully (${processingOption})`);
          
          // If immediate payment, automatically process payment
          if (request.processingOption === 1) { // 1 = Immediate
            await this.processPayment();
          }
        } else {
          this.notificationService.showError(response.error || 'Failed to create payment order');
        }
      } catch (error) {
        this.notificationService.showError('An error occurred while creating payment order');
        console.error('Error creating payment order:', error);
      } finally {
        this.isProcessing = false;
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  async processPayment(): Promise<void> {
    if (!this.paymentOrderId) {
      this.notificationService.showError('Please create a payment order first');
      return;
    }

    this.isProcessing = true;
    try {
      const gatewayRequest: PaymentGatewayRequest = {
        paymentOrderId: this.paymentOrderId,
        amount: this.paymentForm.get('totalAmount')?.value,
        currency: this.paymentForm.get('currency')?.value,
        // returnUrl removed - now uses configuration
        description: this.paymentForm.get('description')?.value
      };

      const response = await this.paymentService.processPaymentOrder(
        this.paymentOrderId, 
        gatewayRequest
      ).toPromise();

      if (response.status === 'success' && response.data.success) {
        // TransactionId will be updated by the payment gateway
        // Show that payment is being processed
        this.notificationService.showInfo('Payment is being processed...');
        
        // Redirect to payment gateway
        if (response.data.redirectUrl) {
          window.location.href = response.data.redirectUrl;
        } else {
          this.notificationService.showSuccess('Payment processed successfully');
        }
      } else {
        this.notificationService.showError(response.data?.errorMessage || 'Failed to process payment');
      }
    } catch (error) {
      this.notificationService.showError('An error occurred while processing payment');
      console.error('Error processing payment:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  async checkPaymentStatus(): Promise<void> {
    if (!this.paymentOrderId) {
      this.notificationService.showError('No payment order to check');
      return;
    }

    try {
      const response = await this.paymentService.getPaymentOrderById(this.paymentOrderId).toPromise();
      
      if (response.status === 'success') {
        const paymentOrder = response.data;
        this.notificationService.showInfo(`Payment Status: ${this.paymentService.getPaymentStatusText(paymentOrder.status)}`);
      } else {
        this.notificationService.showError('Failed to get payment status');
      }
    } catch (error) {
      this.notificationService.showError('An error occurred while checking payment status');
      console.error('Error checking payment status:', error);
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.paymentForm.controls).forEach(key => {
      const control = this.paymentForm.get(key);
      control?.markAsTouched();
    });
  }

  resetForm(): void {
    this.paymentForm.reset();
    this.paymentOrderId = null;
  }

  get processingOptions() {
    return [
      { value: 1, label: 'Pay Now' }, // 1 = Immediate
      { value: 2, label: 'Pay Later' } // 2 = PayLater
    ];
  }

  get isPayLaterSelected(): boolean {
    return this.paymentForm.get('processingOption')?.value === 2; // 2 = PayLater
  }

  onProcessingOptionChange(): void {
    // Reset payment dates when switching options
    if (this.paymentForm.get('processingOption')?.value === 1) { // 1 = Immediate
      this.paymentForm.patchValue({
        paymentDueDate: null,
        paymentExpiryDate: null
      });
    } else {
      // Set default expiry date for pay later
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 7);
      this.paymentForm.patchValue({
        paymentExpiryDate: expiryDate
      });
    }
  }

  private generateProcessingTransactionId(): string {
    const originalTransactionId = this.paymentForm.get('transactionId')?.value || 'TXN_UNKNOWN';
    const now = new Date();
    const timestamp = now.getHours().toString().padStart(2, '0') +
                     now.getMinutes().toString().padStart(2, '0') +
                     now.getSeconds().toString().padStart(2, '0');
    return `${originalTransactionId}_PROCESSING_${timestamp}`;
  }
}
