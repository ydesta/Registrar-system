import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup } from "@angular/forms";
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
  selectedStudent: StudentProfileViewModel | null = null;
  loading = false;
  hasSearched = false;
  currentPage = 0;
  pageSize = 10;
  totalRowCount = 0;
  listFilter = "";
  searchForm: FormGroup;

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
      batchCode: [""]
    });
  }

  ngOnInit(): void {
    // Intentionally empty: no bulk load on open (performance).
  }

  get studentCodeValue(): string {
    return (this.searchForm.get("studentCode")?.value || "").trim();
  }

  get batchCodeValue(): string {
    return (this.searchForm.get("batchCode")?.value || "").trim();
  }

  get showMatchList(): boolean {
    return this.hasSearched && !this.loading && !this.selectedStudent && this.students.length > 0;
  }

  get filteredStudents(): StudentProfileViewModel[] {
    const key = (this.listFilter || "").trim().toLowerCase();
    if (!key) {
      return this.students;
    }
    return this.students.filter((s) => {
      const code = (s.studentCode || "").toLowerCase();
      const name = (s.fullName || "").toLowerCase();
      return code.includes(key) || name.includes(key);
    });
  }

  get isLargeBatchResult(): boolean {
    return this.totalRowCount >= 50 || (!this.studentCodeValue && this.totalRowCount > 1);
  }

  onSearch(resetPage = true): void {
    if (!this.studentCodeValue && !this.batchCodeValue) {
      this._customNotificationService.notification(
        "warning",
        "Search required",
        "Enter Student Code or Batch Code to find a student."
      );
      return;
    }

    if (resetPage) {
      this.currentPage = 0;
      this.listFilter = "";
    }

    this.hasSearched = true;
    this.selectedStudent = null;
    this.loading = true;

    this._studentService
      .getStudentsPaginated(
        this.studentCodeValue,
        this.batchCodeValue,
        this.currentPage,
        this.pageSize,
        "studentid",
        "asc"
      )
      .subscribe({
        next: (res: any) => {
          const rows = Array.isArray(res?.data) ? res.data : [];
          this.students = rows;
          this.totalRowCount = Number(res?.totalRowCount ?? rows.length) || 0;
          this.currentPage = Number(res?.currentPage ?? this.currentPage) || 0;
          this.loading = false;

          if (rows.length === 1 && this.totalRowCount <= 1) {
            this.selectedStudent = rows[0];
          }
        },
        error: () => {
          this.students = [];
          this.selectedStudent = null;
          this.totalRowCount = 0;
          this.loading = false;
          this._customNotificationService.notification(
            "error",
            "Error",
            "Failed to search students"
          );
        }
      });
  }

  onPageIndexChange(pageIndex1Based: number): void {
    this.currentPage = Math.max(0, pageIndex1Based - 1);
    this.onSearch(false);
  }

  onPageSizeChange(size: number): void {
    this.pageSize = Number(size) || 10;
    this.currentPage = 0;
    this.onSearch(false);
  }

  clearSearch(): void {
    this.searchForm.reset({
      studentCode: "",
      batchCode: ""
    });
    this.hasSearched = false;
    this.students = [];
    this.selectedStudent = null;
    this.loading = false;
    this.currentPage = 0;
    this.totalRowCount = 0;
    this.listFilter = "";
  }

  selectStudent(student: StudentProfileViewModel): void {
    this.selectedStudent = student;
  }

  backToMatches(): void {
    this.selectedStudent = null;
  }

  viewStudentProfile(studentId: string): void {
    this._route.navigate(["/students/profile", studentId]);
  }

  editStudent(studentId: string): void {
    this._route.navigate(["/students/edit", studentId]);
  }

  inactiveStudent(student: StudentProfileViewModel): void {
    this.modalData = {
      student,
      type: "deactivate",
      title: "Confirm Student Inactivation",
      okText: "Yes, Mark as Inactive",
      cancelText: "Cancel"
    };
    this.isModalVisible = true;
  }

  activeStudent(student: StudentProfileViewModel): void {
    this.modalData = {
      student,
      type: "activate",
      title: "Confirm Student Activation",
      okText: "Yes, Activate Student",
      cancelText: "Cancel"
    };
    this.isModalVisible = true;
  }

  onModalConfirmed(student: StudentProfileViewModel): void {
    this._studentService.deleteStudent(student.id).subscribe((res: any) => {
      if (res.status == "success") {
        this._customNotificationService.notification("success", "Success", res.data);
        this.onSearch(false);
      }
      if (res.status == "error") {
        this._customNotificationService.notification("error", "Error", res.data);
      }
    });
    this.isModalVisible = false;
  }

  onModalCancelled(): void {
    this.isModalVisible = false;
  }

  getNamePart(fullName: string | undefined, index: number): string {
    if (!fullName) {
      return "";
    }
    return fullName.trim().split(/\s+/)[index] || "";
  }
}
