import { Component, OnDestroy, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { AcadamicProgramme } from "src/app/admission-request/model/acadamic-programme.model";
import { AcademicProgramRequestService } from "src/app/admission-request/services/academic-program-request.service";
import { BatchService } from "src/app/colleges/services/batch.service";
import { StudentViewModel } from "src/app/students/models/student-view-model.model";
import { StudentService } from "src/app/students/services/student.service";
import { BatchAssignModel } from "../models/batch-assign.model";
import { CustomNotificationService } from "src/app/services/custom-notification.service";
import { Router } from "@angular/router";
import { PaginatorService, ServerPaginator } from "src/app/reports/services/paginator.service";

@Component({
  selector: "app-assign-batch",
  templateUrl: "./assign-batch.component.html",
  styleUrls: ["./assign-batch.component.scss"]
})
export class AssignBatchComponent implements OnInit, OnDestroy {
  /**
 *
 */
  batchs: any;
  yearList: number[] = [];
  acadamicProgrammes: AcadamicProgramme[] = [];
  assignBatchForm: FormGroup;
  studentList: StudentViewModel[] = [];
  checked = false;
  setOfCheckedId = new Set<string>();
  listOfCurrentPageData: readonly any[] = [];
  indeterminate = false;
  loading = false;
  numberOfListOfStudent = 0;
  isSearchCollapsed = false;
  searchLoading = false;
  hasSearched = false;
  pager: ServerPaginator;
  
  constructor(
    private _batchServices: BatchService,
    private _academicProgramRequestService: AcademicProgramRequestService,
    private _fb: FormBuilder,
    private _studentServices: StudentService,
    private _customNotificationService: CustomNotificationService,
    private _route: Router,
    private paginator: PaginatorService
  ) {
    this.pager = this.paginator.create();
    const currentYear = new Date();
    this.yearList = this.getYearRange(currentYear.getFullYear());
    this.createAssignBatchForStudent();
  }
  
  ngOnInit(): void {
    this.pager.init(() => this.getUnAssignedBatchStudents());
    this.getBatchList();
    this.getAcademicProgramList();
  }

  ngOnDestroy(): void {
    this.pager.destroy();
  }

  goBack(): void {
    this._route.navigateByUrl("acadamic-programme");
  }

  toggleSearchForm(): void {
    // Only toggle the collapse state, don't trigger any search
    this.isSearchCollapsed = !this.isSearchCollapsed;
  }

  onSearchButtonClick(): void {
    this.pager.pageIndex = 1;
    this.setOfCheckedId.clear();
    this.getUnAssignedBatchStudents();
  }

  resetForm(): void {
    this.numberOfListOfStudent = 0;
    this.studentList = [];
    this.setOfCheckedId.clear();
    this.checked = false;
    this.indeterminate = false;
    this.isSearchCollapsed = false;
    this.hasSearched = false;
    this.pager.pageIndex = 1;
    this.pager.total = 0;
    this.pager.searchKey = '';
    this.assignBatchForm.patchValue({
      academicProgram: null,
      entryYear: null,
      batchCode: "",
      studentId: ""
    });
  }

  createAssignBatchForStudent() {
    this.assignBatchForm = this._fb.group({
      academicProgram: [null, [Validators.required]],
      entryYear: [null, [Validators.required]],
      batchCode: ["", []],
      studentId: ["", []]
    });
  }
  
  get batchCode() {
    return this.assignBatchForm.get("batchCode");
  }
  
  getBatchList() {
    this._batchServices.getBatchList().subscribe((res: any) => {
      this.batchs = res.data;
    });
  }
  
  getYearRange(CurrentYear: number) {
    const YeaList = [];
    const startYear = CurrentYear - 15;
    for (let i = startYear; i <= CurrentYear; i++) {
      YeaList.push(i);
    }
    return YeaList.reverse();
  }
  
  getAcademicProgramList() {
    this._academicProgramRequestService
      .getAacadamicPrgramtList()
      .subscribe(res => {
        this.acadamicProgrammes = res.data;
      });
  }
  
  getUnAssignedBatchStudents() {
    const formModel = this.assignBatchForm.getRawValue();
    if (!formModel.academicProgram || formModel.entryYear == null) {
      return;
    }
    this.searchLoading = true;
    this.hasSearched = true;
    this.pager.loading = true;
    this._studentServices
      .getUnAssignedBatchStudentsPaginated(
        formModel.academicProgram,
        formModel.entryYear,
        this.pager.query()
      )
      .subscribe({
        next: (res: any) => {
          this.studentList = res.data || [];
          this.pager.applyResult(res);
          this.numberOfListOfStudent = this.pager.total;
          this.refreshCheckedStatus();
          this.isSearchCollapsed = true;
          this.searchLoading = false;
        },
        error: () => {
          this.studentList = [];
          this.pager.fail();
          this.numberOfListOfStudent = 0;
          this.searchLoading = false;
        }
      });
  }
  
  submitForm() {
    const selectedStudentIds = Array.from(this.setOfCheckedId);
    const formModel = this.assignBatchForm.getRawValue();
    const studentBatchAssign = new BatchAssignModel();
    studentBatchAssign.batchCode = formModel.batchCode;
    studentBatchAssign.studentId = selectedStudentIds;
    this._studentServices.batchAssign(studentBatchAssign).subscribe(res => {
      if(res == true){
        this._customNotificationService.notification("success", "Successfully Batch Assigned",formModel.batchCode);
        this.setOfCheckedId.clear();
        this.pager.pageIndex = 1;
        this.getUnAssignedBatchStudents();
      }
     
    })
  }
  
  updateCheckedSet(id: string, checked: boolean): void {
    if (checked) {
      this.setOfCheckedId.add(id);
    } else {
      this.setOfCheckedId.delete(id);
    }
  }
  
  refreshCheckedStatus(): void {
    const listOfEnabledData = this.studentList.filter(item => item.id);
    this.checked = listOfEnabledData.length > 0 && listOfEnabledData.every(({ id }) => this.setOfCheckedId.has(id));
    this.indeterminate = listOfEnabledData.some(({ id }) => this.setOfCheckedId.has(id)) && !this.checked;
  }

  onItemChecked(id: string, checked: boolean): void {
    this.updateCheckedSet(id, checked);
    this.refreshCheckedStatus();
  }

  onAllChecked(checked: boolean): void {
    this.studentList
      .filter(item => item.id)
      .forEach(item => this.updateCheckedSet(item.id, checked));
    this.refreshCheckedStatus();
  }
  
  onCurrentPageDataChange(listOfCurrentPageData: readonly any[]): void {
    this.listOfCurrentPageData = listOfCurrentPageData;
    this.refreshCheckedStatus();
  }
}
