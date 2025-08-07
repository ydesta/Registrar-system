import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { StaticData } from 'src/app/admission-request/model/StaticData';
import { CrudService } from 'src/app/services/crud.service';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';
import { BankService } from '../services/bank.service';
import { StudentPaymentRequest } from '../models/student-payment-request.model';
import { StudentService } from 'src/app/students/services/student.service';
import { CourseBreakDownOffering } from 'src/app/students/models/course-break-down-offering.model';
import { ACADEMIC_TERM_STATUS, BANK_TO } from 'src/app/common/constant';
import { NzModalService } from 'ng-zorro-antd/modal';
import { PaymentModalComponent } from './payment-modal/payment-modal.component';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-add-student-payment',
  templateUrl: './add-student-payment.component.html',
  styleUrls: ['./add-student-payment.component.scss']
})
export class AddStudentPaymentComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  action = 'Add Student Payment';
  bankTransactionForm: FormGroup;
  courses: any;
  students: any;
  bankTransactions: any;
  studentRegistrations: any;
  progStatusId: string;
  submit = 'Submit';
  listOfBankTo: StaticData[] = [];
  banks: any;
  courseRegistrationId: string;
  batchCode: string;
  courseList: CourseBreakDownOffering[] = [];
  selectedFile: File | null = null;
  requestType: number;
  listOfTermNumber: StaticData[] = [];
  nextAcademicTerm: any;
  private modalShown = false;

  constructor(
    public aciveRoute: ActivatedRoute,
    private _route: Router,
    private _fb: FormBuilder,
    private bankService: BankService,
    private _studentService: StudentService,
    private _customNotificationService: CustomNotificationService,
    private modal: NzModalService
  ) {
    this.aciveRoute.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((p: any) => {
        this.courseRegistrationId = p.registrationid;
        this.batchCode = p.code;
        if (p.type == 'Add Request') {
          this.requestType = 2;
        }
        else if (p.type == 'Semester') {
          this.requestType = 0;
        }
      });

    this.getListOfAcademicTermStatus();
    this.paymentForm();
  }

  ngOnInit(): void {
    if (this.requestType != undefined) {
      this.getListOfRegisteredCourses(this.courseRegistrationId, this.batchCode, this.requestType);
    }
    this.getListOfBanks();
    this.getListOfOfToBank();
    if (this.progStatusId != "null") {
      this.getstudentPymentById(this.progStatusId);
    }

    const next = sessionStorage.getItem('nextAcademicTerm');
    this.nextAcademicTerm = next ? JSON.parse(next) : null;
    const termDescription = `${this.getAcademicTermStatusDescription(this.nextAcademicTerm.termId)} ${this.nextAcademicTerm.year}`;

    // Show payment confirmation dialog only once
    if (!this.modalShown) {
      this.showPaymentConfirmation(termDescription);
      this.modalShown = true;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private showPaymentConfirmation(termDescription: string): void {
    setTimeout(() => {
      this.modal.confirm({
        nzTitle: `<div style="text-align: center; font-size: 20px; color: #1890ff; margin-bottom: 16px;">${termDescription} Registration Payment</div>`,
        nzContent: `
          <div style="font-size: 14px; line-height: 1.6; padding: 16px; background-color: #f8f9fa; border-radius: 8px; max-width: 600px; margin: 0 auto;">
            <div style="text-align: center; margin-bottom: 20px;">
              <span nz-icon nzType="check-circle" style="color: #52c41a; font-size: 48px;"></span>
            </div>
            
            <div style="background-color: white; padding: 16px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e8e8e8;">
              <p style="font-weight: 500; color: #262626; margin-bottom: 16px;">To complete your ${termDescription} registration, please follow these steps:</p>
              <ol style="padding-left: 20px; margin: 0;">
                <li style="margin-bottom: 12px; display: flex; align-items: center;">
                  <span nz-icon nzType="bank" style="color: #1890ff; margin-right: 8px;"></span>
                  Kindly proceed with the payment via mobile transfer or by visiting the bank
                </li>
                <li style="margin-bottom: 12px; display: flex; align-items: center;">
                  <span nz-icon nzType="camera" style="color: #1890ff; margin-right: 8px;"></span>
                  Take a screenshot or download your payment receipt
                </li>
                <li style="margin-bottom: 12px; display: flex; align-items: center;">
                  <span nz-icon nzType="check-square" style="color: #1890ff; margin-right: 8px;"></span>
                  Click the Payment button
                </li>
                <li style="margin-bottom: 12px; display: flex; align-items: center;">
                  <span nz-icon nzType="form" style="color: #1890ff; margin-right: 8px;"></span>
                  Fill in your bank transfer details
                </li>
                <li style="margin-bottom: 12px; display: flex; align-items: center;">
                  <span nz-icon nzType="upload" style="color: #1890ff; margin-right: 8px;"></span>
                  Upload your payment receipt
                </li>
                <li style="margin-bottom: 12px; display: flex; align-items: center;">
                  <span nz-icon nzType="check-circle" style="color: #1890ff; margin-right: 8px;"></span>
                  Submit your payment information
                </li>
              </ol>
            </div>

            <div style="background-color: #e6f7ff; padding: 12px; border-radius: 4px; border: 1px solid #91d5ff;">
              <p style="margin: 0; color: #1890ff; display: flex; align-items: center;">
                <span nz-icon nzType="info-circle" style="margin-right: 8px;"></span>
                <span>Please ensure you have your payment receipt ready before proceeding.</span>
              </p>
            </div>

            <div style="text-align: center; margin-top: 20px; color: #595959;">
              <p style="margin: 0; font-weight: 500;">Thank you for your cooperation!</p>
            </div>
          </div>
        `,
        nzOkText: 'OK',
        nzCancelText: null,
        nzOkType: 'primary',
        nzWidth: 700,
        nzCentered: true,
        nzMaskClosable: false,
        nzClosable: false,
        nzOnOk: () => {
          // User acknowledged the instructions
        }
      });
    }, 100);
  }

  getListOfBanks() {
    this.bankService.getBankList().subscribe((res: any) => {
      this.banks = res.data;
    });
  }
  getAcademicTermStatusDescription(Id: any) {
    const program = this.listOfTermNumber.find((item) => item.Id == Id);
    return program ? program.Description : '';
  }
  getListOfAcademicTermStatus() {
    let division: StaticData = new StaticData();
    ACADEMIC_TERM_STATUS.forEach((pair) => {
      division = {
        Id: pair.Id.toString(),
        Description: pair.Description,
      };
      this.listOfTermNumber.push(division);
    });
  }
  getstudentPymentById(id: string) {
    this.action = "Add Semester Registration Payment";
    this.submit = 'Update';
    this.bankService.getstudentPymentById(id).subscribe((res: any) => {
      this.patchValues(res.data);
    });
  }

  paymentForm() {
    this.bankTransactionForm = this._fb.group({
      fromBank: ['', Validators.required],
      toBank: ['', Validators.required],
      transactionDate: ['', Validators.required],
      remark: ['', []],
      bankTransactionID: [null, Validators.required],
      amount: [{ value: 0, readonly: false }, Validators.required],
      attachment: [null, Validators.required]
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

  private getStudentPayment(): StudentPaymentRequest {
    const formModel = this.bankTransactionForm.getRawValue();
    const payment = new StudentPaymentRequest();
    // payment.id = this.progStatusId == undefined ? null : this.progStatusId;
    payment.parentId = this.courseRegistrationId;
    payment.fromBank = formModel.fromBank;
    payment.toBank = formModel.toBank;
    payment.transactionDate = new Date(formModel.transactionDate).toISOString();
    payment.remark = formModel.remark;
    payment.bankTransactionID = formModel.bankTransactionID;
    payment.amount = formModel.amount;
    return payment;
  }

  patchValues(data: any) {
    this.bankTransactionForm.patchValue({
      fromBank: data.fromBank,
      toBank: data.toBank,
      transactionDate: data.transactionDate,
      remark: data.remark,
      bankTransactionID: data.bankTransactionID,
      amount: data.amount
    });
  }

  submitForm() {
    if (this.bankTransactionForm.valid) {
      const formData = new FormData();
      const payment = this.getStudentPayment();

      for (const key in payment) {
        if (Object.prototype.hasOwnProperty.call(payment, key)) {
          formData.append(key, (payment as any)[key]);
        }
      }

      if (this.selectedFile) {
        formData.append('attachment', this.selectedFile);
      }

      this.bankService.create(formData).subscribe((res: any) => {
        this._customNotificationService.notification('success', 'Success', res.data);
        this._route.navigateByUrl('students/manage-student-course-registration');
      });
    } else {
      this._customNotificationService.notification('error', 'error', 'Enter valid data.');
    }
  }

  getListOfRegisteredCourses(regId: string, code: string, type: number) {
    this._studentService.getStudentRegisteredCourse(regId, code, type)
      .subscribe((res: any) => {
        this.courseList = res;
      });
  }

  getTotalCreditHours() {
    return this.courseList.reduce(
      (total, data) => total + data.creditHours,
      0
    );
  }

  getTotalAmount() {
    return this.courseList.reduce(
      (total, data) => total + data.totalAmount,
      0
    );
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

  openPaymentModal() {
    const modalRef = this.modal.create({
      nzContent: PaymentModalComponent,
      nzWidth: 800,
      nzCentered: true,
      nzComponentParams: {
        studentCourseRegistrationID: this.courseRegistrationId,
        totalAmount: this.getTotalAmount(),
        type: this.requestType,
      },
      nzFooter: null
    });

    modalRef.afterClose.subscribe(result => {
      if (result) {
        // Show success confirmation dialog
        this.modal.success({
          nzTitle: '<div style="text-align: center; font-size: 24px; color: #52c41a; margin-bottom: 24px; font-weight: 600;">Registration Successfully Completed!</div>',
          nzContent: `
            <div style="text-align: center; padding: 24px; background-color: #f6ffed; border-radius: 8px;">
              <div style="margin-bottom: 24px;">
                <span nz-icon nzType="check-circle" style="color: #52c41a; font-size: 64px;"></span>
              </div>
              <div style="background-color: white; padding: 24px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                <p style="margin: 0; font-size: 18px; color: #262626; font-weight: 500; line-height: 1.6;">
                  Your registration and payment have been successfully Completed.
                </p>
              </div>
            </div>
          `,
          nzOkText: 'OK',
          nzOkType: 'primary',
          nzCentered: true,
          nzMaskClosable: false,
          nzClosable: false,
          nzWidth: 600,
          nzOnOk: () => {
            this._route.navigateByUrl('students/manage-student-course-registration');
          }
        });
      }
    });
  }

  goBack(): void {
    this._route.navigateByUrl('students/manage-student-course-registration');
  }
}
