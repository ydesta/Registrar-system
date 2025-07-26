import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CrudService } from 'src/app/services/crud.service';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';

@Component({
  selector: 'app-add-bank',
  templateUrl: './add-bank.component.html',
  styleUrls: ['./add-bank.component.scss']
})
export class AddBankComponent implements OnInit {
  action = 'Add Bank';
  bankForm: FormGroup;
  acadamicPrograms: any;
  progStatusId: any;
  submit = 'Submit';
  isSubmitting = false;

  constructor(
    public aciveRoute: ActivatedRoute,
    private _route: Router, 
    private _fb: FormBuilder,
    private _crudService: CrudService, 
    private _customNotificationService: CustomNotificationService
  ) {
    this.bankForm = this._fb.group({
      createdBy: ['-'],
      lastModifiedBy: ['-'],
      bankName: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.progStatusId = this.aciveRoute.snapshot.paramMap.get('id');
    if (this.progStatusId != "null") {
      this.action = "Edit Bank"
      this.submit = 'Update';
      this._crudService.getList('/Banks' + '/' + this.progStatusId).subscribe((res: any) => {
        this.patchValues(res.data);
      });
    }
  }

  submitForm() {
    if (this.bankForm.valid) {
      this.isSubmitting = true;
      
      if (this.progStatusId == "null") {
        this._crudService.add('/Banks', this.bankForm.value).subscribe((res: any) => {
          this.isSubmitting = false;
          this._customNotificationService.notification('success', 'Success', res.data);
          this._route.navigateByUrl('banks');
        }, error => {
          this.isSubmitting = false;
          this._customNotificationService.notification('error', 'Error', 'Failed to add bank');
        });
      } else if (this.progStatusId != "null") {
        if (this.bankForm.valid) {
          this._crudService.update('/Banks', this.progStatusId, this.bankForm.value).subscribe((res: any) => {
            this.isSubmitting = false;
            if (res.status == 'success') {
              this._customNotificationService.notification('success', 'Success', res.data);
              this._route.navigateByUrl('banks');
            } else {
              this._customNotificationService.notification('error', 'Error', res.data);
            }
          }, error => {
            this.isSubmitting = false;
            this._customNotificationService.notification('error', 'Error', 'Failed to update bank');
          });
        }
      }
    } else {
      this._customNotificationService.notification('error', 'Error', 'Please enter valid data.');
    }
  }

  patchValues(data: any) {
    this.bankForm.patchValue({
      bankName: data.bankName,
    });
  }
}
