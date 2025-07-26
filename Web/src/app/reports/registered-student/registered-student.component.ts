import { SearchQueryParams } from './../SearchParam/search-query-params';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzModalService } from 'ng-zorro-antd/modal';
import { BaseModel } from 'src/app/Models/BaseMode';
import { StudentGradeModel } from 'src/app/Models/StudentGradeModel';
import { CrudService } from 'src/app/services/crud.service';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';

@Component({
  selector: 'app-registered-student',
  templateUrl: './registered-student.component.html',
  styleUrls: ['./registered-student.component.scss'],
})
export class RegisteredStudentComponent implements OnInit {
  academicTerms: any;
  courses: any;
  gradeQueryForm: FormGroup;
  registeredStudents: any;
  courseTitle: any;
  radioValues = ['Accepted', 'Rejected'];
  constructor(private _crudService: CrudService, private _fb: FormBuilder) {
    this.gradeQueryForm = this._fb.group({
      termCode: ['', Validators.required],
      courseCode: ['', [Validators.required]],
      radio: [{ value: 'Accepted', disabled: false }, [Validators.required]],
    });
  }

  ngOnInit(): void {
    //this.populateIntialData();
    this._crudService.getList('/Courses').subscribe((res: any) => {
      this.courses = res.data;
    });
    this._crudService.getList('/academicTerms').subscribe((res: any) => {
      this.academicTerms = res.data;
    });
  }

  getRegisteredStud(): SearchQueryParams {
    const formModel = this.gradeQueryForm.getRawValue();

    const params = new SearchQueryParams();

    params.AcademicTerm = formModel.termCode;
    params.Course = formModel.courseCode;
    params.Status = formModel.radio;

    return params;
  }

  acadamicTermFormSubmit() {
    if (this.gradeQueryForm.value['termCode'] != '') {
      this._crudService
        .getRegisteredStud(this.getRegisteredStud())
        // .add(
        //   '/StudentRegistrations/RegisteredStudent/',
        //   this.gradeQueryForm.value
        // )
        .subscribe((res: any) => {
          this.registeredStudents = res.data;
          
        });
    } else {
      alert('Please select!');
    }
  }
}
