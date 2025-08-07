import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { CustomNotificationService } from "src/app/services/custom-notification.service";
import { StudentService } from "./services/student.service";
import { StudentProfileViewModel } from "./models/student-profile-view-model.model";
import { ConfirmationModalData } from "./components/student-confirmation-modal/student-confirmation-modal.component";

@Component({
  selector: "app-students",
  templateUrl: "./students.component.html",
  styleUrls: ["./students.component.scss"]
})
export class StudentsComponent implements OnInit {
  students: StudentProfileViewModel[] = [];
  loading = false;
  currentPage = 0;
  pageSize = 20;
  totalRowCount = 0;
  totalPageCount = 0;
  hasPrev = false;
  hasNext = false;
  searchForm: FormGroup;
  studentCode = "";
  batchCode = "";
  sortColumn = "studentid";
  sortOrder = "asc";
  academicTerms: any;
  courses: any;
  studentId = "";
  Math = Math;
  
  // Modal properties
  isModalVisible = false;
  modalData: ConfirmationModalData | null = null;

  constructor(
    private _customNotificationService: CustomNotificationService,
    private _studentService: StudentService,
    private _fb: FormBuilder,
    private _route: Router
  ) {
    this.searchForm = this._fb.group({
      studentCode: [""],
      batchCode: [""],
      sortColumn: ["studentid"],
      sortOrder: ["asc"]
    });
  }

  ngOnInit(): void {
    this.loadStudents();
  }

  loadStudents(pageIndex: number = 0) {
    this.loading = true;
    
    this._studentService
      .getStudentsPaginated(
        this.studentCode,
        this.batchCode,
        pageIndex,
        this.pageSize,
        this.sortColumn,
        this.sortOrder
      )
      .subscribe({
        next: (res: any) => {
          this.students = res.data;
          this.currentPage = res.currentPage;
          this.totalRowCount = res.totalRowCount;
          this.totalPageCount = res.totalPageCount;
          this.hasPrev = res.hasPrev;
          this.hasNext = res.hasNext;
          this.loading = false;
        },
        error: (error) => {
          this._customNotificationService.notification(
            "error",
            "Error",
            "Failed to load students"
          );
          this.loading = false;
        }
      });
  }

  onSearch() {
    this.studentCode = this.searchForm.get('studentCode')?.value || "";
    this.batchCode = this.searchForm.get('batchCode')?.value || "";
    this.currentPage = 0; 
    this.loadStudents();
  }

  onSort(column: string) {
    if (this.sortColumn === column) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortOrder = 'asc';
    }
    
    this.searchForm.patchValue({
      sortColumn: this.sortColumn,
      sortOrder: this.sortOrder
    });
    
    this.loadStudents();
  }

  onPageChange(pageIndex: number) {
    this.currentPage = pageIndex;
    this.loadStudents(pageIndex);
  }

  onPageSizeChange(newPageSize: number) {
    this.pageSize = newPageSize;
    this.currentPage = 0; 
    this.loadStudents();
  }

  clearSearch() {
    this.searchForm.reset({
      studentCode: "",
      batchCode: "",
      sortColumn: "studentid",
      sortOrder: "asc"
    });
    this.studentCode = "";
    this.batchCode = "";
    this.sortColumn = "studentid";
    this.sortOrder = "asc";
    this.currentPage = 0;
    this.loadStudents();
  }

  showDeleteConfirm(student: StudentProfileViewModel): void {
    this.modalData = {
      student,
      type: 'deactivate',
      title: 'Confirm Student Inactivation',
      okText: 'Yes, Mark as Inactive',
      cancelText: 'Cancel'
    };
    this.isModalVisible = true;
  }

  showActivateConfirm(student: StudentProfileViewModel): void {
    this.modalData = {
      student,
      type: 'activate',
      title: 'Confirm Student Activation',
      okText: 'Yes, Activate Student',
      cancelText: 'Cancel'
    };
    this.isModalVisible = true;
  }

  viewStudentProfile(studentId: string) {
    this._route.navigate(['/students/profile', studentId]);
  }

  editStudent(studentId: string) {
    this._route.navigate(['/students/edit', studentId]);
  }

  inactiveStudent(student: StudentProfileViewModel) {
    this.showDeleteConfirm(student);
  }

  activeStudent(student: StudentProfileViewModel) {
    this.showActivateConfirm(student);
  }

  onModalConfirmed(student: StudentProfileViewModel): void {
    this._studentService
      .deleteStudent(student.id)
      .subscribe((res: any) => {
        if (res.status == "success") {
          this._customNotificationService.notification(
            "success",
            "Success",
            res.data
          );
          this.loadStudents(); 
        }
        if (res.status == "error") {
          this._customNotificationService.notification(
            "error",
            "Error",
            res.data
          );
        }
      });
    this.isModalVisible = false;
  }

  onModalCancelled(): void {
    this.isModalVisible = false;
  }



  getSortIcon(column: string): string {
    if (this.sortColumn !== column) return 'sort';
    return this.sortOrder === 'asc' ? 'sort-ascending' : 'sort-descending';
  }

  getDisplayName(column: string): string {
    const columnNames: { [key: string]: string } = {
      'studentid': 'Student ID',
      'firstname': 'First Name',
      'fathername': 'Father Name',
      'grandfathername': 'Grand Father Name',
      'batchcode': 'Batch Code',
      'entryyear': 'Entry Year'
    };
    return columnNames[column] || column;
  }
}
