import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PaymentService } from '../../../services/payment.service';
import { RegistrationPaymentRequest } from '../../../interfaces/payment.interface';
import { CustomNotificationService } from '../../../services/custom-notification.service';

@Component({
  selector: 'app-registration-payment',
  templateUrl: './registration-payment.component.html',
  styleUrls: ['./registration-payment.component.scss']
})
export class RegistrationPaymentComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  paymentForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  
  // Route parameters
  registrationId: string;
  batchCode: string;
  requestType: number;
  
  // Payment data
  selectedCourses: any[] = [];
  totalAmount = 0;
  currency = 'ETB';
  
  // Payment status
  currentPaymentOrder: any = null;
  isPaymentProcessing = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private paymentService: PaymentService,
    private notificationService: CustomNotificationService
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.registrationId = params['registrationid'];
        this.batchCode = params['code'];
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

  private initializeForm(): void {
    this.paymentForm = this.fb.group({
      studentId: ['', Validators.required],
      academicTerm: [1, Validators.required],
      academicYear: [new Date().getFullYear(), Validators.required],
      totalAmount: [0, [Validators.required, Validators.min(0.01)]],
      currency: ['ETB', Validators.required],
      description: ['']
    });
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
      
      // Load registration details and calculate payment
      const response = await this.paymentService.getRegistrationPaymentStatus(this.registrationId).toPromise();
      
      if (response.status === 'success' && response.data) {
        const data = response.data;
        
        // Populate form with registration data
        this.paymentForm.patchValue({
          studentId: data.registration?.studentId,
          academicTerm: data.registration?.academicTerm || 1,
          academicYear: data.registration?.academicYear || new Date().getFullYear(),
          totalAmount: data.registration?.totalAmount || 0,
          description: this.generateDescription(data.registration)
        });
        
        this.selectedCourses = data.registration?.selectedCourses || [];
        this.totalAmount = data.registration?.totalAmount || 0;
        this.currentPaymentOrder = data.paymentOrder;
        
        // Check if payment is already completed
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

  private generateDescription(registration: any): string {
    const termNames = {
      1: 'First Semester',
      2: 'Second Semester',
      3: 'Summer'
    };
    
    const termName = termNames[registration?.academicTerm] || 'Term';
    const courseCount = this.selectedCourses.length;
    
    return `${termName} ${registration?.academicYear} Course Registration (${courseCount} courses)`;
  }

  async processPayment(): Promise<void> {
    if (this.paymentForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isPaymentProcessing = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      const request: RegistrationPaymentRequest = {
        studentCourseOfferingId: this.registrationId,
        studentId: this.paymentForm.get('studentId')?.value,
        batchCode: this.batchCode,
        academicTerm: this.paymentForm.get('academicTerm')?.value,
        academicYear: this.paymentForm.get('academicYear')?.value,
        selectedCourses: this.selectedCourses,
        totalAmount: this.paymentForm.get('totalAmount')?.value,
        currency: this.paymentForm.get('currency')?.value,
        description: this.paymentForm.get('description')?.value
      };

      const response = await this.paymentService.processRegistrationPayment(request).toPromise();

      if (response.success && response.data) {
        this.successMessage = 'Payment initiated successfully. Redirecting to payment gateway...';
        
        // Redirect to payment gateway
        if (response.data.redirectUrl) {
          this.paymentService.redirectToPaymentGateway(response.data.redirectUrl);
        } else {
          this.errorMessage = 'No redirect URL received from payment gateway';
        }
      } else {
        this.errorMessage = response.message || 'Failed to initiate payment';
      }
    } catch (error) {
      this.errorMessage = 'Error processing payment: ' + error.message;
    } finally {
      this.isPaymentProcessing = false;
    }
  }

  async retryPayment(): Promise<void> {
    if (this.currentPaymentOrder) {
      await this.processPayment();
    }
  }

  async checkPaymentStatus(): Promise<void> {
    try {
      this.isLoading = true;
      
      const response = await this.paymentService.getRegistrationPaymentStatus(this.registrationId).toPromise();
      
      if (response.status === 'success' && response.data) {
        const data = response.data;
        this.currentPaymentOrder = data.paymentOrder;
        
        if (data.isPaid) {
          this.successMessage = 'Payment completed successfully!';
          this.router.navigate(['/registration/success'], {
            queryParams: { registrationId: this.registrationId }
          });
        } else if (data.canRetryPayment) {
          this.errorMessage = 'Payment is pending or failed. You can retry the payment.';
        } else {
          this.errorMessage = 'Payment cannot be retried. Please contact support.';
        }
      } else {
        this.errorMessage = response.error || 'Failed to check payment status';
      }
    } catch (error) {
      this.errorMessage = 'Error checking payment status: ' + error.message;
    } finally {
      this.isLoading = false;
    }
  }

  goBack(): void {
    this.router.navigate(['/students/course-registration']);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.paymentForm.controls).forEach(key => {
      const control = this.paymentForm.get(key);
      control?.markAsTouched();
    });
  }

  formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  get canProcessPayment(): boolean {
    return this.paymentForm.valid && !this.isPaymentProcessing && !this.isLoading;
  }

  get canRetryPayment(): boolean {
    return this.currentPaymentOrder && 
           this.currentPaymentOrder.paymentAttempts < this.currentPaymentOrder.maxPaymentAttempts &&
           !this.currentPaymentOrder.isPaid;
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



