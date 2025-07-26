import { Component } from '@angular/core';

@Component({
  selector: 'app-payment-instructions',
  templateUrl: './payment-instructions.component.html',
  styleUrls: ['./payment-instructions.component.scss']
})
export class PaymentInstructionsComponent {
  instructions = [
    {
      number: 1,
      title: 'Select Payment',
      description: 'Click the "Payment" button next to the course registration you want to pay for.'
    },
    {
      number: 2,
      title: 'Enter Bank Details',
      description: 'Fill in your bank transaction details including the bank name, transaction ID, and date.'
    },
    {
      number: 3,
      title: 'Upload Receipt',
      description: 'Upload a clear image or PDF of your payment receipt as proof of payment.'
    },
    {
      number: 4,
      title: 'Submit Payment',
      description: 'Review your payment details and submit. Your payment will be verified by the finance office.'
    }
  ];
} 