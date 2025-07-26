import { Component, OnInit, ChangeDetectorRef } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { ACADEMIC_TERM_STATUS, numbersOnlyValidator } from "src/app/common/constant";
import { CustomNotificationService } from "src/app/services/custom-notification.service";
import { StudentService } from "../services/student.service";
import { TermCourseOfferingService } from "src/app/colleges/services/term-course-offering.service";
import { CourseOfferingInstructorAssignmentService } from "src/app/colleges/services/course-offering-instructor-assignment.service";
import { NzUploadChangeParam } from "ng-zorro-antd/upload";
import { StaticData } from "src/app/admission-request/model/StaticData";
import { StaffService } from "src/app/services/staff.service";
import { StaffModel } from "src/app/Models/StaffModel";

interface CustomFileList extends FileList {
  item: (index: number) => File | null;
}

interface ErrorItem {
  rowIndex: number;
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
  file_store: CustomFileList;
  file_list: Array<string> = [];
  importStudentGradeFile = "";
  staffList: any[] = [];
  courseList: any[] = [];
  yearList: number[] = [];
  listOfTermNumber: StaticData[] = [];
  currentYear = new Date();
  userId: string | null = localStorage.getItem('userId');
  listOfBatch: any[] = [];
  staffId: string | null;
  
  // Modal properties
  isErrorModalVisible = false;
  errorList: ErrorItem[] = [];
  
  constructor(
    private _fb: FormBuilder,
    private _customNotificationService: CustomNotificationService,
    private _studentService: StudentService,
    private _termCourseOfferingService: TermCourseOfferingService,
    private _courseOfferingInstructorAssignmentService: CourseOfferingInstructorAssignmentService,
    private _router: Router,
    private courseTermOfferingService: TermCourseOfferingService,
    private staffService: StaffService,
    private cdr: ChangeDetectorRef
  ) {

    this.createImportStudentGradeForm();
    this.yearList = this.getYearRange(this.currentYear.getFullYear());

  }

  ngOnInit(): void {
    this.getStaffList();
    this.getListOfAcademicTermStatus();
    this.getCourseList(this.userId);
    this.academicTermId.valueChanges.subscribe(res => {
      if (res) {
        this.academicTermYearId.valueChanges.subscribe(year => {
          if (year) {
            this.getListOfBatch(res, year);
          }
        })
      }
    });
    if (this.userId) {
      this.staffService.getStaffByUserId(this.userId).subscribe((res: any) => {
        this.staffId = res.data.id;
        this.importStudentGradeForm.patchValue({
          staffId: this.staffId
        });
      })
    }
  }

  private createImportStudentGradeForm(): void {
    this.importStudentGradeForm = this._fb.group({
      staffId: [null, [Validators.required]],
      courseId: ["", [Validators.required]],
      academicTermYearId: [0, [Validators.required, numbersOnlyValidator()]],
      ActualFile: ["", []],
      academicTermId: [null, [Validators.required]],
      batchCode: [null, [Validators.required]],
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
  private setupFormSubscriptions(): void {
    this.StaffId.valueChanges.subscribe(staffId => {
      if (staffId) {
        this.getCourseList(staffId);
      } else {
        this.courseList = [];
        this.courseId.setValue("");
      }
    });
  }

  private getYearRange(currentYear: number): number[] {
    const yearList = [];
    const startYear = currentYear - 15;
    for (let i = startYear; i <= currentYear; i++) {
      yearList.push(i);

    }
    return yearList.reverse();
  }

  private getStaffList(): void {
    this._termCourseOfferingService.getStaffList().subscribe(res => {
      this.staffList = res.data.map(staff => ({
        name: staff.firstName + " " + staff.lastName,
        id: staff.id
      }));
    });
  }

  private getCourseList(staffId: string): void {
    this._courseOfferingInstructorAssignmentService
      .getListOfAssignedCourses(staffId)
      .subscribe((res: any) => {
        this.courseList = res;
      });
  }

  get StaffId() {
    return this.importStudentGradeForm.get("StaffId");
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
  getListOfBatch(termId: number = 0, termYear: number = 0) {
    this.courseTermOfferingService.getListOfBatchCodeByAcademicTerm(termId, termYear).subscribe(res => {
      this.listOfBatch = res;
    });
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
            index < uploadedFiles.length ? uploadedFiles[index] : null
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
        this.file_store = undefined!;
      }
    }

    if (status === "done") {
    } else if (status === "error") {
    }
  }


  submitForm(): void {
    if (this.importStudentGradeForm.valid && this.canSave()) {
      this.prepareFormData();
      this._studentService.uploadGrade(this.formData).subscribe(res => {
        console.log('API Response:', res);
        
        // Check if there are errors in the response - multiple ways to detect errors
        const hasErrors = res && (
          (res.errors && res.errors.length > 0) ||
          (res.error && res.error.length > 0) ||
          (res.data && res.data.errors && res.data.errors.length > 0) ||
          (res.data && res.data.error && res.data.error.length > 0)
        );
        
        if (hasErrors) {
          // Extract errors from different possible locations in the response
          let errors = [];
          if (res.errors && res.errors.length > 0) {
            errors = res.errors;
          } else if (res.error && res.error.length > 0) {
            errors = res.error;
          } else if (res.data && res.data.errors && res.data.errors.length > 0) {
            errors = res.data.errors;
          } else if (res.data && res.data.error && res.data.error.length > 0) {
            errors = res.data.error;
          }
          
          console.log('Errors detected:', errors);
          this.errorList = errors;
          this.isErrorModalVisible = true;
          this.cdr.detectChanges(); // Force change detection to show modal immediately
          console.log('Modal should be visible now:', this.isErrorModalVisible);
        } else {
          // Success case
          console.log('No errors detected, showing success message');
          this._customNotificationService.notification(
            "success",
            "Success",
            "Grade upload completed successfully."
          );
          this._router.navigateByUrl(`/students/StudentGrades`);
        }
      }, error => {
        // Handle API errors
        console.error('API Error:', error);
        this._customNotificationService.notification(
          "error",
          "Error",
          "An error occurred while uploading grades. Please try again."
        );
      });
    } else {
      this._customNotificationService.notification(
        "error",
        "Error",
        "Please fill in all required fields and upload a file."
      );
    }
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
  canSave(): boolean {
    return (
      this.importStudentGradeForm.valid &&
      this.importStudentGradeForm.value.ActualFile !== ""
    );
  }
}
