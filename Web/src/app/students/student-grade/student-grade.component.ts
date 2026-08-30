import { Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { NzModalService } from "ng-zorro-antd/modal";
import { StudentGradeViewModel } from "src/app/Models/StudentGradeViewModel";
import { ColumnItem } from "src/app/curricula/models/ColumnItem";
import { CustomNotificationService } from "src/app/services/custom-notification.service";
import { StudentGradeService } from "../services/student-grade.service";
import { PaginatorService, ServerPaginator } from "src/app/reports/services/paginator.service";

@Component({
  selector: "app-student-grade",
  templateUrl: "./student-grade.component.html",
  styleUrls: ["./student-grade.component.scss"]
})
export class StudentGradeComponent implements OnInit, OnDestroy {
  studentGrades?: StudentGradeViewModel[];
  reqId = "";
  checked = false;
  selectedValue = "";
  academicPrograms: any;
  batches: any;
  academicTerms: any;
  courses: any;
  gradeQueryForm: FormGroup;
  uploadFile: any;
  @ViewChild("fileInput") fileInput: any;
  working = false;
  uploadFileLabel: string | undefined = "Choose an Excel to upload";
  uploadProgress: number | undefined;
  uploadUrl: string | undefined;
  userId: string = "";
  pager: ServerPaginator;
  
  // Filter properties
  selectedBatchCode: string = "";
  selectedCourse: string = "";
  selectedAcademicTerm: string = "";
  filteredStudentGrades: StudentGradeViewModel[] = [];
  
  // Updated columns to match StudentGradeViewModel properties exactly
  listOfColumns: ColumnItem[] = [
    {
      name: "Student Code",
      sortOrder: null,
      sortFn: (a: StudentGradeViewModel, b: StudentGradeViewModel) =>
        a.studentCode.localeCompare(b.studentCode),
      sortDirections: ["ascend", "descend", null],
      filterMultiple: true,
      listOfFilter: [],
      filterFn: (list: string[], item: StudentGradeViewModel) =>
        list.some(name => item.studentCode.indexOf(name) !== -1)
    },
    {
      name: "Full Name",
      sortOrder: null,
      sortFn: (a: StudentGradeViewModel, b: StudentGradeViewModel) =>
        a.fullName.localeCompare(b.fullName),
      sortDirections: ["ascend", "descend", null],
      filterMultiple: true,
      listOfFilter: [],
      filterFn: (list: string[], item: StudentGradeViewModel) =>
        list.some(name => item.fullName.indexOf(name) !== -1)
    },
    {
      name: "Course",
      sortOrder: "descend",
      sortFn: (a: StudentGradeViewModel, b: StudentGradeViewModel) =>
        a.course.localeCompare(b.course),
      sortDirections: ["descend", null],
      filterMultiple: true,
      listOfFilter: [],
      filterFn: (list: string[], item: StudentGradeViewModel) =>
        list.some(name => item.course.indexOf(name) !== -1)
    },
    {
      name: "Instructor",
      sortOrder: null,
      sortDirections: ["ascend", "descend", null],
      sortFn: (a: StudentGradeViewModel, b: StudentGradeViewModel) => 
        a.instructor.localeCompare(b.instructor),
      filterMultiple: false,
      listOfFilter: [],
      filterFn: null
    },
    {
      name: "Grade",
      sortOrder: "descend",
      sortFn: (a: StudentGradeViewModel, b: StudentGradeViewModel) => 
        a.grade.localeCompare(b.grade),
      sortDirections: ["descend", null],
      listOfFilter: [],
      filterFn: null,
      filterMultiple: true
    },
    {
      name: "Total Mark",
      sortOrder: null,
      sortDirections: ["ascend", "descend", null],
      sortFn: (a: StudentGradeViewModel, b: StudentGradeViewModel) => 
        (a.totalMark || 0) - (b.totalMark || 0),
      filterMultiple: false,
      listOfFilter: [],
      filterFn: null
    },
    {
      name: "Batch Code",
      sortOrder: null,
      sortDirections: ["ascend", "descend", null],
      sortFn: (a: StudentGradeViewModel, b: StudentGradeViewModel) => 
        a.batchCode.localeCompare(b.batchCode),
      filterMultiple: false,
      listOfFilter: [],
      filterFn: null
    },
    {
      name: "Academic Term",
      sortOrder: null,
      sortDirections: ["ascend", "descend", null],
      sortFn: (a: StudentGradeViewModel, b: StudentGradeViewModel) => 
        a.academicTerm.localeCompare(b.academicTerm),
      filterMultiple: false,
      listOfFilter: [],
      filterFn: null
    },
    {
      name: "Submission Date",
      sortOrder: null,
      sortDirections: ["ascend", "descend", null],
      sortFn: (a: StudentGradeViewModel, b: StudentGradeViewModel) => 
        a.submissionDate.localeCompare(b.submissionDate),
      filterMultiple: false,
      listOfFilter: [],
      filterFn: null
    }
  ];
  
  constructor(
    private _customNotificationService: CustomNotificationService,
    private modal: NzModalService,
    private _fb: FormBuilder,
    private _route: Router,
    private _studentGradeService: StudentGradeService,
    private paginator: PaginatorService
  ) {
    this.pager = this.paginator.create();
    this.gradeQueryForm = this._fb.group({
      academicProgrammeCode: ["", Validators.required],
      batchCode: ["", Validators.required],
      termCode: ["", Validators.required],
      courseCode: [""],
      studentId: [""]
    });
  }

  ngOnInit(): void {
    this.userId = localStorage.getItem("userId") || "";
    this.pager.init(() => this.fetchStudentGrades());
    this.fetchStudentGrades();
  }

  ngOnDestroy(): void {
    this.pager.destroy();
  }

  fetchStudentGrades() {
    if (!this.userId) {
      this._customNotificationService.notification('error', 'Error', 'User ID not found. Please login again.');
      this.pager.fail();
      return;
    }

    this.pager.loading = true;
    this._studentGradeService.getStudentGradesPaginated(this.userId, this.pager.query({
      batchCode: this.selectedBatchCode,
      course: this.selectedCourse,
      academicTerm: this.selectedAcademicTerm
    })).subscribe({
      next: (res: any) => {
        this.studentGrades = res.data || [];
        this.filteredStudentGrades = this.studentGrades;
        this.pager.applyResult(res);
        this.populateFilterOptions();
      },
      error: () => {
        this.studentGrades = [];
        this.filteredStudentGrades = [];
        this.pager.fail();
        this._customNotificationService.notification('error', 'Error', 'Failed to load student grades');
      }
    });
  }

  gradeQueryFormSubmit() {
    if (this.gradeQueryForm.valid) {
      this.pager.loading = true;
      this._studentGradeService.getStudentGradesByQuery(this.gradeQueryForm.value).subscribe({
        next: (res: StudentGradeViewModel[]) => {
          this.studentGrades = Array.isArray(res) ? res : [];
          this.filteredStudentGrades = [...this.studentGrades];
          this.pager.loading = false;
        },
        error: (error) => {
          console.error('Error fetching grades by query:', error);
          this._customNotificationService.notification('error', 'Error', 'Failed to fetch grades');
          this.studentGrades = [];
          this.filteredStudentGrades = [];
          this.pager.loading = false;
        }
      });
    } else {
      this._customNotificationService.notification('warning', 'Warning', 'Please fill all required fields');
    }
  }
  
  showDeleteConfirm(id: any) {
    this.modal.confirm({
      nzTitle: 'Are you sure you want to delete this grade?',
      nzContent: 'This action cannot be undone.',
      nzOkText: 'Yes',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {},
      nzCancelText: 'No',
    });
  }
  
  exportGrades() {
    this._customNotificationService.notification('info', 'Info', 'Export feature coming soon');
  }
  
  gradeReport(studentCode: any) {
    this.gradeQueryForm.value["studentId"] = studentCode;
    localStorage.setItem(
      "report-query",
      JSON.stringify(this.gradeQueryForm.value)
    );
    this._route.navigateByUrl("students/student-grade-report");
  }
  
  handleFileInput(files: any) {
    this.uploadFile = files;
  }

  upload() {
    if (!this.uploadFile) {
      this._customNotificationService.notification('warning', 'Warning', 'Choose a file to upload first');
      return;
    }
    
    let fileList = <FileList>this.uploadFile.target.files;
    let formData = new FormData();
    Array.from(fileList).forEach(file => {
      formData.append("data", file);
    });
    
    this.working = true;
    this._studentGradeService.uploadGrades(formData).subscribe({
      next: (response) => {
        this._customNotificationService.notification('success', 'Success', 'Grades uploaded successfully');
        this.fetchStudentGrades(); // Refresh the list
        this.working = false;
      },
      error: (error) => {
        console.error('Upload error:', error);
        this._customNotificationService.notification('error', 'Error', 'Failed to upload grades');
        this.working = false;
      }
    });
  }
  
  clickSearchKey() {
    this.pager.onSearch(this.pager.searchKey);
  }

  paginatedIndexEvent(event: any) {
    this.pager.onPageIndexChange(event);
  }
  
  paginatedSizeEvent(event: any) {
    this.pager.onPageSizeChange(event);
  }
  
  populateFilterOptions(): void {
    if (!this.studentGrades || !Array.isArray(this.studentGrades)) {
      return;
    }
    
    this.listOfColumns.forEach(column => {
      if (column.name === "Student Code") {
        const values = new Set<string>();
        this.studentGrades.forEach(data => {
          if (data && data.studentCode) {
            values.add(data.studentCode);
          }
        });
        column.listOfFilter = Array.from(values).map(value => ({
          text: value,
          value
        }));
      } else if (column.name === "Course") {
        const values = new Set<string>();
        this.studentGrades.forEach(data => {
          if (data && data.course) {
            values.add(data.course);
          }
        });
        column.listOfFilter = Array.from(values).map(value => ({
          text: value,
          value
        }));
      } else if (column.name === "Full Name") {
        const values = new Set<string>();
        this.studentGrades.forEach(data => {
          if (data && data.fullName) {
            values.add(data.fullName);
          }
        });
        column.listOfFilter = Array.from(values).map(value => ({
          text: value,
          value
        }));
      } else if (column.name === "Grade") {
        const values = new Set<string>();
        this.studentGrades.forEach(data => {
          if (data && data.grade) {
            values.add(data.grade);
          }
        });
        column.listOfFilter = Array.from(values).map(value => ({
          text: value,
          value
        }));
      } else if (column.name === "Instructor") {
        const values = new Set<string>();
        this.studentGrades.forEach(data => {
          if (data && data.instructor) {
            values.add(data.instructor);
          }
        });
        column.listOfFilter = Array.from(values).map(value => ({
          text: value,
          value
        }));
      }
    });
  }

  // Filter methods
  onBatchCodeFilterChange(value: string): void {
    this.selectedBatchCode = value;
    this.pager.onFilterChange();
  }

  onCourseFilterChange(value: string): void {
    this.selectedCourse = value;
    this.pager.onFilterChange();
  }

  onAcademicTermFilterChange(value: string): void {
    this.selectedAcademicTerm = value;
    this.pager.onFilterChange();
  }

  applySearchAndFilters(): void {
    this.pager.onSearch(this.pager.searchKey);
  }

  applyFilters(): void {
    this.pager.onFilterChange();
  }

  clearFilters(): void {
    this.selectedBatchCode = "";
    this.selectedCourse = "";
    this.selectedAcademicTerm = "";
    this.pager.searchKey = "";
    this.pager.onSearch("");
  }

  getUniqueBatchCodes(): string[] {
    if (!this.studentGrades) return [];
    return [...new Set(this.studentGrades.map(grade => grade.batchCode))].sort();
  }

  getUniqueCourses(): string[] {
    if (!this.studentGrades) return [];
    return [...new Set(this.studentGrades.map(grade => grade.course))].sort();
  }

  getUniqueAcademicTerms(): string[] {
    if (!this.studentGrades) return [];
    return [...new Set(this.studentGrades.map(grade => grade.academicTerm))].sort();
  }
}
