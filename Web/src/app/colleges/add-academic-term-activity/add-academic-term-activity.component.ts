import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { StaticData } from 'src/app/admission-request/model/StaticData';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';
import { BatchTermService } from '../services/batch-term.service';
import { TermViewModel } from '../model/term-view-model';
import { AcademicTermActivitiesService } from '../services/academic-term-activities.service';

@Component({
  selector: 'app-add-academic-term-activity',
  templateUrl: './add-academic-term-activity.component.html',
  styleUrls: ['./add-academic-term-activity.component.scss']
})
export class AddAcademicTermActivityComponent implements OnInit {

  action = 'Add Academic Term Activity';
  acadamicTermActivityForm: FormGroup;
  academicTerms: TermViewModel[] = [];
  activities: any;
  progStatusId: any;
  submit = 'Submit';
  listOfTermNumber: StaticData[] = [];
  constructor(
    public aciveRoute: ActivatedRoute,
    private _route: Router,
    private _fb: FormBuilder,
    private academicTermActivitiesService: AcademicTermActivitiesService,
    private batchTermService: BatchTermService,
    private _customNotificationService: CustomNotificationService) {
    this.createForm();
  }

  ngOnInit(): void {
    this.GetAcademicTermList();
    this.progStatusId = this.aciveRoute.snapshot.paramMap.get('id');

    this.getListOfActivities();
    this.getAcademicTermActivityById() 
  }
  getListOfActivities() {
    this.academicTermActivitiesService.getActivityList().subscribe((res: any) => {
      this.activities = res.data
    });
  }
  getAcademicTermActivityById() {
    if (this.progStatusId != "null") {
      this.action = "Edit Academic Term Activity"
      this.submit = 'Update';
      this.academicTermActivitiesService.getAcademicTermActivityById(this.progStatusId).subscribe((res: any) => {
        this.patchValues(res.data);
      });
    }
  }
  createForm() {
    this.acadamicTermActivityForm = this._fb.group({
      createdBy: ['-'],
      lastModifiedBy: ['-'],
      activityID: ['', Validators.required],
      activityStartDate: [null, Validators.required],
      activityEndDate: [null, Validators.required],
      academicTermId: ['', Validators.required],
      remark: [''],

    }, {
      validators: [this.dateValidator]
    });
  }
  submitForm() {
    if (this.acadamicTermActivityForm.valid) {
      if (this.progStatusId == "null") {
        this.academicTermActivitiesService.create(this.acadamicTermActivityForm.value).subscribe((res: any) => {
          this._customNotificationService.notification('success', 'Success', res.data);
          this._route.navigateByUrl('colleges/academic-term-activity');
          
        })
      }
      else if (this.progStatusId != "null") {
        if (this.acadamicTermActivityForm.valid) {
          this.academicTermActivitiesService.update(this.progStatusId, this.acadamicTermActivityForm.value).subscribe((res: any) => {
            if (res.status == 'success') {
              this._customNotificationService.notification('success', 'Success', res.data);
              this._route.navigateByUrl('colleges/academic-term-activity');
            }
            else {
              this._customNotificationService.notification('error', 'Error', res.data);

            }
          })
        }

      }
    }
    else {
      this._customNotificationService.notification('error', 'error', 'Enter valid data.');
    }
  }
  patchValues(data: any) {
    
    this.acadamicTermActivityForm.patchValue({
      activityID: data.activityID,
      activityStartDate: data.activityStartDate,
      activityEndDate: data.activityEndDate,
      academicTermId: data.academicTermId,
      remark: data.remark,
    })
  }
  GetAcademicTermList() {
    this.batchTermService.GetAcademicTermList().subscribe(res => {
      this.academicTerms = res;
    })
  }

  dateValidator(formGroup: FormGroup) {
    const start = formGroup.get('activityStartDate')?.value;
    const end = formGroup.get('activityEndDate')?.value;

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (start && new Date(start) < tomorrow) {
      return { startTooEarly: true };
    }

    if (start && end && new Date(start) > new Date(end)) {
      return { startAfterEnd: true };
    }

    return null;
  }
  disablePastDates = (current: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return current < new Date(today.setDate(today.getDate() + 1));
  };

}
