import { Component, OnInit } from '@angular/core';
import { BankService } from '../services/bank.service';
import { PendingStudentPaymentModel } from '../models/pending-sudent-payment.model';
import { Router } from '@angular/router';
import { StudentService } from 'src/app/students/services/student.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-pending-payment-list',
  templateUrl: './pending-payment-list.component.html',
  styleUrls: ['./pending-payment-list.component.scss']
})
export class PendingPaymentListComponent implements OnInit {
  applicantUserId: string;
  listOfPendingPayments: PendingStudentPaymentModel[] = [];
  isLoading = false;

  constructor(
    private _studentService: StudentService,
    private _route: Router
  ) {
    this.applicantUserId = localStorage.getItem('userId');
    if (this.applicantUserId) {
      this.getStudentCoursePendingPayment();
    } else {
      console.error('User ID not found in session storage');
    }
  }

  ngOnInit(): void {}

 getStudentCoursePendingPayment() {
  this.isLoading = true;

  forkJoin([
    this._studentService.getStudentCoursePendingPayment(this.applicantUserId),
    this._studentService.getStudentCourseAddPendingPayment(this.applicantUserId)
  ]).subscribe(
    ([pendingPayments, addPendingPayments]) => {
      this.listOfPendingPayments = [
        ...pendingPayments,
        ...addPendingPayments
      ].map(payment => ({
        ...payment,
        isProcessing: false
      }));
      this.isLoading = false;
    },
    (error) => {
      console.error('Error fetching pending payments:', error);
      this.isLoading = false;
    }
  );
}

  goToPaymentPage(data: PendingStudentPaymentModel) {
    data.isProcessing = true;
    this._route.navigateByUrl(`banks/add-student-payment?registrationid=${data.id}&code=${data.batchCode}&type=${data.requestType}`);
  }

  getTotalAmount() {
    return this.listOfPendingPayments.reduce(
      (total, data) => total + data.totalPayment,
      0
    );
  }
}
