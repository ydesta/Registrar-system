import { ChangeDetectorRef, Component, NgZone, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { CurriculumQuadrantBreakdownService } from "src/app/graduation-requirement/services/curriculum-quadrant-breakdown.service";
import { CurriculumBreakdown } from "../../models/CurriculumBreakdown";
import { ActivatedRoute, Router } from "@angular/router";
import { CustomNotificationService } from "src/app/services/custom-notification.service";
import { Course } from "../../models/curriculum-breakdown.model";
import { AcademicProgrammeService } from "src/app/acadamic-programme/services/academic-programme.service";
import { TransferChange, TransferItem } from "ng-zorro-antd/transfer";
import { BehaviorSubject, Subject } from "rxjs";

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
  listOfUnregisteredCourse: any[] = [];
  numberOfCourseList = 0;
  selectiveId: string[] = [];
  quadrants: any;
  submit = "Save";
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
  curriculumId: string;
  numberOfSaveQuadrantCourse = 0;
  quadrantId: string;
  targetCourseIds$ = new BehaviorSubject<string[]>([]);
  curriculumCode: '';
  programCode: ''

  currentQuadrant: string;
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
    })
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
        this.targetList = [];
        this.targetCourseIds$.next([]);
        this.id = 0
        this.getCourseList();

      }
    })
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
    })
  }
  getAcademicProgramme() {
    this._academicProgrammeService.getAcademicProgrammeList().subscribe((res: any) => {
      this.academicPrograms = res.data;
    });
  }

  getListOfUnRegisteredCourseById(Id: string, quadrantId: string) {
    this._curriculumQuadrantBreakdownService.getListOfUnRegisteredCourseById(Id, quadrantId).subscribe(res => {
      this.numberOfCourseList = res.length;
      this.listOfUnregisteredCourse = res.map((course) => ({
        key: course.id,
        title: `${course.courseCode} - ${course.courseTitle}`,
        courseCode: course.courseCode,
        courseTitle: course.courseTitle,
      }));
      this.listOfUnregisteredCourse.sort((a, b) => a.courseCode.localeCompare(b.courseCode));
    })
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
    this._curriculumQuadrantBreakdownService
      .getListOfUnRegisteredCourseById(this.curriculumId, this.quadrantId)
      .subscribe((res: any) => {
        this.numberOfCourseList = res.length;
        this.listOfUnregisteredCourse = res.map((course) => ({
          key: course.id,
          title: `${course.courseCode} - ${course.courseTitle}`,
          courseCode: course.courseCode,
          courseTitle: course.courseTitle,
        }));
        this.listOfUnregisteredCourse.sort((a, b) => a.courseCode.localeCompare(b.courseCode));
        if (this.numberOfCourseList > 0) {
          this.targetList = [];
          this.updateTargetCourseIds();
          this.sortTargetList();
          this.loadSavedCourses(this.curriculumId, this.quadrantId);
        }
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
    this._curriculumQuadrantBreakdownService
      .getQuadratList()
      .subscribe((res: any) => {
        this.quadrants = res.data;
      });
  }
  updateCheckedSetA(id: string, checked: boolean): void {
    if (checked) {
      this.setOfCheckedIdA.add(id);
    } else {
      this.setOfCheckedIdA.delete(id);
    }
  }

  refreshCheckedStatusA(): void {
    const listOfEnabledData = this.listOfCurrentPageDataA.filter(({ disabled }) => !disabled);
    this.checkedA = listOfEnabledData.every(({ id }) => this.setOfCheckedIdA.has(id));
    this.indeterminateA = listOfEnabledData.some(({ id }) => this.setOfCheckedIdA.has(id)) && !this.checkedA;
  }

  onItemCheckedA(id: string, checked: boolean): void {
    this.updateCheckedSetA(id, checked);
    this.refreshCheckedStatusA();
  }

  onAllCheckedA(checked: boolean): void {
    this.listOfCurrentPageDataA
      .filter(({ disabled }) => !disabled)
      .forEach(({ id }) => this.updateCheckedSetA(id, checked));
    this.refreshCheckedStatusA();
  }

  onCurrentPageDataChangeA(listOfCurrentPageData: readonly any[]): void {
    this.listOfCurrentPageDataA = listOfCurrentPageData;
    this.refreshCheckedStatusA();
  }
  private getQuadrantBreakdown(): CurriculumBreakdown {
    const formModel = this.quadrantBreakdownForm.getRawValue();
    const course = new CurriculumBreakdown();
    course.id = this.id;
    course.quadrantId = formModel.quadrantsId;
    course.curriculumId = this.curriculumId;
    course.remark = formModel.remark;
    return course;
  }
  submitForm() {
    const selectiveCourseId = [...new Set(this.targetList.map(item => item['key']))];
    const postData = this.getQuadrantBreakdown();
    postData.courseId = selectiveCourseId;
    if (this.quadrantBreakdownForm.valid) {
      if (this.id == 0) {
        this._curriculumQuadrantBreakdownService.createCurriculumBreakdown(postData).subscribe(res => {
          if (res) {
            this._customNotificationService.notification(
              "success",
              "Success",
              res.data
            );
            this.createQuadrantBreakdown();
            this.numberOfCourseList = 0;
            const id = 0;
            this.acadamicProgrammeID.patchValue(this.programCode);
            this.CurriculumId.patchValue(this.curriculumCode);
            location.reload();
            // this._route.navigateByUrl(
            //   `curricula/curriculum-break-down-form?id=${id}&&curriculum-id=${this.curriculumId}&&curriculum-code=${this.curriculumCode}&&program=${this.programCode}`
            // );

          } else {
            this._customNotificationService.notification(
              "success",
              "Duplication Not Allowed",
              res.data
            );
          }
        });
      } else {
        this._curriculumQuadrantBreakdownService.update(this.id, postData).subscribe(res => {
          if (res) {
            this._customNotificationService.notification(
              "success",
              "Success",
              res.data
            );
            this.createQuadrantBreakdown();
            this.numberOfCourseList = 0;
            const id = 0;
            this.acadamicProgrammeID.patchValue(this.programCode);
            this.CurriculumId.patchValue(this.curriculumCode);
            location.reload();
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

  change(ret: any): void {
    const selectedItem = ret.list.map((item) => item.key)
  }
  onTransferChange(e: TransferChange): void {
    if (e.to === 'right' && e.from === 'left') {
      this.targetList = this.targetList.concat(e.list);
      this.numberOfSelectiveCourse = this.targetList.length;
      this.sortTargetList();
    } else if (e.to === 'left' && e.from === 'right') {
      const removedCourseIds = e.list.map(item => item['key']);
      this.targetList = this.targetList.filter(item => !removedCourseIds.includes(item['key']));
      this.numberOfSelectiveCourse = this.targetList.length;
      this.sortTargetList();
    }
    this.ngZone.runOutsideAngular(() => {
      setTimeout(() => {
        this.targetCourseIds$.next(this.targetCourseIds);
      });
    });
    this.cdr.detectChanges();
  }
  updateTargetCourseIds(): void {
    this.targetCourseIds = this.targetList.map(item => item['key']);
  }

  loadSavedCourses(curId: string, quadrantId: string) {
    this._curriculumQuadrantBreakdownService.getSavedCourses(curId, quadrantId).subscribe(savedItems => {
      this.numberOfSaveQuadrantCourse = savedItems.length;
      if (this.numberOfSaveQuadrantCourse > 0) {
        this.id = savedItems[0].parentId;
        this.targetList = savedItems.map(item => ({
          key: item.courseId,
          title: `${item.courseCode} - ${item.courseTitle}`,
          courseCode: item.courseCode,
          courseTitle: item.courseTitle,
        }));
        //this.targetCourseIds$.next(this.targetList.map(item => item['key']));
        this.updateTargetCourseIds();
        this.sortTargetList();
      }
      // this.cdr.detectChanges();
    });
  }

  sortTargetList(): void {
    this.targetList.sort((a, b) => a['courseCode'].localeCompare(b['courseCode']));
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
  goToCurriculum() {
    this._route.navigateByUrl(`/curricula`);
  }

}