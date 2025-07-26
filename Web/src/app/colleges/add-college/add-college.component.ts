import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CrudService } from 'src/app/services/crud.service';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';

@Component({
  selector: 'app-add-college',
  templateUrl: './add-college.component.html',
  styleUrls: ['./add-college.component.scss'],
})
export class AddCollegeComponent implements OnInit {
  action = 'Add College';
  collegeForm: FormGroup;
  acadamicPrograms: any;
  progStatusId: any;
  submit = 'Submit';
  constructor(
    public aciveRoute: ActivatedRoute,
    private _route: Router,
    private _fb: FormBuilder,
    private _crudService: CrudService,
    private _customNotificationService: CustomNotificationService
  ) {
    this.collegeForm = this._fb.group({
      createdBy: ['-'],
      lastModifiedBy: ['-'],
      collegeName: ['', Validators.required],
      city: ['', Validators.required],
      country: ['', Validators.required],
      telephone1: ['', Validators.required],
      telephone2: '',
      telephone3: '',
      remark: [''],
    });
  }

  ngOnInit(): void {
    this.progStatusId = this.aciveRoute.snapshot.paramMap.get('id');
    if (this.progStatusId != 'null') {
      this.action = 'Edit College';
      this.submit = 'Update';
      this._crudService
        .getList('/Colleges' + '/' + this.progStatusId)
        .subscribe((res: any) => {
          this.patchValues(res.data);
        });
    }
    // this._crudService.getList('/AcadamicProgramme').subscribe((res: any) => {
    //   this.acadamicPrograms = res.data;
    // });
  }
  submitForm() {
    if (this.collegeForm.valid) {
      if (this.progStatusId == 'null') {
        this._crudService
          .add(
            '/Colleges',
            this.collegeForm.value
          )
          .subscribe((res: any) => {
            this._customNotificationService.notification(
              'success',
              'Success',
              res.data
            );
            this._route.navigateByUrl('colleges');
            
          });
      } else if (this.progStatusId != 'null') {
        if (this.collegeForm.valid) {
          this._crudService
            .update(
              '/Colleges',
              this.progStatusId,
              this.collegeForm.value
            )
            .subscribe((res: any) => {
              if (res.status == 'success') {
                this._customNotificationService.notification(
                  'success',
                  'Success',
                  res.data
                );
                this._route.navigateByUrl('colleges');
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
    this.collegeForm.patchValue({
      collegeName: data.collegeName,
      city: data.city,
      country: data.country,
      telephone1: data.telephone1,
      telephone2: data.telephone2,
      telephone3: data.telephone3,
      remark: data.remark,
    });
  }
}
