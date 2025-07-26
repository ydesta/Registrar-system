import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { NzModalService } from "ng-zorro-antd/modal";
import { BaseModel } from "src/app/Models/BaseMode";
import { CrudService } from "src/app/services/crud.service";
import { CustomNotificationService } from "src/app/services/custom-notification.service";
import { StudentGradeModel } from "../Models/StudentGradeModel";

@Component({
  selector: "app-students",
  templateUrl: "./students.component.html",
  styleUrls: ["./students.component.scss"]
})
export class StudentsComponent implements OnInit {
  studentGrades?: StudentGradeModel[];
  reqId = "";
  checked = false;
  selectedValue = "";
  academicPrograms: any;
  batches: any;
  academicTerms: any;
  courses: any;
  gradeQueryForm: FormGroup;
  studentId = "";
  constructor(
    private _customNotificationService: CustomNotificationService,
    private _crudService: CrudService,
    private modal: NzModalService,
    private _fb: FormBuilder,
    private _route: Router
  ) {
    this.gradeQueryForm = this._fb.group({
      termCode: ["", Validators.required],
      studentId: [""]
    });
  }

  ngOnInit(): void {
    //this.fetchProgram();
    this.populateIntialData();
  }

  fetchProgram() {
    this._crudService
      .getList("/StudentGrades")
      .subscribe((res: BaseModel<StudentGradeModel[]>) => {
        this.studentGrades = res.data;
      });
  }

  populateIntialData() {
    this._crudService
      .getList("/academicTerms")
      .subscribe((res: BaseModel<StudentGradeModel[]>) => {
        this.academicTerms = res.data;
        this.gradeQueryForm.value[
          "termCode"
        ] = this.academicTerms[0].academicTermCode;
      });
  }

  showDeleteConfirm(id: any): void {
    this.reqId = id;
    this.modal.confirm({
      nzTitle: "Are you sure delete this Student Grade?",
      // nzContent: '<b style="color: red;">Some descriptions</b>',
      nzOkText: "Yes",
      nzOkType: "primary",
      nzOkDanger: true,
      nzOnOk: () => {
        this._crudService
          .delete("/StudentGrades", this.reqId)
          .subscribe((res: any) => {
            
            this.fetchProgram();
            if (res.status == "success") {
              this._customNotificationService.notification(
                "success",
                "Success",
                res.data
              );
            }
            if (res.status == "error") {
              this._customNotificationService.notification(
                "error",
                "Error",
                res.data
              );
            }
          });
      },
      nzCancelText: "No",
      nzOnCancel: () => console.log("Cancel")
    });
  }

  gradeQueryFormSubmit() {
    this.gradeQueryForm.value["studentId"] = this.studentId;
    if (
      this.gradeQueryForm.value["studentId"] != "" ||
      this.gradeQueryForm.value["termCode"] != ""
    ) {
      this._crudService
        .add("/StudentGrades/report", this.gradeQueryForm.value)
        .subscribe((res: any) => {
          this.studentGrades = res.data;
          
        });
    } else {
      alert("Please select query!");
    }
  }

  gradeReport(studentId: any) {
    this.gradeQueryForm.value["studentId"] = studentId;
    localStorage.setItem(
      "report-query",
      JSON.stringify(this.gradeQueryForm.value)
    );
    this._route.navigateByUrl("students/student-grade-report");
  }
}
