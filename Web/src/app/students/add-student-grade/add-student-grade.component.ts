import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CrudService } from 'src/app/services/crud.service';
import { StaffService } from 'src/app/services/staff.service';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';
import { StudentModel } from 'src/app/Models/StudentModel';
import { BaseModel } from 'src/app/Models/BaseMode';

interface AcadamicProgramme2 {
  acadamicProgrammeTitle: string;
}

@Component({
  selector: 'app-add-student-grade',
  templateUrl: './add-student-grade.component.html',
  styleUrls: ['./add-student-grade.component.scss'],
})
export class AddStudentGradeComponent implements OnInit {
  action = 'Submit Student Grade';
  studentGradeForm: FormGroup;
  studentIdForm: FormGroup;
  staffs: any;
  courses: any;
  students?: any;
  acadamicProgramme: AcadamicProgramme2 = {
    acadamicProgrammeTitle: '',
  };
  progStatusId: any;
  academicTerms: any;
  gradeLetter: any = [''];
  studentId: string = '';
  submit = 'Submit';

  constructor(
    public aciveRoute: ActivatedRoute,
    private _route: Router,
    private _fb: FormBuilder,
    private _crudService: CrudService,
    private _staffService: StaffService,
    private _customNotificationService: CustomNotificationService
  ) {
    this.studentGradeForm = this._fb.group({
      studentID: ['', Validators.required],
      batchCode: [''],
      academicTermCode: ['', Validators.required],
      courseCode: ['', Validators.required],
      gradeLetter: ['', Validators.required],
      staffID: ['', Validators.required],
      mark: [''],
      reatedBy: ['-'],
      lastModifiedBy: ['-'],
      remark: [''],
    });
    this.studentIdForm = _fb.group({
      studentId: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.progStatusId = this.aciveRoute.snapshot.paramMap.get('id');
    if (this.progStatusId != 'null') {
      this.action = 'Edit Student Grade';
      this.submit = 'Update';
      this._crudService
        .getList('/StudentGrades' + '/' + this.progStatusId)
        .subscribe((res: any) => {
          this.patchValues(res.data);
        });
    }
    this.loadStaffs();
    this._crudService.getList('/courses').subscribe((res: any) => {
      this.courses = res.data;
    });
    this._crudService.getList('/Students').subscribe((res: any) => {
      this.students = res.data;
    });
    this._crudService.getList('/academicTerms').subscribe((res: any) => {
      this.academicTerms = res.data;
    });
  }

  loadStaffs() {
    this._staffService.getAllStaff().subscribe((res: any) => {
      this.staffs = res.data;
    });
  }

  submitForm() {
    if (this.studentGradeForm.valid) {
      if (this.progStatusId == 'null') {
        this._crudService
          .add('/StudentGrades', this.studentGradeForm.value)
          .subscribe((res: any) => {
            this._customNotificationService.notification(
              'success',
              'Success',
              res.data
            );
            //this._route.navigateByUrl('students/student-grade');
            this.studentGradeForm.reset();
          });
      } else if (this.progStatusId != 'null') {
        if (this.studentGradeForm.valid) {
          this._crudService
            .update(
              '/StudentGrades',
              this.progStatusId,
              this.studentGradeForm.value
            )
            .subscribe((res: any) => {
              if (res.status == 'success') {
                this._customNotificationService.notification(
                  'success',
                  'Success',
                  res.data
                );
                this.studentGradeForm.reset();
                // this._route.navigateByUrl('students/student-grade');
              } else {
                this._customNotificationService.notification(
                  'error',
                  'Error',
                  res.data
                );
              }
            });
        }
      }
    } else {
      this._customNotificationService.notification(
        'error',
        'error',
        'Enter valid data.'
      );
    }
  }

  patchValues(data: any) {
    ;
    this.studentGradeForm.patchValue({
      batchCode: data.batchCode,
      courseCode: data.courseCode,
      gradeLetter: data.gradeLetter,
      staffID: data.staffID,
      remark: data.remark,
      studentID: data.studentId,
    });
  }

  getStudentById(): void {
    let splitId = this.studentIdForm.value['studentId'].split('/');
    // if (splitId.length > 0) {
    //   this.studentId = '';
    //   splitId.map((id: any) => {
    //     this.studentId = this.studentId + id + '%2F';
    //   });
    // }
    this.studentId = this.studentIdForm.value['studentId'];
    this._crudService
      .getList('/Students/studentId/' + this.studentId)
      .subscribe((res: BaseModel<StudentModel[]>) => {
        this.students = res.data;
        this.patchValues(res.data);
        //
        this._crudService
          .getList(
            '/AcadamicProgramme/one/' + this.students.acadamicProgrammeCode
          )
          .subscribe((res: any) => {
            this.acadamicProgramme = res;
            //AcadamicProgramme/one
          });
        //
      });
  }
}
