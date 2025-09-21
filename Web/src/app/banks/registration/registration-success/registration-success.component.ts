import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PaymentService } from '../../../services/payment.service';
import { CustomNotificationService } from '../../../services/custom-notification.service';

@Component({
  selector: 'app-registration-success',
  templateUrl: './registration-success.component.html',
  styleUrls: ['./registration-success.component.scss']
})
export class RegistrationSuccessComponent implements OnInit {
  registrationId: string;
  paymentMethod: string;
  orderId: string;
  status: string;
  registrationData: any;
  isLoading = true;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private paymentService: PaymentService,
    private notificationService: CustomNotificationService
  ) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.registrationId = params['registrationId'];
      this.paymentMethod = params['paymentMethod'] || 'gateway';
      this.orderId = params['orderId'];
      this.status = params['status'];
      
      if (this.registrationId) {
        this.loadUpdatedRegistrationData();
      } else {
        this.isLoading = false;
      }
    });
  }

  async loadUpdatedRegistrationData(): Promise<void> {
    try {
      // Get updated registration status
      const response = await this.paymentService.getRegistrationPaymentStatus(this.registrationId).toPromise();
      
      if (response.status === 'success' && response.data) {
        this.registrationData = response.data;
      }
    } catch (error) {
      this.notificationService.showError('Could not load updated registration data');
    } finally {
      this.isLoading = false;
    }
  }

  goToDashboard(): void {
    this.router.navigate(['/students/dashboard']);
  }

  goToRegistration(): void {
    this.router.navigate(['/students/course-registration']);
  }

  getPaymentMethodText(): string {
    return this.paymentMethod === 'receipt' ? 'Receipt Upload' : 'EthSwitch Gateway';
  }
}
