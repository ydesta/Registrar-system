import { Component, OnInit } from '@angular/core';
import { StudentModel } from 'src/app/Models/StudentModel';
import { CrudService } from 'src/app/services/crud.service';
import { BaseModel } from 'src/app/Models/BaseMode';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss'],
})
export class ReportsComponent implements OnInit {
  students: StudentModel[] = [];
  academicPrograms: any;
  batches: any;
  studentQueryForm: FormGroup;
  constructor(private _crudService: CrudService, private _fb: FormBuilder) {
    this.studentQueryForm = this._fb.group({
      academicProgrammeCode: ['', Validators.required],
      batchCode: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this._crudService
      .getList('/AcadamicProgramme')
      .subscribe((res: BaseModel<StudentModel[]>) => {
        this.academicPrograms = res.data;
      });
    this._crudService
      .getList('/Batchs')
      .subscribe((res: BaseModel<StudentModel[]>) => {
        this.batches = res.data;
      });
  }

  studentQueryFormSubmit() {
    if (this.studentQueryForm.valid) {
      this._crudService
        .add('/students/report', this.studentQueryForm.value)
        .subscribe((res: any) => {
          this.students = res.data;
        });
    } else {
      alert('Please select query!');
    }
  }
}
