import { HttpClient, HttpEventType, HttpRequest } from "@angular/common/http";
import { Component, OnInit, ViewChild } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { NzModalService } from "ng-zorro-antd/modal";
import { BaseModel } from "src/app/Models/BaseMode";
import { StudentGradeModel } from "src/app/Models/StudentGradeModel";
import { ColumnItem } from "src/app/curricula/models/ColumnItem";
import { CrudService } from "src/app/services/crud.service";
import { CustomNotificationService } from "src/app/services/custom-notification.service";
import { FilesService } from "src/app/services/files.service";

@Component({
  selector: "app-student-grade",
  templateUrl: "./student-grade.component.html",
  styleUrls: ["./student-grade.component.scss"]
})
export class StudentGradeComponent implements OnInit {
  studentGrades?: StudentGradeModel[];
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
  //uploadFile: File | null;
  uploadFileLabel: string | undefined = "Choose an Excel to upload";
  uploadProgress: number | undefined;
  uploadUrl: string | undefined;
  // apiUrl: any = "http://localhost:36201/api";
  apiUrl: any = "https://hilcoe.edu.et:36201/api";
  searchKey = "";
  pageindex = 1;
  pageSize = 5;
  sortOrder = "";
  sortColumn = "";
  pageSizeOption = [5, 10, 15, 25, 50, 100];
  totalRecord = 0;
  tbLoading = true;
  isLoading = false; // Added missing property
  listOfColumns: ColumnItem[] = [
    {
      name: "Student ID",
      sortOrder: null,
      sortFn: (a: any, b: any) =>
        a.student.studentId.localeCompare(b.student.studentId),
      sortDirections: ["ascend", "descend", null],
      filterMultiple: true,
      listOfFilter: [],
      filterFn: (list: string[], item: any) =>
        list.some(name => item.student.studentId.indexOf(name) !== -1)
    },
    {
      name: "Course",
      sortOrder: "descend",
      sortFn: (a: any, b: any) =>
        a.couse.courseTitle.localeCompare(b.couse.courseTitle),
      sortDirections: ["descend", null],

      filterMultiple: true,
      listOfFilter: [],
      filterFn: (list: string[], item: any) =>
        list.some(name => item.couse.courseTitle.indexOf(name) !== -1)
    },
    {
      name: "Instructor",
      sortOrder: null,
      sortDirections: ["ascend", "descend", null],
      sortFn: (a: any, b: any) => a.staff.firstName,
      filterMultiple: false,
      listOfFilter: [],
      filterFn: null
    },
    {
      name: "Grade Letter",
      sortOrder: "descend",
      sortFn: (a: any, b: any) => a.gradeLetter.localeCompare(b.gradeLetter),
      sortDirections: ["descend", null],
      listOfFilter: [],
      filterFn: null,
      filterMultiple: true
    },
    {
      name: "Remark",
      sortOrder: null,
      sortDirections: ["ascend", "descend", null],
      sortFn: (a: any, b: any) => a.remark.length - b.remark.length,
      filterMultiple: false,
      listOfFilter: [],
      filterFn: null
    }
  ];
  constructor(
    private _customNotificationService: CustomNotificationService,
    private _crudService: CrudService,
    private modal: NzModalService,
    private _fb: FormBuilder,
    private _route: Router,
    private _file: FilesService,
    private http: HttpClient
  ) {
    this.gradeQueryForm = this._fb.group({
      academicProgrammeCode: ["", Validators.required],
      batchCode: ["", Validators.required],
      termCode: ["", Validators.required],
      courseCode: [""],
      studentId: [""]
    });
  }

  ngOnInit(): void {
    this.fetchProgram();
  }

  fetchProgram() {
    this.isLoading = true; // Set loading state
    this._crudService.getList("/StudentGrades").subscribe((res: any) => {
      this.studentGrades = res.data;
      this.totalRecord = res.data?.length || 0; // Set total record count
      this.populateFilterOptions();
      this.isLoading = false; // Clear loading state
    }, error => {
      this.isLoading = false; // Clear loading state on error
    });
  }

  gradeQueryFormSubmit() {
    if (this.gradeQueryForm.valid) {
      this._crudService
        .add("/StudentGrades/report", this.gradeQueryForm.value)
        .subscribe((res: any) => {
          this.studentGrades = res.data;
        });
    } else {
      alert("Please select query!");
    }
  }
  
  showDeleteConfirm(id: any) {
    this.modal.confirm({
      nzTitle: 'Are you sure you want to delete this grade?',
      nzContent: 'This action cannot be undone.',
      nzOkText: 'Yes',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        // Add delete logic here
        console.log('Delete grade with ID:', id);
      },
      nzCancelText: 'No',
    });
  }
  
  // Added missing method
  exportGrades() {
    // Add export logic here
    console.log('Exporting grades...');
  }
  
  gradeReport(studentId: any) {
    this.gradeQueryForm.value["studentId"] = studentId;
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
      alert("Choose a file to upload first");
      return;
    }
    let fileList = <FileList>this.uploadFile.target.files;
    let formData = new FormData();
    Array.from(fileList).forEach(file3 => {
      formData.append("data", file3);
    });
    
    this.http
      .post(this.apiUrl + "/StudentGrades/uploadGrade", formData)
      .subscribe();

    // const formData = new FormData();
    // formData.append(this.uploadFile.name, this.uploadFile);

    // const url = `${this.apiUrl}/Files`;
    // const uploadReq = new HttpRequest('POST', url, formData, {
    //   reportProgress: true,
    // });

    // this.uploadUrl = '';
    // this.uploadProgress = 0;
    this.working = true;

    // this.http
    //   .request(uploadReq)
    //   .subscribe(
    //     (event: any) => {
    //       if (event.type === HttpEventType.UploadProgress) {
    //         this.uploadProgress = Math.round(
    //           (100 * event.loaded) / event.total
    //         );
    //       } else if (event.type === HttpEventType.Response) {
    //         this.uploadUrl = event.body.url;
    //         console.log('the response:', this.uploadUrl);
    //       }
    //     },
    //     (error: any) => {
    //       console.error(error);
    //     }
    //   )
    //   .add(() => {
    //     this.working = false;
    //   });
  }
  clickSearchKey() {
    this.fetchProgram();
  }

  paginatedIndexEvent(event: any) {
    this.pageindex = event;
    this.fetchProgram();
  }
  paginatedSizeEvent(event: any) {
    this.pageSize = event;
    this.fetchProgram();
  }
  populateFilterOptions(): void {
    this.listOfColumns.forEach(column => {
      if (column.name === "Student ID") {
        const values = new Set<string>();
        this.studentGrades.forEach(data => {
          values.add(data.student.studentId);
        });
        column.listOfFilter = Array.from(values).map(value => ({
          text: value,
          value
        }));
      } else if (column.name === "Course") {
        const values = new Set<string>();
        this.studentGrades.forEach(data => {
          values.add(data.couse.courseTitle);
        });
        column.listOfFilter = Array.from(values).map(value => ({
          text: value,
          value
        }));
      }
      // Add similar logic for other columns if needed
    });
  }
}
