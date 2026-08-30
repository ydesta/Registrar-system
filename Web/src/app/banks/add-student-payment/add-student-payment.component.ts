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
import { PaymentService } from 'src/app/services/payment.service';
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
  orderNumber: string;
  courseList: CourseBreakDownOffering[] = [];
  selectedFile: File | null = null;
  requestType: number;
  listOfTermNumber: StaticData[] = [];
  nextAcademicTerm: any;
  penaltyAmount = 0;
  isLateRegistration = false;

  constructor(
    public aciveRoute: ActivatedRoute,
    private _route: Router,
    private _fb: FormBuilder,
    private bankService: BankService,
    private _studentService: StudentService,
    private _customNotificationService: CustomNotificationService,
    private modal: NzModalService,
    private paymentService: PaymentService
  ) {
    this.aciveRoute.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((p: any) => {
        this.courseRegistrationId = p.registrationid;
        this.batchCode = p.code;
        this.orderNumber = p.orderNumber || '';
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
    this.loadLatePenalty();
    this.getListOfBanks();
    this.getListOfOfToBank();
    if (this.progStatusId != "null") {
      this.getstudentPymentById(this.progStatusId);
    }

    const next = sessionStorage.getItem('nextAcademicTerm');
    this.nextAcademicTerm = next ? JSON.parse(next) : null;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
    payment.fromBank = formModel.fromBank !== null && formModel.fromBank !== undefined && formModel.fromBank !== '' ? formModel.fromBank : null;
    payment.toBank = formModel.toBank !== null && formModel.toBank !== undefined && formModel.toBank !== '' ? formModel.toBank : null;
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

  getPenaltyAmount() {
    if (this.requestType !== 0 || !this.isLateRegistration) {
      return 0;
    }
    return Number(this.penaltyAmount) || 0;
  }

  getAmountToPay() {
    return this.getTotalAmount() + this.getPenaltyAmount();
  }

  private loadLatePenalty() {
    if (!this.courseRegistrationId || this.requestType !== 0) {
      return;
    }
    this.paymentService.getRegistrationPaymentStatus(this.courseRegistrationId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          const details = res?.data?.paymentDetails;
          const registration = res?.data?.registration;
          this.isLateRegistration = !!(details?.isLateRegistration ?? registration?.isLateRegistration);
          this.penaltyAmount = Number(details?.penaltyAmount ?? registration?.unpaidPenaltyAmount ?? 0) || 0;
        }
      });
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
        totalAmount: this.getAmountToPay(),
        courseAmount: this.getTotalAmount(),
        penaltyAmount: this.getPenaltyAmount(),
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
