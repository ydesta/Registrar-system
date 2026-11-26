import { Component, OnInit, ChangeDetectorRef } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { forkJoin, of } from "rxjs";
import { Subscription } from "rxjs";
import { catchError, distinctUntilChanged } from "rxjs/operators";
import { ACADEMIC_TERM_STATUS, SECTION_TYPE, numbersOnlyValidator } from "src/app/common/constant";
import { CustomNotificationService } from "src/app/services/custom-notification.service";
import { StudentService } from "../services/student.service";
import { TermCourseOfferingService } from "src/app/colleges/services/term-course-offering.service";
import { BatchTermService } from "src/app/colleges/services/batch-term.service";
import { NzUploadChangeParam } from "ng-zorro-antd/upload";
import { NzUploadFile } from "ng-zorro-antd/upload/interface";
import { NzUploadXHRArgs } from "ng-zorro-antd/upload";
import { StaticData } from "src/app/admission-request/model/StaticData";
import { StaffService } from "src/app/services/staff.service";
import { AuthService } from "src/app/services/auth.service";
import { InstructorSectionService } from "src/app/services/instructor-section.service";
import { InstructorSectionAssignmentViewModel } from "src/app/Models/InstructorSectionModel";
import { TermViewModel } from "src/app/colleges/model/term-view-model";

export interface GradeImportAssignmentRow extends InstructorSectionAssignmentViewModel {
  sectionTypeId: number;
  sectionTypeLabel: string;
  rowKey: string;
}

interface UploadFileListLike {
  readonly length: number;
  item(index: number): File | null;
  [Symbol.iterator](): IterableIterator<File>;
}

interface ErrorItem {
  rowIndex: number;
  message: string;
}

interface ImportSummary {
  importedCount: number;
  skippedNotRegistered: string[];
  skippedNotFound: string[];
  skippedInvalid: string[];
  message: string;
}

@Component({
  selector: "app-import-student-grade",
  templateUrl: "./import-student-grade.component.html",
  styleUrls: ["./import-student-grade.component.scss"]
})
export class ImportStudentGradeComponent implements OnInit {
  action = 'Import Student Grade';
  importStudentGradeForm: FormGroup;
  submit = 'Submit';
  formData = new FormData();
  file_store?: FileList | UploadFileListLike;
  file_list: Array<string> = [];
  importStudentGradeFile = "";
  staffList: any[] = [];
  listOfTermNumber: StaticData[] = [];
  listOfSectionType: StaticData[] = [];
  academicTermOptions: TermViewModel[] = [];
  userId: string | null = localStorage.getItem('userId');
  staffId: string | null;
  isAdmin = false;

  assignmentTableRows: GradeImportAssignmentRow[] = [];
  assignmentsLoading = false;
  selectedRowKey: string | null = null;
  currentTermLabel = "";
  instructorDisplayName = "";
  activeTermId: number | null = null;
  activeTermYear: number | null = null;
  selectedTermConfigId: number | null = null;

  isErrorModalVisible = false;
  errorList: ErrorItem[] = [];
  isSummaryModalVisible = false;
  importSummary: ImportSummary | null = null;

  entryMode: 'excel' | 'single' = 'excel';
  singleGradeForm: FormGroup;
  gradeList: string[] = ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F', 'RC', 'RA', 'NG', '-'];
  
  constructor(
    private _fb: FormBuilder,
    private _customNotificationService: CustomNotificationService,
    private _studentService: StudentService,
    private _termCourseOfferingService: TermCourseOfferingService,
    private _batchTermService: BatchTermService,
    private _router: Router,
    private route: ActivatedRoute,
    private staffService: StaffService,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private instructorSectionService: InstructorSectionService
  ) {
    this.isAdmin =
      this.authService.hasRole("Administrator") ||
      this.authService.hasRole("Admin") ||
      this.authService.hasRole("Super Admin");

    this.createImportStudentGradeForm();
    this.createSingleGradeForm();
  }

  ngOnInit(): void {
    this.setupStaffIdSubscription();
    this.setupTermSubscription();
    this.getStaffList();
    this.getListOfAcademicTermStatus();
    this.getListOfSectionType();
    this.loadAcademicTermOptions();
    this.loadActiveAcademicTerm();

    if (this.route.snapshot.queryParamMap.get('mode') === 'single') {
      this.entryMode = 'single';
    }

    if (this.isAdmin) {
      this.importStudentGradeForm.patchValue({ staffId: null });
      this.courseId?.setValue("");
    } else if (this.userId) {
      this.staffService.getStaffByUserId(this.userId).subscribe((res: any) => {
        if (res?.data?.id) {
          this.staffId = res.data.id;
          const d = res.data;
          this.instructorDisplayName =
            `${d.firstName ?? ""} ${d.middleName ?? ""} ${d.lastName ?? ""}`.trim() ||
            d.fullName ||
            "";
          this.importStudentGradeForm.patchValue({
            staffId: this.staffId
          });
          this.tryLoadAssignmentTable();
        }
      });
    }
  }

  private createImportStudentGradeForm(): void {
    this.importStudentGradeForm = this._fb.group({
      staffId: [null, [Validators.required]],
      courseId: ["", [Validators.required]],
      academicTermYearId: [0, [Validators.required, numbersOnlyValidator()]],
      ActualFile: ["", []],
      academicTermId: [null, [Validators.required]],
      sectionType: [null as number | null, [Validators.required]],
      batchId: [null, [Validators.required]],
      batchCode: [null, [Validators.required]],
      sectionId: [null, [Validators.required]],
    });
  }

  private createSingleGradeForm(): void {
    this.singleGradeForm = this._fb.group({
      studentCode: ['', [Validators.required]],
      mark: [null, [Validators.required]],
      gradeLetter: [null, [Validators.required]],
      remark: ['']
    });
  }

  setEntryMode(mode: 'excel' | 'single'): void {
    this.entryMode = mode;
  }

  private loadAcademicTermOptions(): void {
    this._batchTermService.GetAcademicTermList().subscribe({
      next: (res: TermViewModel[]) => {
        this.academicTermOptions = (res || []).map((t: any) => ({
          id: t.id ?? t.Id,
          termId: t.termId ?? t.TermId,
          year: t.year ?? t.Year,
          academicTerm: t.academicTerm ?? t.AcademicTerm
        }));
        this.syncSelectedTermConfigId();
        this.cdr.markForCheck();
      },
      error: () => {
        this.academicTermOptions = [];
      }
    });
  }

  getListOfAcademicTermStatus() {
    let division: StaticData = new StaticData();
    ACADEMIC_TERM_STATUS.forEach(pair => {
      division = {
        Id: pair.Id,
        Description: pair.Description
      };
      this.listOfTermNumber.push(division);
    });
  }

  getListOfSectionType() {
    let division: StaticData = new StaticData();
    SECTION_TYPE.forEach(pair => {
      division = {
        Id: pair.Id,
        Description: pair.Description
      };
      this.listOfSectionType.push(division);
    });
  }

  private loadActiveAcademicTerm(): void {
    this._batchTermService.getNextAcademicTerm().subscribe({
      next: (res: any) => {
        if (!res) {
          this._customNotificationService.notification(
            "warning",
            "Academic term",
            "No active academic term is configured. Contact the registrar."
          );
          return;
        }
        const termId = res.termId ?? res.TermId;
        const year = res.year ?? res.Year;
        if (termId == null || year == null) {
          this._customNotificationService.notification(
            "warning",
            "Academic term",
            "Could not read active term from the server."
          );
          return;
        }
        this.activeTermId = Number(termId);
        this.activeTermYear = Number(year);
        this.importStudentGradeForm.patchValue(
          {
            academicTermId: Number(termId),
            academicTermYearId: Number(year)
          },
          { emitEvent: false }
        );
        this.refreshCurrentTermLabel();
        this.syncSelectedTermConfigId();
        this.tryLoadAssignmentTable();
      },
      error: () => {
        this._customNotificationService.notification(
          "error",
          "Error",
          "Failed to load the current academic term."
        );
      }
    });
  }

  getAcademicTermDescription(termId: number): string {
    const item = this.listOfTermNumber.find(t => t.Id === termId);
    return item?.Description ?? `Term ${termId}`;
  }

  private refreshCurrentTermLabel(): void {
    const term = this.importStudentGradeForm.get("academicTermId")?.value;
    const year = this.importStudentGradeForm.get("academicTermYearId")?.value;
    if (term == null || year == null || year === 0) {
      this.currentTermLabel = "";
      return;
    }
    this.currentTermLabel = `${this.getAcademicTermDescription(Number(term))} ${year}`;
  }

  private syncSelectedTermConfigId(): void {
    const term = Number(this.importStudentGradeForm.get("academicTermId")?.value);
    const year = Number(this.importStudentGradeForm.get("academicTermYearId")?.value);
    if (!term || !year || !this.academicTermOptions.length) {
      return;
    }
    const match = this.academicTermOptions.find(
      t => Number(t.termId) === term && Number(t.year) === year
    );
    this.selectedTermConfigId = match?.id ?? null;
  }

  onAcademicTermConfigChange(configId: number | null): void {
    this.selectedTermConfigId = configId;
    if (configId == null) {
      return;
    }
    const match = this.academicTermOptions.find(t => Number(t.id) === Number(configId));
    if (!match) {
      return;
    }
    this.importStudentGradeForm.patchValue({
      academicTermId: Number(match.termId),
      academicTermYearId: Number(match.year)
    });
  }

  private setupTermSubscription(): void {
    this.importStudentGradeForm.get("academicTermId")?.valueChanges
      .pipe(distinctUntilChanged())
      .subscribe(() => {
        this.refreshCurrentTermLabel();
        this.syncSelectedTermConfigId();
        this.tryLoadAssignmentTable();
      });
    this.importStudentGradeForm.get("academicTermYearId")?.valueChanges
      .pipe(distinctUntilChanged())
      .subscribe(() => {
        this.refreshCurrentTermLabel();
        this.syncSelectedTermConfigId();
        this.tryLoadAssignmentTable();
      });
  }

  tryLoadAssignmentTable(): void {
    const staffId = this.importStudentGradeForm.get("staffId")?.value;
    const term = this.importStudentGradeForm.get("academicTermId")?.value;
    const year = this.importStudentGradeForm.get("academicTermYearId")?.value;

    this.selectedRowKey = null;
    this.clearSelectedAssignmentFields();

    if (!staffId || term == null || year == null || year === 0) {
      this.assignmentTableRows = [];
      return;
    }

    this.assignmentsLoading = true;
    const sectionTypes = this.listOfSectionType.length
      ? this.listOfSectionType
      : [{ Id: 0, Description: "Class" } as StaticData];

    const requests = sectionTypes.map(st =>
      this.instructorSectionService
        .getInstructorSectionAssignmentsByStaff(String(staffId), Number(term), Number(year), Number(st.Id))
        .pipe(catchError(() => of({ data: [] })))
    );

    forkJoin(requests).subscribe({
      next: (results: any[]) => {
        const merged: GradeImportAssignmentRow[] = [];
        const seen = new Set<string>();
        results.forEach((res, idx) => {
          const st = sectionTypes[idx];
          const rows = (res?.data || []) as InstructorSectionAssignmentViewModel[];
          for (const r of rows) {
            if (!r?.batchId || !r?.courseId || r.sectionId == null) {
              continue;
            }
            const rowKey = `${r.batchId}|${r.courseId}|${r.sectionId}|${st.Id}`;
            if (seen.has(rowKey)) {
              continue;
            }
            seen.add(rowKey);
            merged.push({
              ...r,
              sectionTypeId: Number(st.Id),
              sectionTypeLabel: st.Description ?? "",
              rowKey
            });
          }
        });
        merged.sort((a, b) => {
          const bc = (a.batchCode || "").localeCompare(b.batchCode || "");
          if (bc !== 0) {
            return bc;
          }
          const cc = (a.course || "").localeCompare(b.course || "");
          if (cc !== 0) {
            return cc;
          }
          return (a.section || "").localeCompare(b.section || "");
        });
        this.assignmentTableRows = merged;
        this.assignmentsLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.assignmentsLoading = false;
        this.assignmentTableRows = [];
        this._customNotificationService.notification(
          "error",
          "Error",
          "Failed to load your section assignments for this term."
        );
        this.cdr.markForCheck();
      }
    });
  }

  private isSelectedCurrentActiveTerm(): boolean {
    const term = Number(this.importStudentGradeForm.get("academicTermId")?.value);
    const year = Number(this.importStudentGradeForm.get("academicTermYearId")?.value);
    return (
      this.activeTermId != null &&
      this.activeTermYear != null &&
      term === this.activeTermId &&
      year === this.activeTermYear
    );
  }

  isAssignmentRowLocked(row: GradeImportAssignmentRow): boolean {
    if ((row.submittedGradeCount ?? 0) <= 0) {
      return false;
    }
    return this.isSelectedCurrentActiveTerm();
  }

  onAssignmentRowClick(row: GradeImportAssignmentRow): void {
    if (this.isAssignmentRowLocked(row)) {
      this._customNotificationService.notification(
        "warning",
        "Section locked",
        "Grades are already submitted for this course section in the current term."
      );
      return;
    }
    this.onAssignmentRowKeyChange(row.rowKey);
  }

  onAssignmentRowKeyChange(rowKey: string | null): void {
    this.selectedRowKey = rowKey;
    if (!rowKey) {
      this.clearSelectedAssignmentFields();
      return;
    }
    const row = this.assignmentTableRows.find(r => r.rowKey === rowKey);
    if (!row) {
      this.clearSelectedAssignmentFields();
      return;
    }
    if (this.isAssignmentRowLocked(row)) {
      this.selectedRowKey = null;
      this.clearSelectedAssignmentFields();
      this._customNotificationService.notification(
        "warning",
        "Section locked",
        "Grades are already submitted for this course section in the current term."
      );
      return;
    }
    this.applyAssignmentRowToForm(row);
  }

  private applyAssignmentRowToForm(row: GradeImportAssignmentRow): void {
    this.importStudentGradeForm.patchValue(
      {
        sectionType: row.sectionTypeId,
        batchId: row.batchId,
        batchCode: row.batchCode,
        courseId: row.courseId,
        sectionId: row.sectionId
      },
      { emitEvent: false }
    );
  }

  private clearSelectedAssignmentFields(): void {
    this.importStudentGradeForm.patchValue(
      {
        sectionType: null,
        batchId: null,
        batchCode: null,
        courseId: "",
        sectionId: null
      },
      { emitEvent: false }
    );
  }

  private setupStaffIdSubscription(): void {
    this.importStudentGradeForm.get("staffId")?.valueChanges.subscribe((sid) => {
      if (sid) {
        this.staffId = String(sid);
        this.refreshAdminInstructorDisplayName();
        this.tryLoadAssignmentTable();
      } else {
        this.staffId = null;
        if (this.isAdmin) {
          this.instructorDisplayName = "";
        }
        this.assignmentTableRows = [];
        this.selectedRowKey = null;
        this.clearSelectedAssignmentFields();
      }
    });
  }

  private refreshAdminInstructorDisplayName(): void {
    if (!this.isAdmin) {
      return;
    }
    const id = this.importStudentGradeForm.get("staffId")?.value;
    if (!id) {
      this.instructorDisplayName = "";
      return;
    }
    const match = this.staffList.find((s: { id: string; name: string }) => String(s.id) === String(id));
    this.instructorDisplayName = match?.name?.trim() ?? "";
  }

  private getStaffList(): void {
    this._termCourseOfferingService.getStaffList().subscribe(res => {
      this.staffList = res.data.map(staff => ({
        name: staff.firstName + " " + staff.lastName,
        id: staff.id
      }));
      this.refreshAdminInstructorDisplayName();
    });
  }

  get courseId() {
    return this.importStudentGradeForm.get("courseId");
  }

  get academicTermYearId() {
    return this.importStudentGradeForm.get("academicTermYearId");
  }
  get academicTermId() {
    return this.importStudentGradeForm.get("academicTermId");
  }

  get assignmentTableEmptyMessage(): string {
    if (this.isAdmin && !this.importStudentGradeForm.get("staffId")?.value) {
      return "Select an instructor to load assignments.";
    }
    if (!this.importStudentGradeForm.get("academicTermId")?.value) {
      return "Select an academic term to load assignments.";
    }
    return "No section assignments for this staff in the selected term.";
  }

  get selectedAssignmentSummary(): string {
    const row = this.assignmentTableRows.find(r => r.rowKey === this.selectedRowKey);
    if (!row) {
      return "";
    }
    const termPart = this.currentTermLabel ? `${this.currentTermLabel} · ` : "";
    return `${termPart}${row.course} · Section ${row.section} · ${row.batchCode} · ${row.sectionTypeLabel}`;
  }
  handleFileInputChange(files: FileList): void {
    if (files && files.length) {
      this.file_store = files;

      const count = files.length > 1 ? ` (+${files.length - 1} files)` : "";
      this.importStudentGradeForm.patchValue({
        ActualFile: `${files[0].name}${count}`
      });

      this.file_list = [];
      for (let i = 0; i < files.length; i++) {
        this.file_list.push(files[i].name);
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.importStudentGradeFile = e.target.result;
        };
        reader.readAsDataURL(files[i]);
      }
    } else {
      this.importStudentGradeForm.patchValue({
        ActualFile: ""
      });
      this.file_list = [];
    }
  }

  beforeUpload = (_file: NzUploadFile, _fileList: NzUploadFile[]): boolean => {
    return false;
  };

  dummyRequest = (item: NzUploadXHRArgs): Subscription => {
    item.onSuccess?.({}, item.file, {} as any);
    return new Subscription();
  };

  handleChange({ file, fileList }: NzUploadChangeParam): void {
    const status = file.status;

    if (status !== "uploading") {
      const uploadedFiles: File[] = fileList
        .filter(item => !!item.originFileObj)
        .map(item => item.originFileObj as File);

      if (uploadedFiles.length) {
        this.file_store = {
          length: uploadedFiles.length,
          item: (index: number) =>
            index < uploadedFiles.length ? uploadedFiles[index] : null,
          [Symbol.iterator](): IterableIterator<File> {
            return uploadedFiles[Symbol.iterator]();
          }
        };

        const count =
          uploadedFiles.length > 1
            ? ` (+${uploadedFiles.length - 1} files)`
            : "";
        this.importStudentGradeForm.patchValue({
          ActualFile: `${uploadedFiles[0].name}${count}`
        });

        this.file_list = uploadedFiles.map(file => file.name);
      } else {
        this.importStudentGradeForm.patchValue({
          ActualFile: ""
        });
        this.file_list = [];
        this.file_store = undefined;
      }
    }

    if (status === "done") {
    } else if (status === "error") {
    }
  }


  otpVisible = false;

  submitForm(): void {
    if (this.entryMode === 'single') {
      this.submitSingleGrade();
      return;
    }
    if (this.importStudentGradeForm.valid && this.canSave()) {
      this.otpVisible = true;
    }
  }

  submitSingleGrade(): void {
    if (!this.canSaveSingle()) {
      this._customNotificationService.notification(
        'error',
        'Error',
        'Select a course section and enter student code, mark, and grade.'
      );
      this.singleGradeForm.markAllAsTouched();
      return;
    }
    this.otpVisible = true;
  }

  onGradeCodeConfirmed(token: string): void {
    if (this.entryMode === 'single') {
      this.saveSingleGrade(token);
      return;
    }

    if (this.importStudentGradeForm.valid && this.canSave()) {
      this.prepareFormData();
      this._studentService.uploadGrade(this.formData, token).subscribe(res => {
        this.handleGradeSaveResult(res, 'Grade upload completed successfully.');
      }, error => {
        console.error('API Error:', error);
        this._customNotificationService.notification(
          "error",
          "Error",
          this.gradeActionRetryMessage(error?.error?.error || error?.message)
        );
      });
    } else {
      this._customNotificationService.notification(
        "error",
        "Error",
        "Please fill in all required fields and upload a file. Request a new one-time code before submitting again."
      );
    }
  }

  private saveSingleGrade(token: string): void {
    if (!this.canSaveSingle()) {
      this._customNotificationService.notification(
        'error',
        'Error',
        'Select a course section and enter student code, mark, and grade.'
      );
      return;
    }

    const assignment = this.importStudentGradeForm.getRawValue();
    const single = this.singleGradeForm.getRawValue();
    const payload = {
      academicTermYearId: assignment.academicTermYearId,
      academicTermId: assignment.academicTermId,
      staffId: assignment.staffId,
      courseId: assignment.courseId,
      batchCode: assignment.batchCode,
      studentCode: String(single.studentCode || '').trim(),
      gradeLetter: single.gradeLetter,
      mark: Number(single.mark)
    };

    this._studentService.recordSingleGrade(payload, token).subscribe({
      next: (res) => {
        this.handleGradeSaveResult(res, 'Student grade recorded successfully.');
        if (!this.hasGradeSaveErrors(res)) {
          this.singleGradeForm.reset({
            studentCode: '',
            mark: null,
            gradeLetter: null,
            remark: ''
          });
        }
      },
      error: (error) => {
        console.error('API Error:', error);
        this._customNotificationService.notification(
          'error',
          'Error',
          this.gradeActionRetryMessage(error?.error?.error || error?.message)
        );
      }
    });
  }

  private gradeActionRetryMessage(detail?: string): string {
    const base = detail || 'The grade action failed.';
    return `${base} The one-time code was already used. Request a new code and try again.`;
  }

  private hasGradeSaveErrors(res: any): boolean {
    const payload = this.unwrapGradeSaveResult(res);
    return !!(payload?.errors && payload.errors.length > 0);
  }

  private unwrapGradeSaveResult(res: any): any {
    if (!res) {
      return null;
    }
    if (res.data && (res.data.importedCount != null || res.data.errors || res.data.message)) {
      return res.data;
    }
    return res;
  }

  private handleGradeSaveResult(res: any, successMessage: string): void {
    const payload = this.unwrapGradeSaveResult(res);

    if (this.hasGradeSaveErrors(res) && !(payload?.importedCount > 0)) {
      this.errorList = payload?.errors || [];
      this.isErrorModalVisible = true;
      this._customNotificationService.notification(
        'warning',
        'Issues found',
        'The one-time code was already used. Fix the issues, then request a new code to submit again.'
      );
      this.cdr.detectChanges();
      return;
    }

    this.importSummary = {
      importedCount: Number(payload?.importedCount ?? 0),
      skippedNotRegistered: payload?.skippedNotRegistered || [],
      skippedNotFound: payload?.skippedNotFound || [],
      skippedInvalid: payload?.skippedInvalid || [],
      message: payload?.message || successMessage
    };

    const hasSkips =
      this.importSummary.skippedNotRegistered.length > 0 ||
      this.importSummary.skippedNotFound.length > 0 ||
      this.importSummary.skippedInvalid.length > 0;

    this.isSummaryModalVisible = true;
    this._customNotificationService.notification(
      hasSkips ? 'warning' : 'success',
      hasSkips ? 'Import finished with skips' : 'Success',
      this.importSummary.message
    );
    this.cdr.detectChanges();
  }

  // Modal methods
  showErrorModal(): void {
    this.isErrorModalVisible = true;
  }

  handleErrorModalOk(): void {
    this.isErrorModalVisible = false;
    this.errorList = [];
  }

  handleErrorModalCancel(): void {
    this.isErrorModalVisible = false;
    this.errorList = [];
  }

  handleSummaryModalClose(): void {
    this.isSummaryModalVisible = false;
    const imported = this.importSummary?.importedCount ?? 0;
    this.importSummary = null;
    if (this.entryMode === 'excel' && imported > 0) {
      this._router.navigateByUrl(`/students/StudentGrades`);
    }
  }

  formatStudentCodes(codes: string[] | null | undefined): string {
    return (codes && codes.length > 0) ? codes.join(', ') : '—';
  }

  private prepareFormData(): void {
    this.formData = new FormData();
    const postData = this.importStudentGradeForm.getRawValue();

    Object.keys(postData).forEach(key => {
      if (key !== "ActualFile" && postData[key] != null) {
        this.formData.append(key, postData[key]);
      }
    });

    if (this.file_store && this.file_store.length > 0) {
      for (let i = 0; i < this.file_store.length; i++) {
        const file = this.file_store.item(i);
        if (file) {
          this.formData.append("ActualFile", file);
        }
      }
    }

  }

  goToCourse(): void {
    this._router.navigateByUrl(`/students/StudentGrades`);
  }
  private hasAssignmentSelection(): boolean {
    return this.importStudentGradeForm.valid;
  }

  canSave(): boolean {
    return (
      this.hasAssignmentSelection() &&
      this.importStudentGradeForm.value.ActualFile !== ""
    );
  }

  canSaveSingle(): boolean {
    return this.hasAssignmentSelection() && this.singleGradeForm.valid;
  }
}
