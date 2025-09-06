import { Component, OnInit, TrackByFunction, OnDestroy } from '@angular/core';
import { BankService } from '../services/bank.service';
import { PendingStudentPaymentModel } from '../models/pending-sudent-payment.model';
import { Router } from '@angular/router';
import { StudentService } from 'src/app/students/services/student.service';
import { forkJoin, Subject } from 'rxjs';
import { takeUntil, finalize, catchError } from 'rxjs/operators';

@Component({
  selector: 'app-pending-payment-list',
  templateUrl: './pending-payment-list.component.html',
  styleUrls: ['./pending-payment-list.component.scss']
  // Temporarily removed OnPush to fix router issue
})
export class PendingPaymentListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
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
  this.listOfPendingPayments = []; // Clear existing data

  forkJoin([
    this._studentService.getStudentCoursePendingPayment(this.applicantUserId),
    this._studentService.getStudentCourseAddPendingPayment(this.applicantUserId)
  ]).pipe(
    takeUntil(this.destroy$),
    finalize(() => {
      this.isLoading = false;
    }),
    catchError((error) => {
      console.error('Error fetching pending payments:', error);
      this.listOfPendingPayments = [];
      return [];
    })
  ).subscribe(([pendingPayments, addPendingPayments]) => {
    // Ensure we have arrays to work with
    const regularPayments = Array.isArray(pendingPayments) ? pendingPayments : [];
    const addPayments = Array.isArray(addPendingPayments) ? addPendingPayments : [];
    
    this.listOfPendingPayments = [
      ...regularPayments,
      ...addPayments
    ].map(payment => ({
      ...payment,
      isProcessing: false
    }));
  });
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

  // TrackBy functions for better performance
  trackByPaymentId: TrackByFunction<PendingStudentPaymentModel> = (index: number, payment: PendingStudentPaymentModel) => 
    payment?.id || index;

  trackByIndex: TrackByFunction<any> = (index: number) => index;

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
