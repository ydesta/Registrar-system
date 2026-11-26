import { Component, HostBinding, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';
import { StudentSearchComponent } from 'src/app/shared-module/shared/components/student-search/student-search.component';
import {
  ApplyGradeRecordCorrectionRequest,
  GradeRecordCorrectionHistory,
  GradeRecordCorrectionLine,
  GradeRecordCorrectionSheet
} from '../models/grade-record-correction.model';
import { GradeRecordCorrectionService } from '../services/grade-record-correction.service';

@Component({
  selector: 'app-grade-record-correction',
  templateUrl: './grade-record-correction.component.html',
  styleUrls: ['./grade-record-correction.component.scss']
})
export class GradeRecordCorrectionComponent implements OnInit {
  @ViewChild(StudentSearchComponent) studentSearchComponent!: StudentSearchComponent;

  @HostBinding('class.is-searching')
  get hostIsSearching(): boolean {
    return !this.sheet;
  }

  @HostBinding('class.has-sheet')
  get hostHasSheet(): boolean {
    return !!this.sheet;
  }

  editorForm: FormGroup;
  sheet: GradeRecordCorrectionSheet | null = null;
  loading = false;
  saving = false;
  editorVisible = false;
  editorMode: 'Update' | 'Add' | 'Remove' = 'Update';
  selectedLine: GradeRecordCorrectionLine | null = null;
  otpVisible = false;
  private lastStudentCode = '';

  readonly searchTitle = 'Grade Record Correction';
  readonly searchDescription = 'Enter the Student ID to open the transcript correction sheet';
  readonly searchLabel = 'Student ID';
  readonly searchPlaceholder = 'e.g. STG1042';
  readonly searchButtonText = 'Search';

  lineSearchKey = '';
  pageIndex = 1;
  pageSize = 10;
  readonly pageSizeOptions = [10, 20, 50, 100];

  gradeList = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F', 'RC', 'RA', 'NG'];
  actionList = ['Regular', 'Retake', 'Add', 'Assessment', 'Equivalent'];
  termList = [
    { id: 1, name: 'Winter' },
    { id: 2, name: 'Spring' },
    { id: 3, name: 'Summer' },
    { id: 4, name: 'Autumn' }
  ];
  yearList: number[] = [];

  constructor(
    private fb: FormBuilder,
    private service: GradeRecordCorrectionService,
    private notify: CustomNotificationService
  ) {
    this.createEditorForm();
  }

  ngOnInit(): void {
    const thisYear = new Date().getFullYear();
    for (let year = thisYear; year >= thisYear - 15; year--) {
      this.yearList.push(year);
    }
    this.editorForm.get('courseId')?.valueChanges.subscribe((courseId: string) => {
      this.onCourseChange(courseId);
    });
  }

  private createEditorForm(): void {
    this.editorForm = this.fb.group({
      batchCode: [null, Validators.required],
      courseId: [null, Validators.required],
      year: [null, Validators.required],
      termSeason: [null, Validators.required],
      gradeLetter: [null, Validators.required],
      action: ['Regular', Validators.required],
      showOnTranscript: [true],
      creditHours: [null, Validators.required],
      mark: [null],
      reason: ['', Validators.required]
    });
  }

  onSearchSubmitted(studentId: string): void {
    const studentCode = String(studentId || '').trim();
    if (!studentCode) {
      this.studentSearchComponent?.setError('Student ID is required');
      return;
    }

    this.loading = true;
    this.studentSearchComponent?.setLoading(true);
    this.studentSearchComponent?.clearError();

    this.service.getSheet(studentCode).subscribe({
      next: (sheet) => {
        this.sheet = sheet;
        this.lastStudentCode = sheet.studentCode || studentCode;
        this.resetLineTable();
        this.loading = false;
        this.studentSearchComponent?.setLoading(false);
      },
      error: (err) => {
        this.sheet = null;
        this.loading = false;
        const message = err?.error?.error || err?.message || 'Student not found.';
        this.studentSearchComponent?.setError(message);
      }
    });
  }

  searchAnother(): void {
    this.sheet = null;
    this.lastStudentCode = '';
    this.resetLineTable();
    this.closeEditor();
    setTimeout(() => this.studentSearchComponent?.resetForm(), 0);
  }

  private refreshSheet(): void {
    const studentCode = this.lastStudentCode || this.sheet?.studentCode;
    if (!studentCode) {
      return;
    }

    this.loading = true;
    this.service.getSheet(studentCode).subscribe({
      next: (sheet) => {
        this.sheet = sheet;
        this.lastStudentCode = sheet.studentCode || studentCode;
        this.resetLineTable();
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.notify.notification(
          'error',
          'Error',
          err?.error?.error || err?.message || 'Could not refresh the correction sheet.'
        );
      }
    });
  }

  openCorrect(line: GradeRecordCorrectionLine): void {
    this.editorMode = 'Update';
    this.selectedLine = line;
    this.editorForm.reset({
      batchCode: line.batchCode,
      courseId: line.courseId,
      year: line.year,
      termSeason: line.termSeason,
      gradeLetter: line.gradeLetter,
      action: line.action || 'Regular',
      showOnTranscript: line.showOnTranscript !== false,
      creditHours: line.creditHours,
      mark: line.mark,
      reason: ''
    });
    this.editorVisible = true;
  }

  openAdd(): void {
    if (!this.sheet) return;
    this.editorMode = 'Add';
    this.selectedLine = null;
    const firstCourse = this.sheet.courses[0];
    this.editorForm.reset({
      batchCode: this.sheet.batchCode || this.sheet.batchCodes[0] || null,
      courseId: firstCourse?.id || null,
      year: this.yearList[0],
      termSeason: 2,
      gradeLetter: 'B',
      action: 'Add',
      showOnTranscript: true,
      creditHours: firstCourse?.creditHours || 3,
      mark: null,
      reason: ''
    });
    this.editorVisible = true;
  }

  // Remove is disabled — hide lines from the transcript with Show on transcript instead.
  // openRemove(line: GradeRecordCorrectionLine): void {
  //   this.editorMode = 'Remove';
  //   this.selectedLine = line;
  //   this.editorForm.reset({
  //     batchCode: line.batchCode,
  //     courseId: line.courseId,
  //     year: line.year,
  //     termSeason: line.termSeason,
  //     gradeLetter: line.gradeLetter,
  //     action: line.action || 'Regular',
  //     showOnTranscript: line.showOnTranscript !== false,
  //     creditHours: line.creditHours,
  //     mark: line.mark,
  //     reason: ''
  //   });
  //   this.editorVisible = true;
  // }

  onCourseChange(courseId: string): void {
    if (this.editorMode !== 'Add' || !this.sheet) return;
    const course = this.sheet.courses.find(c => c.id === courseId);
    if (course) {
      this.editorForm.patchValue({ creditHours: course.creditHours });
    }
  }

  closeEditor(): void {
    this.editorVisible = false;
    this.selectedLine = null;
  }

  submitEditor(): void {
    if (this.editorMode !== 'Remove' && this.editorForm.invalid) {
      this.editorForm.markAllAsTouched();
      this.notify.notification('error', 'Error', 'Fill all required correction fields.');
      return;
    }
    if (!this.editorForm.get('reason')?.value?.trim()) {
      this.notify.notification('error', 'Error', 'A reason is required.');
      return;
    }
    this.otpVisible = true;
  }

  onGradeCodeConfirmed(token: string): void {
    if (!this.sheet) return;
    const raw = this.editorForm.getRawValue();
    const selectedCourse = this.sheet.courses.find(c => c.id === raw.courseId);
    const payload: ApplyGradeRecordCorrectionRequest = {
      kind: this.editorMode,
      studentCode: this.sheet.studentCode,
      studentGradeId: this.selectedLine?.id || null,
      batchCode: raw.batchCode,
      courseId: raw.courseId,
      courseCode: selectedCourse?.code,
      year: Number(raw.year),
      termSeason: Number(raw.termSeason),
      gradeLetter: raw.gradeLetter,
      action: raw.action,
      showOnTranscript: raw.showOnTranscript !== false,
      creditHours: Number(raw.creditHours),
      mark: raw.mark == null || raw.mark === '' ? null : Number(raw.mark),
      reason: String(raw.reason || '').trim()
    };

    this.saving = true;
    this.service.apply(payload, token).subscribe({
      next: (res) => {
        this.saving = false;
        this.closeEditor();
        this.notify.notification('success', 'Success', res?.message || 'Correction saved.');
        this.refreshSheet();
      },
      error: (err) => {
        this.saving = false;
        this.notify.notification('error', 'Error', this.buildApplyErrorMessage(err));
      }
    });
  }

  private buildApplyErrorMessage(err: any): string {
    const status = err?.status;
    const base =
      err?.error?.message ||
      err?.error?.error ||
      err?.message ||
      'Correction failed.';

    // Status 0 = browser blocked the call (CORS/network). OTP was not consumed.
    if (status === 0) {
      return 'Could not reach the API. Check that the API is running and CORS allows X-Grade-Action-Token, then try again.';
    }

    // OTP is consumed only after the request is accepted by the grade-action filter.
    if (status === 400 || status === 401 || status === 403) {
      return `${base} Request a new one-time code and try again.`;
    }

    return `${base} If you already confirmed a code, request a new one and try again.`;
  }

  editorTitle(): string {
    if (this.editorMode === 'Add') return 'Add a course to the transcript';
    if (this.editorMode === 'Remove') return 'Remove this line from the transcript';
    return 'Correct this transcript line';
  }

  editorHint(): string {
    if (this.editorMode === 'Remove') {
      return 'This line stays off the transcript after you confirm.';
    }

    const examples = (this.sheet?.batchCodes || [])
      .map((code) => String(code || '').trim())
      .filter((code) => !!code)
      .slice(0, 2);

    if (examples.length > 0) {
      return `Choose a batch, year, and term that already have a term offering (for example ${examples.join(' or ')}).`;
    }

    return 'Choose a batch, year, and term that already have a term offering.';
  }

  saveLabel(): string {
    return this.editorMode === 'Remove' ? 'Remove from transcript' : 'Save correction';
  }

  isChanged(previous: string, current: string): boolean {
    return String(previous) !== String(current);
  }

  get filteredLines(): GradeRecordCorrectionLine[] {
    const lines = this.sheet?.lines || [];
    const key = this.lineSearchKey.trim().toLowerCase();
    if (!key) {
      return lines;
    }

    return lines.filter((line) => {
      const haystack = [
        line.year,
        line.termName,
        line.courseCode,
        line.courseTitle,
        line.creditHours,
        line.gradeLetter,
        line.action,
        line.showOnTranscript ? 'on' : 'off',
        line.mark
      ]
        .map((value) => String(value ?? '').toLowerCase())
        .join(' ');
      return haystack.includes(key);
    });
  }

  get paginatedLines(): GradeRecordCorrectionLine[] {
    const start = (this.pageIndex - 1) * this.pageSize;
    return this.filteredLines.slice(start, start + this.pageSize);
  }

  onLineSearch(value: string): void {
    this.lineSearchKey = value || '';
    this.pageIndex = 1;
  }

  onPageIndexChange(pageIndex: number): void {
    this.pageIndex = pageIndex;
  }

  onPageSizeChange(pageSize: number): void {
    this.pageSize = pageSize;
    this.pageIndex = 1;
  }

  lineSerial(index: number): number {
    return (this.pageIndex - 1) * this.pageSize + index + 1;
  }

  private resetLineTable(): void {
    this.lineSearchKey = '';
    this.pageIndex = 1;
    this.pageSize = 10;
  }

  historyFields(entry: GradeRecordCorrectionHistory): Array<{ label: string; previous: string; current: string }> {
    return [
      { label: 'Batch', previous: entry.previous.batch, current: entry.current.batch },
      { label: 'Course', previous: entry.previous.course, current: entry.current.course },
      { label: 'Grade', previous: entry.previous.grade, current: entry.current.grade },
      { label: 'Year', previous: entry.previous.year, current: entry.current.year },
      { label: 'Term', previous: entry.previous.term, current: entry.current.term },
      { label: 'Action', previous: entry.previous.action, current: entry.current.action },
      { label: 'Show on transcript', previous: entry.previous.showOnTranscript, current: entry.current.showOnTranscript },
      { label: 'Credit hours', previous: entry.previous.credit, current: entry.current.credit },
      { label: 'Mark', previous: entry.previous.mark, current: entry.current.mark }
    ];
  }
}
