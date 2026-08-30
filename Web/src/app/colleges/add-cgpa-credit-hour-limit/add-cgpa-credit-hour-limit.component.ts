import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { CgpaCreditHourLimitModel } from 'src/app/Models/CgpaCreditHourLimitModel';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';
import { CgpaCreditHourLimitService } from '../services/cgpa-credit-hour-limit.service';
import { BatchService } from '../services/batch.service';
import { StudentService } from 'src/app/students/services/student.service';
import { ACADEMIC_TERM_STATUS, CREDIT_HOUR_LIMIT_LEVEL } from 'src/app/common/constant';
import { StaticData } from 'src/app/admission-request/model/StaticData';

@Component({
  selector: 'app-add-cgpa-credit-hour-limit',
  templateUrl: './add-cgpa-credit-hour-limit.component.html',
  styleUrls: ['./add-cgpa-credit-hour-limit.component.scss']
})
export class AddCgpaCreditHourLimitComponent implements OnInit, OnDestroy {
  @Input() limit: CgpaCreditHourLimitModel;
  @Input() defaultAcademicTerm: number = 1;
  @Input() defaultYear: number = new Date().getFullYear();

  form: FormGroup;
  submit = 'Submit';
  termList: StaticData[] = [];
  levelList: StaticData[] = [];
  yearOptions: number[] = [];
  batches: any[] = [];
  students: any[] = [];
  loadingStudents = false;
  private destroy$ = new Subject<void>();
  private studentSearch$ = new Subject<string>();

  constructor(
    private _fb: FormBuilder,
    private modalRef: NzModalRef,
    private limitService: CgpaCreditHourLimitService,
    private batchService: BatchService,
    private studentService: StudentService,
    private _customNotificationService: CustomNotificationService
  ) {
    this.createForm();
  }

  ngOnInit(): void {
    this.termList = ACADEMIC_TERM_STATUS.map(x => ({ Id: x.Id, Description: x.Description }));
    this.levelList = CREDIT_HOUR_LIMIT_LEVEL.map(x => ({ Id: x.Id, Description: x.Description }));
    const current = new Date().getFullYear();
    this.yearOptions = Array.from({ length: 11 }, (_, i) => current - 5 + i);
    this.loadBatches();

    this.studentSearch$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(text => this.searchStudents(text));

    this.form.get('limitLevel')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.syncScopeValidators());

    if (this.limit) {
      this.submit = 'Update';
      this.patchValues(this.limit);
    } else {
      this.form.patchValue({
        academicTerm: this.defaultAcademicTerm,
        year: this.defaultYear,
        limitLevel: 2
      });
    }
    this.syncScopeValidators();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get isStudentLevel(): boolean {
    return Number(this.form.get('limitLevel')?.value) === 0;
  }

  get isBatchLevel(): boolean {
    return Number(this.form.get('limitLevel')?.value) === 1;
  }

  get isTermLevel(): boolean {
    return Number(this.form.get('limitLevel')?.value) === 2;
  }

  studentLabel(item: any): string {
    const code = item.studentId || '';
    const name = [item.firstName, item.fatherName, item.grandFatherName].filter(Boolean).join(' ');
    return `${code} ${name}`.trim();
  }

  onSearchStudent(text: string): void {
    this.studentSearch$.next((text || '').trim());
  }

  createForm() {
    this.form = this._fb.group({
      createdBy: ['-'],
      lastModifiedBy: ['-'],
      academicTerm: [null],
      year: [null],
      limitLevel: [2, Validators.required],
      studentId: [null],
      batchCode: [null],
      minCgpa: [0, [Validators.required, Validators.min(0), Validators.max(4)]],
      maxCreditHours: [9, [Validators.required, Validators.min(1), Validators.max(40)]],
      isActive: [true],
      remark: ['']
    });
  }

  patchValues(data: CgpaCreditHourLimitModel) {
    if (data.student) {
      this.students = [data.student];
    }
    this.form.patchValue({
      academicTerm: data.academicTerm,
      year: data.year,
      limitLevel: data.limitLevel ?? 2,
      studentId: data.studentId || data.student?.id || null,
      batchCode: data.batchCode || null,
      minCgpa: data.minCgpa,
      maxCreditHours: data.maxCreditHours,
      isActive: data.isActive,
      remark: data.remark || ''
    });
  }

  submitForm() {
    this.syncScopeValidators();
    if (!this.form.valid) {
      this._customNotificationService.notification('error', 'Error', 'Enter valid data.');
      return;
    }

    const payload = { ...this.form.value } as CgpaCreditHourLimitModel;
    const level = Number(payload.limitLevel);
    if (level !== 0) payload.studentId = null;
    if (level !== 1) payload.batchCode = null;
    if (level === 3) {
      payload.academicTerm = null;
      payload.year = null;
    }

    if (!this.limit) {
      this.limitService.create(payload).subscribe((res: any) => {
        if (res?.status === 'error') {
          this._customNotificationService.notification('error', 'Error', res.data);
          return;
        }
        this._customNotificationService.notification('success', 'Success', 'Limit saved.');
        this.modalRef.close(res);
      });
    } else {
      this.limitService.update(this.limit.id!, payload).subscribe((res: any) => {
        if (res?.status === 'error') {
          this._customNotificationService.notification('error', 'Error', res.data);
          return;
        }
        this._customNotificationService.notification('success', 'Success', 'Limit updated.');
        this.modalRef.close(res);
      });
    }
  }

  cancel() {
    this.modalRef.close();
  }

  private loadBatches() {
    this.batchService.getBatchList().subscribe({
      next: (res: any) => {
        this.batches = res?.data || [];
      }
    });
  }

  private searchStudents(text: string) {
    if (!text || text.length < 2) {
      this.students = [];
      return;
    }
    this.loadingStudents = true;
    this.studentService.searchStudents(text).subscribe({
      next: (res: any) => {
        this.students = Array.isArray(res) ? res : (res?.data || []);
        this.loadingStudents = false;
      },
      error: () => {
        this.students = [];
        this.loadingStudents = false;
      }
    });
  }

  private syncScopeValidators() {
    const studentControl = this.form.get('studentId');
    const batchControl = this.form.get('batchCode');
    const termControl = this.form.get('academicTerm');
    const yearControl = this.form.get('year');

    studentControl?.clearValidators();
    batchControl?.clearValidators();
    termControl?.clearValidators();
    yearControl?.clearValidators();

    if (this.isStudentLevel) {
      studentControl?.setValidators([Validators.required]);
    } else {
      studentControl?.setValue(null, { emitEvent: false });
    }

    if (this.isBatchLevel) {
      batchControl?.setValidators([Validators.required]);
    } else {
      batchControl?.setValue(null, { emitEvent: false });
    }

    if (this.isTermLevel) {
      termControl?.setValidators([Validators.required]);
      yearControl?.setValidators([Validators.required]);
    }

    studentControl?.updateValueAndValidity({ emitEvent: false });
    batchControl?.updateValueAndValidity({ emitEvent: false });
    termControl?.updateValueAndValidity({ emitEvent: false });
    yearControl?.updateValueAndValidity({ emitEvent: false });
  }
}
