import { ChangeDetectorRef, Component, NgZone, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { CurriculumQuadrantBreakdownService } from "src/app/graduation-requirement/services/curriculum-quadrant-breakdown.service";
import { CurriculumBreakdown } from "../../models/CurriculumBreakdown";
import { ActivatedRoute, Router } from "@angular/router";
import { CustomNotificationService } from "src/app/services/custom-notification.service";
import { AcademicProgrammeService } from "src/app/acadamic-programme/services/academic-programme.service";
import { TransferChange, TransferDirection, TransferItem } from "ng-zorro-antd/transfer";

@Component({
  selector: "app-quadrant-breakdown-form",
  templateUrl: "./quadrant-breakdown-form.component.html",
  styleUrls: ["./quadrant-breakdown-form.component.scss"],
})
export class QuadrantBreakdownFormComponent implements OnInit {
  action = "Add Curriculum Quadrant Breakdown";
  disabled = false;
  quadrantBreakdownForm: FormGroup;
  progId: any;
  curricula: any;
  courses: any[] = [];
  listOfUnregisteredCourse: TransferItem[] = [];
  numberOfCourseList = 0;
  selectiveId: string[] = [];
  quadrants: any;
  submit = "Save";
  isSubmitting = false;
  isLoadingCourses = false;
  checkedA = false;
  setOfCheckedIdA = new Set<string>();
  listOfCurrentPageDataA: readonly any[] = [];
  indeterminateA = false;
  loadingA = false;
  id = 0;
  numberOfSelectiveCourse = 0;
  academicPrograms: any;
  targetList: TransferItem[] = [];
  targetCourseIds: string[] = [];
  targetKeys: string[] = [];
  transferVersion = 0;
  curriculumId: string;
  numberOfSaveQuadrantCourse = 0;
  quadrantId: string;
  curriculumCode: '';
  programCode: ''
  editMode = false;
  isQuadrantLocked = false;
  currentQuadrant: string;
  private courseLoadToken = 0;

  constructor(
    private _fb: FormBuilder,
    private _route: Router,
    private activeRoute: ActivatedRoute,
    private _customNotificationService: CustomNotificationService,
    private _curriculumQuadrantBreakdownService: CurriculumQuadrantBreakdownService,
    private _academicProgrammeService: AcademicProgrammeService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
  ) {
    this.activeRoute.queryParams.subscribe(p => {
      this.progId = p["id"];
      this.curriculumId = p["curriculum-id"];
      this.curriculumCode = p["curriculum-code"];
      this.programCode = p["program"];
      this.editMode = p["mode"] === "edit" || (!!p["id"] && p["id"] !== "0");
      this.quadrantId = p["quadrant-id"] || null;
      this.isQuadrantLocked = this.editMode && !!this.quadrantId;
      if (this.editMode) {
        this.action = "Edit Curriculum Quadrant Breakdown";
        this.submit = "Update";
        this.id = Number(p["id"]) || 0;
      }
    });
    this.createQuadrantBreakdown();
  }

  ngOnInit(): void {
    this.getAcademicProgramme();
    this.acadamicProgrammeID.patchValue(this.programCode);
    this.CurriculumId.patchValue(this.curriculumCode);
    this.getQuadrantsList();
    this.quadrantsId.valueChanges.subscribe(res => {
      this.quadrantId = res;
      if (this.curriculumId != null && res != null) {
        this.resetCourseSelection();
        if (!this.isQuadrantLocked) {
          this.id = 0;
        }
        this.getCourseList();
        if (!this.isQuadrantLocked) {
          this.loadBreakdownMeta();
        }
      }
    });

    if (this.isQuadrantLocked && this.quadrantId) {
      this.applySelectedQuadrant();
      this.getCourseList();
      this.loadBreakdownMeta();
    }
  }

  private getQuadrantOptionId(item: any): string {
    return String(item?.id || item?.ID || "").trim();
  }

  private resolveQuadrantOptionId(quadrantId: string): string | null {
    if (!quadrantId || !Array.isArray(this.quadrants) || this.quadrants.length === 0) {
      return null;
    }
    const key = String(quadrantId).trim().toLowerCase();
    const match = this.quadrants.find((q: any) => {
      const optionId = this.getQuadrantOptionId(q).toLowerCase();
      const code = String(q?.quadrantsID || q?.QuadrantsID || "").trim().toLowerCase();
      return optionId === key || code === key;
    });
    return match ? this.getQuadrantOptionId(match) : null;
  }

  private applySelectedQuadrant(): void {
    if (!this.isQuadrantLocked || !this.quadrantId) {
      return;
    }
    const resolved = this.resolveQuadrantOptionId(this.quadrantId) || String(this.quadrantId).trim();
    this.quadrantId = resolved;
    this.quadrantsId.patchValue(resolved, { emitEvent: false });
    this.quadrantsId.disable({ emitEvent: false });
    this.cdr.detectChanges();
  }

  private resetCourseSelection(): void {
    this.targetList = [];
    this.targetCourseIds = [];
    this.targetKeys = [];
    this.numberOfSelectiveCourse = 0;
    this.numberOfSaveQuadrantCourse = 0;
    this.listOfUnregisteredCourse = [];
    this.numberOfCourseList = 0;
    this.transferVersion++;
  }

  private createQuadrantBreakdown() {
    this.quadrantBreakdownForm = this._fb.group({
      createdBy: ["-"],
      lastModifiedBy: ["-"],
      acadamicProgrammeID: ["", Validators.required],
      CurriculumId: ["", Validators.required],
      courseId: ["", []],
      quadrantsId: ["", Validators.required],
      minimumCreditHours: [0, [Validators.required]],
      remark: [""],
    });
  }

  getAcademicProgramme() {
    this._academicProgrammeService.getAcademicProgrammeList().subscribe((res: any) => {
      this.academicPrograms = res.data;
    });
  }

  get quadrantsId() {
    return this.quadrantBreakdownForm.get("quadrantsId");
  }
  get acadamicProgrammeID() {
    return this.quadrantBreakdownForm.get("acadamicProgrammeID");
  }
  get CurriculumId() {
    return this.quadrantBreakdownForm.get("CurriculumId");
  }
  get remark() {
    return this.quadrantBreakdownForm.get("remark");
  }

  getCourseList() {
    if (!this.curriculumId || !this.quadrantId) {
      return;
    }

    const token = ++this.courseLoadToken;
    const curriculumId = this.curriculumId;
    const quadrantId = this.quadrantId;
    this.isLoadingCourses = true;

    this._curriculumQuadrantBreakdownService
      .getListOfUnRegisteredCourseById(curriculumId, quadrantId)
      .subscribe({
        next: (res: any) => {
          if (token !== this.courseLoadToken) {
            return;
          }

          const available = (res || []).map((course) => this.mapCourseTransferItem(course, 'left'));
          this._curriculumQuadrantBreakdownService.getSavedCourses(curriculumId, quadrantId).subscribe({
            next: (savedResponse: any) => {
              if (token !== this.courseLoadToken) {
                return;
              }
              this.applyCourseLists(available, savedResponse, token);
            },
            error: () => {
              if (token !== this.courseLoadToken) {
                return;
              }
              this.applyCourseLists(available, [], token);
              this._customNotificationService.notification(
                'error',
                'Error',
                'Failed to load selected courses for this quadrant.'
              );
            }
          });
        },
        error: () => {
          if (token !== this.courseLoadToken) {
            return;
          }
          this.isLoadingCourses = false;
          this.resetCourseSelection();
          this._customNotificationService.notification(
            'error',
            'Error',
            'Failed to load available courses for this quadrant.'
          );
        }
      });
  }

  private applyCourseLists(available: TransferItem[], savedResponse: any, token: number): void {
    const savedItems = Array.isArray(savedResponse)
      ? savedResponse
      : (savedResponse?.data || []);

    this.numberOfSaveQuadrantCourse = savedItems.length;
    const selected = savedItems.map((item: any) => this.mapCourseTransferItem({
      id: item.courseId || item.CourseId,
      courseCode: item.courseCode || item.CourseCode,
      courseTitle: item.courseTitle || item.CourseTitle,
      creditHours: item.creditHours || item.CreditHours
    }, 'right'));

    if (selected.length > 0) {
      this.id = savedItems[0].parentId || savedItems[0].ParentId || this.id;
    }

    const selectedKeySet = new Set(selected.map((item) => String(item['key']).toLowerCase()));
    const mergedAvailable = available.filter(
      (item) => !selectedKeySet.has(String(item['key']).toLowerCase())
    );

    this.targetList = [...selected];
    this.numberOfSelectiveCourse = selected.length;
    this.updateTargetCourseIds();
    this.sortTargetList();

    this.listOfUnregisteredCourse = [];
    this.targetKeys = [];
    this.transferVersion++;
    this.cdr.detectChanges();

    this.ngZone.run(() => {
      setTimeout(() => {
        if (token !== this.courseLoadToken) {
          return;
        }
        this.listOfUnregisteredCourse = [...mergedAvailable, ...selected]
          .sort((a, b) => String(a['courseCode']).localeCompare(String(b['courseCode'])));
        this.numberOfCourseList = this.listOfUnregisteredCourse.length;
        this.targetKeys = [...this.targetCourseIds];
        this.isLoadingCourses = false;
        this.cdr.detectChanges();
      });
    });
  }

  getCurriculumsList(id: string) {
    this._curriculumQuadrantBreakdownService
      .getListOfCurriculumByProgramId(id)
      .subscribe((res: any) => {
        this.curricula = res;
      });
  }

  getQuadrantsList() {
    if (!this.curriculumCode) {
      this.quadrants = [];
      return;
    }
    this._curriculumQuadrantBreakdownService
      .getQuadratListByCurriculumCode(this.curriculumCode)
      .subscribe((res: any) => {
        const list = Array.isArray(res) ? res : (res?.data || []);
        this.quadrants = (list || []).map((item: any) => ({
          ...item,
          id: this.getQuadrantOptionId(item)
        }));
        this.applySelectedQuadrant();
      });
  }

  private getQuadrantBreakdown(): CurriculumBreakdown {
    const formModel = this.quadrantBreakdownForm.getRawValue();
    const course = new CurriculumBreakdown();
    course.id = this.id;
    course.quadrantId = formModel.quadrantsId || this.quadrantId;
    course.curriculumId = this.curriculumId;
    course.minimumCreditHours = formModel.minimumCreditHours;
    course.remark = formModel.remark;
    return course;
  }

  submitForm() {
    if (this.isSubmitting || this.isLoadingCourses) {
      return;
    }
    const selectiveCourseId = [...new Set(this.targetList.map(item => item['key']))];
    const postData = this.getQuadrantBreakdown();
    postData.courseId = selectiveCourseId;
    if (this.numberOfSelectiveCourse === 0) {
      this._customNotificationService.notification(
        "error",
        "Courses Required",
        "Please select at least one course."
      );
      return;
    }
    if (this.selectedCreditHours < this.minimumCreditHoursRequired) {
      this._customNotificationService.notification(
        "error",
        "Credit Hours",
        `Selected total credit hours (T=${this.selectedCreditHours}) must be at least ${this.minimumCreditHoursRequired}.`
      );
      return;
    }
    if (this.quadrantBreakdownForm.valid || (this.isQuadrantLocked && this.quadrantBreakdownForm.getRawValue().minimumCreditHours != null)) {
      this.isSubmitting = true;
      if (this.id == 0) {
        this._curriculumQuadrantBreakdownService.createCurriculumBreakdown(postData).subscribe({
          next: (res) => {
            if (res?.status === 'success' || (res && !res.status)) {
              this._customNotificationService.notification("success", "Success", res.data);
              this._route.navigateByUrl(
                `/curricula/quadrant-break-down?id=${this.curriculumId}&code=${this.curriculumCode}&programme=${this.programCode}&mode=edit`
              );
              return;
            }
            this.isSubmitting = false;
            this._customNotificationService.notification(
              "error",
              "Error",
              res?.data || "Failed to save quadrant breakdown."
            );
          },
          error: () => {
            this.isSubmitting = false;
            this._customNotificationService.notification(
              "error",
              "Error",
              "Failed to save quadrant breakdown."
            );
          }
        });
      } else {
        this._curriculumQuadrantBreakdownService.update(this.id, postData).subscribe({
          next: (res) => {
            if (res?.status === 'success' || (res && !res.status)) {
              this._customNotificationService.notification(
                "success",
                "Success",
                res.data || "Quadrant breakdown updated successfully."
              );
              this._route.navigateByUrl(
                `/curricula/quadrant-break-down?id=${this.curriculumId}&code=${this.curriculumCode}&programme=${this.programCode}&mode=edit`
              );
              return;
            }
            this.isSubmitting = false;
            this._customNotificationService.notification(
              "error",
              "Error",
              res?.data || "Failed to update quadrant breakdown."
            );
          },
          error: () => {
            this.isSubmitting = false;
            this._customNotificationService.notification(
              "error",
              "Error",
              "Failed to update quadrant breakdown."
            );
          }
        });
      }
    }
  }

  filterOption(inputValue: string, item: any): boolean {
    inputValue = inputValue.toLowerCase();
    const lowerCaseTitle = item.title.toLowerCase();
    return lowerCaseTitle.includes(inputValue);
  }

  search(ret: {}): void {
  }

  select(event: any): void {
  }

  onTransferChange(e: TransferChange): void {
    if (e.to === 'right' && e.from === 'left') {
      const moved: TransferItem[] = e.list.map(item => ({
        ...item,
        direction: 'right' as TransferDirection
      }));
      this.targetList = this.targetList.concat(moved);
      this.numberOfSelectiveCourse = this.targetList.length;
      this.sortTargetList();
    } else if (e.to === 'left' && e.from === 'right') {
      const removedCourseIds = e.list.map(item => String(item['key']));
      this.targetList = this.targetList.filter(item => !removedCourseIds.includes(String(item['key'])));
      this.numberOfSelectiveCourse = this.targetList.length;
      this.sortTargetList();
    }
    this.updateTargetCourseIds();
    this.targetKeys = [...this.targetCourseIds];
    this.cdr.detectChanges();
  }

  updateTargetCourseIds(): void {
    this.targetCourseIds = this.targetList.map(item => String(item['key']));
  }

  loadBreakdownMeta() {
    this._curriculumQuadrantBreakdownService
      .getCurriculumQuadrantBreakdownByCurriculumId(this.curriculumId)
      .subscribe((res: any[]) => {
        const match = (res || []).find(
          (q: any) =>
            (q.quadrantsID || q.quadrantsId || "").toString().toLowerCase() ===
            (this.quadrantId || "").toString().toLowerCase()
        );
        if (match) {
          this.id = match.id || this.id;
          this.quadrantBreakdownForm.patchValue({
            minimumCreditHours: match.minimumCreditHours ?? 0,
            remark: match.remark || ""
          });
        } else if (!this.isQuadrantLocked) {
          this.quadrantBreakdownForm.patchValue({
            minimumCreditHours: 0,
            remark: ""
          });
        }
      });
  }

  sortTargetList(): void {
    this.targetList.sort((a, b) => a['courseCode'].localeCompare(b['courseCode']));
  }

  get selectedCreditHours(): number {
    return this.targetList.reduce((total, item) => total + (Number(item['creditHours']) || 0), 0);
  }

  get minimumCreditHoursRequired(): number {
    const value = Number(this.quadrantBreakdownForm?.getRawValue()?.minimumCreditHours);
    return isNaN(value) ? 0 : value;
  }

  get transferTitles(): string[] {
    return [
      'Available Courses',
      `Selected Courses (T = ${this.selectedCreditHours})`
    ];
  }

  applyTotalAsMinimum(): void {
    this.quadrantBreakdownForm.patchValue({
      minimumCreditHours: this.selectedCreditHours
    });
    this.cdr.detectChanges();
  }

  private mapCourseTransferItem(course: any, direction: 'left' | 'right' = 'left'): TransferItem {
    const creditHours = Number(course?.creditHours ?? course?.CreditHours ?? 0) || 0;
    const courseCode = course?.courseCode || course?.CourseCode || '';
    const courseTitle = course?.courseTitle || course?.CourseTitle || '';
    const key = String(course?.id || course?.ID || course?.courseId || course?.CourseId || '');
    return {
      key,
      title: `${courseCode} - ${courseTitle} (${creditHours} cr)`,
      courseCode,
      courseTitle,
      creditHours,
      direction: direction as TransferDirection
    } as TransferItem;
  }

  goToCurriculum() {
    this._route.navigateByUrl(`/curricula`);
  }
}
