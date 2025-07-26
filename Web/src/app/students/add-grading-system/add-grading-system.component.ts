import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CrudService } from 'src/app/services/crud.service';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';

@Component({
  selector: 'app-add-grading-system',
  templateUrl: './add-grading-system.component.html',
  styleUrls: ['./add-grading-system.component.scss'],
})
export class AddGradingSystemComponent implements OnInit {
  action = 'Add Grading System';
  staffForm: FormGroup;
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
    this.staffForm = this._fb.group({
      createdBy: ['-'],
      lastModifiedBy: ['-'],
      grade: ['', Validators.required],
      gradeDescription: ['', Validators.required],
      remark: ['', Validators.required],
      point: [0, Validators.required],
    });
  }

  ngOnInit(): void {
    this.progStatusId = this.aciveRoute.snapshot.paramMap.get('id');
    if (this.progStatusId != 'null') {
      this.action = 'Edit Grading System';
      this.submit = 'Update';
      this._crudService
        .getList('/GradingSystems' + '/' + this.progStatusId)
        .subscribe((res: any) => {
          this.patchValues(res.data);
        });
    }
  }
  submitForm() {
    if (this.staffForm.valid) {
      if (this.progStatusId == 'null') {
        this._crudService
          .add('/GradingSystems', this.staffForm.value)
          .subscribe((res: any) => {
            this._customNotificationService.notification(
              'success',
              'Success',
              res.data
            );
            this._route.navigateByUrl('students/grading-system');
            
          });
      } else if (this.progStatusId != 'null') {
        if (this.staffForm.valid) {
          this._crudService
            .update('/GradingSystems', this.progStatusId, this.staffForm.value)
            .subscribe((res: any) => {
              if (res.status == 'success') {
                this._customNotificationService.notification(
                  'success',
                  'Success',
                  res.data
                );
                this._route.navigateByUrl('students/grading-system');
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
    this.staffForm.patchValue({
      grade: data.grade,
      gradeDescription: data.gradeDescription,
      remark: data.remark,
      point: data.point
    });
  }
}
