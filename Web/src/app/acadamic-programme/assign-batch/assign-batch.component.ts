import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { AcadamicProgramme } from "src/app/admission-request/model/acadamic-programme.model";
import { AcademicProgramRequestService } from "src/app/admission-request/services/academic-program-request.service";
import { BatchService } from "src/app/colleges/services/batch.service";
import { StudentViewModel } from "src/app/students/models/student-view-model.model";
import { StudentService } from "src/app/students/services/student.service";
import { BatchAssignModel } from "../models/batch-assign.model";
import { CustomNotificationService } from "src/app/services/custom-notification.service";
import { Router } from "@angular/router";

@Component({
  selector: "app-assign-batch",
  templateUrl: "./assign-batch.component.html",
  styleUrls: ["./assign-batch.component.scss"]
})
export class AssignBatchComponent implements OnInit {
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
  
  constructor(
    private _batchServices: BatchService,
    private _academicProgramRequestService: AcademicProgramRequestService,
    private _fb: FormBuilder,
    private _studentServices: StudentService,
    private _customNotificationService: CustomNotificationService,
    private _route: Router
  ) {
    const currentYear = new Date();
    this.yearList = this.getYearRange(currentYear.getFullYear());
    this.createAssignBatchForStudent();
  }
  
  ngOnInit(): void {
    this.getBatchList();
    this.getAcademicProgramList();
  }

  goBack(): void {
    this._route.navigateByUrl("acadamic-programme");
  }

  toggleSearchForm(): void {
    // Only toggle the collapse state, don't trigger any search
    this.isSearchCollapsed = !this.isSearchCollapsed;
  }

  onSearchButtonClick(): void {
    // Handle search button click specifically
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
    this.searchLoading = true;
    this.hasSearched = true;
    this._studentServices
      .getUnAssignedBatchStudents(
        formModel.academicProgram,
        formModel.entryYear
      )
      .subscribe({
        next: (res) => {
          this.numberOfListOfStudent = res.length;
          this.studentList = res;
          // Collapse the search form after successful search
          this.isSearchCollapsed = true;
          this.searchLoading = false;
        },
        error: (error) => {
          this.searchLoading = false;
          // Handle error if needed
          console.error('Error fetching unassigned students:', error);
        }
      });
  }
  
  submitForm() {
    const selectedStudentIds = this.studentList
      .filter(data => this.setOfCheckedId.has(data.id))
      .map(data => data.id);
    const formModel = this.assignBatchForm.getRawValue();
    const studentBatchAssign = new BatchAssignModel();
    studentBatchAssign.batchCode = formModel.batchCode;
    studentBatchAssign.studentId = selectedStudentIds;
    this._studentServices.batchAssign(studentBatchAssign).subscribe(res => {
      if(res == true){
        this._customNotificationService.notification("success", "Successfully Batch Assigned",formModel.batchCode);
        this._route.navigateByUrl("acadamic-programme/assign-batch");
        this.numberOfListOfStudent = 0;
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
    const listOfEnabledData = this.listOfCurrentPageData.filter(({ disabled }) => !disabled);
    this.checked = listOfEnabledData.every(({ id }) => this.setOfCheckedId.has(id));
    this.indeterminate = listOfEnabledData.some(({ id }) => this.setOfCheckedId.has(id)) && !this.checked;
  }

  onItemChecked(id: string, checked: boolean): void {
    this.updateCheckedSet(id, checked);
    this.refreshCheckedStatus();
  }

  onAllChecked(checked: boolean): void {
    this.listOfCurrentPageData
      .filter(({ disabled }) => !disabled)
      .forEach(({ id }) => this.updateCheckedSet(id, checked));
    this.refreshCheckedStatus();
  }
  
  onCurrentPageDataChange(listOfCurrentPageData: readonly any[]): void {
    this.listOfCurrentPageData = listOfCurrentPageData;
    this.refreshCheckedStatus();
  }
}
