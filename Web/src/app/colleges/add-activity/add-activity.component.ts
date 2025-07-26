import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CrudService } from 'src/app/services/crud.service';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';
import { AcademicTermActivitiesService } from '../services/academic-term-activities.service';
import { ActivityModel } from 'src/app/Models/ActivityModel';
import { NzModalRef } from 'ng-zorro-antd/modal';

@Component({
  selector: 'app-add-activity',
  templateUrl: './add-activity.component.html',
  styleUrls: ['./add-activity.component.scss']
})
export class AddActivityComponent implements OnInit {
  activityForm: FormGroup;
  acadamicPrograms: any;
  progStatusId: any;
  submit = 'Submit';
  @Input() activity: ActivityModel;
  @Output() dataUpdated = new EventEmitter<void>();
  constructor(
    public aciveRoute: ActivatedRoute,
    private _route: Router,
    private _fb: FormBuilder,
    private modalRef: NzModalRef,
    private academicTermActivitiesService: AcademicTermActivitiesService,
    private _customNotificationService: CustomNotificationService) {
    this.createActivityForm();
  }

  ngOnInit(): void {
    if (this.activity) {
      this.submit = 'Update';
      this.patchValues(this.activity);
    }
  }
  getActivityById() {
    if (this.progStatusId != "null") {
      this.academicTermActivitiesService.getActivityById(this.progStatusId)
      .subscribe((res: any) => {
        this.patchValues(res.data);
      });
    }
  }
  createActivityForm() {
    this.activityForm = this._fb.group({
      createdBy: ['-'],
      lastModifiedBy: ['-'],
      title: ['', Validators.required],
    });
  }
  submitForm() {
    if (this.activityForm.valid) {
      if (!this.activity) {
        // Create
        this.academicTermActivitiesService.createActivity(this.activityForm.value).subscribe((res: any) => {
          this._customNotificationService.notification('success', 'Success', res.data);
          this.modalRef.destroy(); // close modal
        });
      } else {
        // Update
        this.academicTermActivitiesService.updateActivity(this.activity.id, this.activityForm.value).subscribe((res: any) => {
          if (res.status === 'success') {
            this._customNotificationService.notification('success', 'Success', res.data);
            this.modalRef.destroy(); // close modal
          } else {
            this._customNotificationService.notification('error', 'Error', res.data);
          }
        });
      }
    } else {
      this._customNotificationService.notification('error', 'Error', 'Enter valid data.');
    }
  }
  
  patchValues(data: any) {
    this.activityForm.patchValue({
      title: data.title,

    })
  }
}
