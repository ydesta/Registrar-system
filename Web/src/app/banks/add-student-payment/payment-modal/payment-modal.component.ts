import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { StaticData } from 'src/app/admission-request/model/StaticData';
import { BankService } from '../../services/bank.service';
import { StudentPaymentRequest } from '../../models/student-payment-request.model';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';
import { Router } from '@angular/router';
import { BANK_TO } from 'src/app/common/constant';

@Component({
  selector: 'app-payment-modal',
  templateUrl: './payment-modal.component.html',
  styleUrls: ['./payment-modal.component.scss']
})
export class PaymentModalComponent implements OnInit {
  bankTransactionForm: FormGroup;
  listOfBankTo: StaticData[] = [];
  banks: any;
  selectedFile: File | null = null;
  studentCourseRegistrationID: string;
  totalAmount: number;
  type: number;
  paidFor: number = 0;
  shouldNavigate: boolean = true; // New parameter to control navigation
  constructor(
    private modalRef: NzModalRef,
    private _fb: FormBuilder,
    private bankService: BankService,
    private _customNotificationService: CustomNotificationService,
    private _route: Router
  ) {
    // Get the data passed to the modal
    const data = this.modalRef.getConfig().nzComponentParams;
    this.studentCourseRegistrationID = data['studentCourseRegistrationID'];
    this.totalAmount = data['totalAmount'];
    this.type = data['type'];
    this.paidFor = data['paidFor'];
    this.shouldNavigate = data['shouldNavigate'] !== undefined ? data['shouldNavigate'] : true; // Default to true for backward compatibility
    console.log("###       ", this.studentCourseRegistrationID, this.totalAmount, this.type, this.paidFor, this.shouldNavigate);
    this.paymentForm();
  }

  ngOnInit(): void {
    this.getListOfBanks();
    this.getListOfOfToBank();
  }

  getListOfBanks() {
    this.bankService.getBankList().subscribe((res: any) => {
      this.banks = res.data;
    });
  }

  getListOfOfToBank() {
    let bank: StaticData = new StaticData();
    BANK_TO.forEach(pair => {
      bank = {
        Id: pair.Id,
        Description: pair.Description
      };
      this.listOfBankTo.push(bank);
    });
  }

  paymentForm() {
    this.bankTransactionForm = this._fb.group({
      fromBank: [null, []],
      toBank: [1, []], // Set Dashen Account (Id: 1) as default
      transactionDate: [new Date(), Validators.required],
      remark: ['', []],
      bankTransactionID: [null, Validators.required],
      amount: [{ value: this.totalAmount, disabled: true }, Validators.required],
      attachment: [null, Validators.required],
      type: [this.type],
      acceptPolicy: [false, Validators.requiredTrue]
    });
  }

  private getStudentPayment(): StudentPaymentRequest {
    const formModel = this.bankTransactionForm.getRawValue();
    const payment = new StudentPaymentRequest();
    payment.parentId = this.studentCourseRegistrationID;
    payment.fromBank = formModel.fromBank !== null && formModel.fromBank !== undefined && formModel.fromBank !== '' ? formModel.fromBank : null;
    payment.toBank = formModel.toBank !== null && formModel.toBank !== undefined && formModel.toBank !== '' ? formModel.toBank : null;
    payment.transactionDate = new Date(formModel.transactionDate).toISOString();
    payment.remark = formModel.remark;
    payment.bankTransactionID = formModel.bankTransactionID;
    payment.amount = formModel.amount;
    payment.type = this.type;
    payment.paidFor = this.paidFor;
    return payment;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      if (allowedTypes.includes(file.type)) {
        this.selectedFile = file;
        this.bankTransactionForm.patchValue({
          attachment: this.selectedFile
        });
        this.bankTransactionForm.get('attachment')?.updateValueAndValidity();
      } else {
        this.selectedFile = null;
        this.bankTransactionForm.get('attachment')?.setErrors({ invalidType: true });
        alert('Only images (JPEG, PNG) and PDFs are allowed.');
      }
    }
  }

  submitForm() {
    if (this.bankTransactionForm.valid) {
      const formData = new FormData();
      const payment = this.getStudentPayment();

      for (const key in payment) {
        if (Object.prototype.hasOwnProperty.call(payment, key)) {
          const value = (payment as any)[key];
          // Only append non-null and non-undefined values
          if (value !== null && value !== undefined && value !== '') {
            formData.append(key, value);
          }
        }
      }

      if (this.selectedFile) {
        formData.append('attachment', this.selectedFile);
      }

      this.bankService.create(formData).subscribe((res: any) => {
        this._customNotificationService.notification('success', 'Success', res.data);
        this.modalRef.close(true);
        if (this.shouldNavigate) {
          this._route.navigateByUrl('students/manage-student-course-registration');
        }
      });
    } else {
      this._customNotificationService.notification('error', 'error', 'Enter valid data.');
    }
  }

  closeModal() {
    this.modalRef.close();
  }
} 