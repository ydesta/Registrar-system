import { ChangeDetectorRef, Component, NgZone, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { StaticData } from "src/app/admission-request/model/StaticData";
import { CustomNotificationService } from "src/app/services/custom-notification.service";
import { CurriculumTermCourseBreakDownService } from "../../services/curriculum-term-course-break-down.service";
import {
  ACADEMIC_SEMESTER_LIST,
  ACADEMIC_YEAR_NUMBER_STATUS,
  alphabetsWithSpecialCharsValidator,
  numbersOnlyValidator
} from "src/app/common/constant";
import { CurriculumQuadrantBreakdownService } from "src/app/graduation-requirement/services/curriculum-quadrant-breakdown.service";
import { TransferChange, TransferDirection, TransferItem } from "ng-zorro-antd/transfer";
import { BehaviorSubject } from "rxjs";

@Component({
  selector: "app-curriculum-breakdown-form",
  templateUrl: "./curriculum-breakdown-form.component.html",
  styleUrls: ["./curriculum-breakdown-form.component.scss"]
})
export class CurriculumBreakdownFormComponent implements OnInit {
  action = "Add Curriculum Year Term Breakdown";
  curriculumBreakdownForm: FormGroup;
  progId: any;
  curricula: any;
  academicPrograms: any;
  courses: any[] = [];
  quadrants: any;
  submit = "Save";
  isLoading = false;
  listOfTermNumber: StaticData[] = [];
  listOfYearNumber: StaticData[] = [];
  listOfSelectedValue = [];
  disabled = false;
  targetList: TransferItem[] = [];
  targetCourseIds: string[] = [];
  numberOfSaveQuadrantCourse = 0;
  targetCourseIds$ = new BehaviorSubject<string[]>([]);
  numberOfSelectiveCourse = 0;
  curId = "";
  term = 0;
  year = 0;
  numberOfCourseList = 0;
  curriculumId = "";
  curriculumCode = "";
  programCode: ''
  private courseLoadToken = 0;
  constructor(
    public activeRoute: ActivatedRoute,
    private _route: Router,
    private _fb: FormBuilder,
    private _customNotificationService: CustomNotificationService,
    private _curriculumTermBreakdownService: CurriculumTermCourseBreakDownService,
    private _curriculumQuadrantBreakdownService: CurriculumQuadrantBreakdownService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {
    this.activeRoute.queryParams.subscribe(p => {
      this.progId = p["id"];
      this.curId = p["curriculum-id"];
      this.curriculumCode = p["curriculum-code"];
      this.programCode = p["program"];
      if (this.progId != 0) {
        this.action = "Edit Curriculum Breakdown";
        this.submit = "Update";
        this.getCurriculumTermBreakdownsById(this.progId);
      }
    });
    this.createBreakDown();
  }
  ngOnInit(): void {
    this.getQuadrantsList();
    this.getCurriculumsList();
    this.getListOfAcademicTermStatus();
    this.getListOfYearNumberStatus();
    this.academicProgrammeID.patchValue(this.programCode);
    this.CurriculumId.patchValue(this.curriculumCode);
    this.yearNumber.valueChanges.subscribe(res => {
      this.year = res;
      this.tryLoadCourses();
    });
    this.termNumber.valueChanges.subscribe(res => {
      this.term = res;
      this.tryLoadCourses();
    });
  }

  private tryLoadCourses(): void {
    if (this.curId && this.term && this.year) {
      this.resetCourseSelection();
      this.progId = 0;
      this.getCourseList();
    }
  }

  private resetCourseSelection(): void {
    this.targetList = [];
    this.targetCourseIds = [];
    this.numberOfSelectiveCourse = 0;
    this.numberOfSaveQuadrantCourse = 0;
    this.courses = [];
    this.numberOfCourseList = 0;
    this.targetCourseIds$.next([]);
  }
  getQuadrantsList() {
    if (!this.curriculumCode) {
      this.quadrants = [];
      return;
    }
    this._curriculumQuadrantBreakdownService
      .getQuadratListByCurriculumCode(this.curriculumCode)
      .subscribe((res: any) => {
        this.quadrants = res.data || [];
      });
  }

  getCurriculumsList() {
    this._curriculumQuadrantBreakdownService
      .getCurriculumList()
      .subscribe((res: any) => {
        this.curricula = res.data;
      });
  }

  // getCourseList() {
  //   this._curriculumTermBreakdownService
  //     .getListOfUnRegisteredCourse()
  //     .subscribe((res: any) => {
  //       this.courses = res;
  //     });
  // }

  getCourseList() {
    if (!this.curId || !this.term || !this.year) {
      return;
    }

    const token = ++this.courseLoadToken;
    const curId = this.curId;
    const term = this.term;
    const year = this.year;

    this._curriculumTermBreakdownService
      .getListOfUnRegisteredCourseById(curId, term, year)
      .subscribe({
        next: (res: any) => {
          if (token !== this.courseLoadToken) {
            return;
          }

          const available = (res || []).map((course) => this.mapCourseTransferItem(course, 'left'));
          this._curriculumTermBreakdownService.getSavedCourses(curId, term, year).subscribe({
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
            }
          });
        },
        error: () => {
          if (token !== this.courseLoadToken) {
            return;
          }
          this.resetCourseSelection();
          this._customNotificationService.notification(
            'error',
            'Error',
            'Failed to load courses for this year/term.'
          );
        }
      });
  }

  private applyCourseLists(available: TransferItem[], savedResponse: any, token: number): void {
    const savedItems = Array.isArray(savedResponse) ? savedResponse : (savedResponse?.data || []);
    this.numberOfSaveQuadrantCourse = savedItems.length;

    const selected = savedItems.map((item: any) => this.mapCourseTransferItem({
      id: item.courseId || item.CourseId,
      courseCode: item.courseCode || item.CourseCode,
      courseTitle: item.courseTitle || item.CourseTitle,
      creditHours: item.creditHours || item.CreditHours
    }, 'right'));

    if (selected.length > 0) {
      this.progId = savedItems[0].parentId || savedItems[0].ParentId || this.progId;
    }

    const selectedKeySet = new Set(selected.map((item) => String(item['key']).toLowerCase()));
    const mergedAvailable = available.filter(
      (item) => !selectedKeySet.has(String(item['key']).toLowerCase())
    );

    this.courses = [...mergedAvailable, ...selected]
      .sort((a, b) => String(a['courseCode']).localeCompare(String(b['courseCode'])));
    this.targetList = [...selected];
    this.numberOfSelectiveCourse = selected.length;
    this.numberOfCourseList = this.courses.length;
    this.updateTargetCourseIds();
    this.sortTargetList();
    this.cdr.detectChanges();

    setTimeout(() => {
      if (token !== this.courseLoadToken) {
        return;
      }
      this.targetCourseIds$.next([...this.targetCourseIds]);
      this.cdr.detectChanges();
    });
  }

  private mapCourseTransferItem(course: any, direction: TransferDirection = 'left'): TransferItem {
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
      direction
    } as TransferItem;
  }

  getCurriculumTermBreakdownsById(id: number) {
    this._curriculumTermBreakdownService
      .getCurriculumTermBreakdownById(id)
      .subscribe((res: any) => {
        this.patchValues(res.data);
      });
  }
  createBreakDown() {
    this.curriculumBreakdownForm = this._fb.group({
      CurriculumId: ["", Validators.required],
      academicProgrammeID: ["", Validators.required],
      courseId: ["", []],
      quadrantsId: ["", []],
      yearNumber: [0, [Validators.required, numbersOnlyValidator()]],
      termNumber: [0, [Validators.required, numbersOnlyValidator()]],
      createdBy: [""],
      lastModifiedBy: [""],
      remark: ["", [alphabetsWithSpecialCharsValidator()]]
    });
  }
  get academicProgrammeID() {
    return this.curriculumBreakdownForm.get("academicProgrammeID");
  }

  get remark() {
    return this.curriculumBreakdownForm.get("remark");
  }
  get termNumber() {
    return this.curriculumBreakdownForm.get("termNumber");
  }
  get yearNumber() {
    return this.curriculumBreakdownForm.get("yearNumber");
  }
  get quadrantsId() {
    return this.curriculumBreakdownForm.get("quadrantsId");
  }
  get CurriculumId() {
    return this.curriculumBreakdownForm.get("CurriculumId");
  }
  get courseId() {
    return this.curriculumBreakdownForm.get("courseId");
  }

  submitForm() {
    if (this.isLoading) return; // Prevent multiple submissions
    
    const selectiveCourseId = [
      ...new Set(this.targetList.map(item => item["key"]))
    ];
    this.courseId.setValue(selectiveCourseId);
    this.CurriculumId.setValue(this.curId);
    
    if (this.progId == 0) {
      if (this.curriculumBreakdownForm.valid) {
        this.isLoading = true;
        this.submit = "Saving...";
        
        this._curriculumTermBreakdownService
          .create(this.curriculumBreakdownForm.value)
          .subscribe({
            next: (res: any) => {
              this._customNotificationService.notification(
                "success",
                "Success",
                "Curriculum year term breakdown created successfully!"
              );
              this.createBreakDown();
              this.numberOfCourseList = 0;
              this.CurriculumId.setValue(this.curriculumCode);
              this.academicProgrammeID.setValue(this.programCode);
              this.yearNumber.reset();
              this.termNumber.reset();
              this.isLoading = false;
              this.submit = "Save";
              location.reload();
            },
            error: (error: any) => {
              this._customNotificationService.notification(
                "error",
                "Error",
                "Failed to create curriculum breakdown. Please try again."
              );
              this.isLoading = false;
              this.submit = "Save";
            }
          });
      } else {
        this._customNotificationService.notification(
          "error",
          "Validation Error",
          "Please fill in all required fields correctly."
        );
      }
    } else if (this.progId != 0) {
      if (this.curriculumBreakdownForm.valid) {
        this.isLoading = true;
        this.submit = "Updating...";
        
        this._curriculumTermBreakdownService
          .update(this.progId, this.curriculumBreakdownForm.value)
          .subscribe({
            next: (res: any) => {
              if (res) {
                this._customNotificationService.notification(
                  "success",
                  "Success",
                  "Curriculum year term breakdown updated successfully!"
                );
                this.createBreakDown();
                this.numberOfCourseList = 0;
                this.CurriculumId.setValue(this.curriculumCode);
                this.academicProgrammeID.setValue(this.programCode);
                this.yearNumber.reset();
                this.termNumber.reset();
                this.isLoading = false;
                this.submit = "Update";
                location.reload();
              } else {
                this._customNotificationService.notification(
                  "error",
                  "Error",
                  "Failed to update curriculum breakdown. Please try again."
                );
                this.isLoading = false;
                this.submit = "Update";
              }
            },
            error: (error: any) => {
              this._customNotificationService.notification(
                "error",
                "Error",
                "Failed to update curriculum breakdown. Please try again."
              );
              this.isLoading = false;
              this.submit = "Update";
            }
          });
      } else {
        this._customNotificationService.notification(
          "error",
          "Validation Error",
          "Please fill in all required fields correctly."
        );
      }
    }
  }
  patchValues(data: any) {
    this.curriculumBreakdownForm.patchValue({
      CurriculumId: data.curriculumId,
      courseId: data.courseId || [],
      quadrantsId: data.quadrantsID,
      yearNumber: data.yearNumber,
      termNumber: data.termNumber,
      createdBy: data.createdBy,
      lastModifiedBy: data.lastModifiedBy,
      remark: data.remark
    });

  }
  getListOfAcademicTermStatus() {
    let division: StaticData = new StaticData();
    ACADEMIC_SEMESTER_LIST.forEach(pair => {
      division = {
        Id: pair.Id,
        Description: pair.Description
      };
      this.listOfTermNumber.push(division);
    });
  }
  getListOfYearNumberStatus() {
    let division: StaticData = new StaticData();
    ACADEMIC_YEAR_NUMBER_STATUS.forEach(pair => {
      division = {
        Id: pair.Id,
        Description: pair.Description
      };
      this.listOfYearNumber.push(division);
    });
  }
  getDivisionStatusDescription(Id: any) {
    const program = this.listOfTermNumber.find(item => item.Id == Id);
    return program ? program.Description : "";
  }
  goToCurriculum() {
    this._route.navigateByUrl(`/curricula`);
  }
  loadSavedCourses(curId: string, term: number, year: number) {
    this._curriculumTermBreakdownService
      .getSavedCourses(curId, term, year)
      .subscribe(savedItems => {
        this.applyCourseLists(
          this.courses.filter(i => i['direction'] !== 'right'),
          savedItems,
          this.courseLoadToken
        );
      });
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

  change(ret: any): void {
    const selectedItem = ret.list.map(item => item.key);
  }
  onTransferChange(e: TransferChange): void {
    if (e.to === "right" && e.from === "left") {
      const moved: TransferItem[] = e.list.map(item => ({
        ...item,
        direction: 'right' as TransferDirection
      }));
      this.targetList = this.targetList.concat(moved);
      this.numberOfSelectiveCourse = this.targetList.length;
      this.sortTargetList();
    } else if (e.to === "left" && e.from === "right") {
      const removedCourseIds = e.list.map(item => String(item["key"]));
      this.targetList = this.targetList.filter(
        item => !removedCourseIds.includes(String(item["key"]))
      );
      this.numberOfSelectiveCourse = this.targetList.length;
      this.sortTargetList();
    }
    this.updateTargetCourseIds();
    this.ngZone.runOutsideAngular(() => {
      setTimeout(() => {
        this.targetCourseIds$.next([...this.targetCourseIds]);
      });
    });
    this.cdr.detectChanges();
  }
  updateTargetCourseIds(): void {
    this.targetCourseIds = this.targetList.map(item => String(item["key"]));
  }
  sortTargetList(): void {
    this.targetList.sort((a, b) =>
      a["courseCode"].localeCompare(b["courseCode"])
    );
  }

  get selectedCreditHours(): number {
    return this.targetList.reduce((total, item) => total + (Number(item["creditHours"]) || 0), 0);
  }
  transferSelected(): void {
    this.updateTargetCourseIds();
    this.sortTargetList();
    this.ngZone.runOutsideAngular(() => {
      setTimeout(() => {
        this.targetCourseIds$.next(this.targetCourseIds);
      });
    });
  }
}
