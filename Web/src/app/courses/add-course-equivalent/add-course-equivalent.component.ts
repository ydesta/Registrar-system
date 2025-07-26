import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CourseModel } from 'src/app/Models/CourseModel';
import { CrudService } from 'src/app/services/crud.service';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';

@Component({
  selector: 'app-add-course-equivalent',
  templateUrl: './add-course-equivalent.component.html',
  styleUrls: ['./add-course-equivalent.component.scss']
})
export class AddCourseEquivalentComponent implements OnInit {
  action = 'Add Course Equivalent';
  acadamicProgramForm: FormGroup;
  progId: any;
  curricula: any;
  submit = 'Submit';
  courses?: CourseModel[];

  constructor(
    public aciveRoute: ActivatedRoute,
    private _route: Router,
    private _fb: FormBuilder,
    private _crudService: CrudService,
    private _customNotificationService: CustomNotificationService
  ) {
    this.acadamicProgramForm = this._fb.group({
      courseCode: ['', Validators.required],
      equivalentCourseCode: ['', Validators.required],
      createdBy: [''],
      lastModifiedBy: [''],
      remark: ['']
    });
  }

  ngOnInit(): void {
    this.progId = this.aciveRoute.snapshot.paramMap.get('id');
    if (this.progId != "null") {
      this.action = "Edit Course Equivalent";
      this.submit = 'Update';
      this._crudService.getList('/CourseEquivalents' + '/' + this.progId).subscribe((res: any) => {
        this.patchValues(res.data);
      });
    }
    this._crudService.getList('/Courses').subscribe((res: any) => {
      this.courses = res.data;
    });
  }

  submitForm() {
    if (this.progId == "null") {
      if (this.acadamicProgramForm.valid) {
        this._crudService.add('/CourseEquivalents', this.acadamicProgramForm.value).subscribe((res: any) => {
          this._customNotificationService.notification('success', 'Success', res.data);
          this._route.navigateByUrl('course/course-equivalent');
        });
      } else {
        this._customNotificationService.notification('error', 'error', 'Enter valid data.');
      }
    } else if (this.progId != "null") {
      if (this.acadamicProgramForm.valid) {
        this._crudService.update('/CourseEquivalents', this.progId, this.acadamicProgramForm.value).subscribe((res: any) => {
          if (res.status == 'success') {
            this._customNotificationService.notification('success', 'Success', res.data);
            this._route.navigateByUrl('course/course-equivalent');
          } else {
            this._customNotificationService.notification('error', 'Error', res.data);
          }
        });
      } else {
        this._customNotificationService.notification('error', 'error', 'Enter valid data.');
      }
    }
  }

  patchValues(data: any) {
    this.acadamicProgramForm.patchValue({
      courseCode: data.courseCode,
      equivalentCourseCode: data.equivalentCourseCode,
      createdBy: data.createdBy,
      lastModifiedBy: data.lastModifiedBy,
      remark: data.remark
    });
  }
}
