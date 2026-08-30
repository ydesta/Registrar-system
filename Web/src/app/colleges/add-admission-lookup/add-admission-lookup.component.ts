import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AcadamicProgramme } from 'src/app/admission-request/model/acadamic-programme.model';
import { AcademicProgramRequestService } from 'src/app/admission-request/services/academic-program-request.service';
import {
  ACADEMIC_TERM_STATUS,
  APPLICANT_TYPE_STATUS,
  Division_Status
} from 'src/app/common/constant';
import { AdmissionLookupModel } from 'src/app/Models/AdmissionLookupModel';
import { StaticData } from 'src/app/admission-request/model/StaticData';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';
import { BatchService } from '../services/batch.service';
import { AdmissionLookupService } from '../services/admission-lookup.service';

@Component({
  selector: 'app-add-admission-lookup',
  templateUrl: './add-admission-lookup.component.html',
  styleUrls: ['./add-admission-lookup.component.scss']
})
export class AddAdmissionLookupComponent implements OnInit {
  action = 'Add Admission Lookup';
  form: FormGroup;
  submit = 'Save';
  lookupId: string;
  acadamicProgrammes: AcadamicProgramme[] = [];
  batches: any[] = [];
  termList: StaticData[] = [];
  divisionList: StaticData[] = [];
  applicantYearList: StaticData[] = [];
  yearOptions: number[] = [];
  loading = false;

  constructor(
    private aciveRoute: ActivatedRoute,
    private _route: Router,
    private _fb: FormBuilder,
    private admissionLookupService: AdmissionLookupService,
    private academicProgramRequestService: AcademicProgramRequestService,
    private batchService: BatchService,
    private _customNotificationService: CustomNotificationService
  ) {
    this.createForm();
  }

  ngOnInit(): void {
    this.loadStaticLists();
    this.loadPrograms();
    this.loadBatches();
    this.lookupId = this.aciveRoute.snapshot.paramMap.get('id');
    if (this.lookupId && this.lookupId !== 'null') {
      this.action = 'Edit Admission Lookup';
      this.submit = 'Update';
      this.getLookupById(this.lookupId);
    }
  }

  createForm() {
    this.form = this._fb.group({
      createdBy: ['-'],
      lastModifiedBy: ['-'],
      term: [null, Validators.required],
      year: [new Date().getFullYear(), Validators.required],
      acadamicProgrammeId: [null, Validators.required],
      batchCode: [null, Validators.required],
      division: [null, Validators.required],
      applicantYear: [null, Validators.required],
      isActive: [true],
      remark: ['']
    });
  }

  loadStaticLists() {
    this.termList = ACADEMIC_TERM_STATUS.map(x => ({ Id: x.Id, Description: x.Description }));
    this.divisionList = Division_Status.map(x => ({ Id: x.Id, Description: x.Description }));
    this.applicantYearList = APPLICANT_TYPE_STATUS.map(x => ({
      Id: x.Id,
      Description: x.Description
    }));
    const current = new Date().getFullYear();
    this.yearOptions = Array.from({ length: 11 }, (_, i) => current - 5 + i);
  }

  loadPrograms() {
    this.academicProgramRequestService.getAacadamicPrgramtList().subscribe({
      next: (res: any) => {
        this.acadamicProgrammes = res?.data || [];
      }
    });
  }

  loadBatches() {
    this.batchService.getBatchList().subscribe({
      next: (res: any) => {
        this.batches = res?.data || [];
      }
    });
  }

  getLookupById(id: string) {
    this.admissionLookupService.getById(id).subscribe((res: any) => {
      this.patchValues(res.data);
    });
  }

  patchValues(data: AdmissionLookupModel) {
    this.form.patchValue({
      term: data.term,
      year: data.year,
      acadamicProgrammeId: data.acadamicProgrammeId,
      batchCode: data.batchCode,
      division: data.division,
      applicantYear: data.applicantYear,
      isActive: data.isActive,
      remark: data.remark || ''
    });
  }

  submitForm() {
    if (!this.form.valid) {
      this._customNotificationService.notification('error', 'Error', 'Enter valid data.');
      return;
    }

    this.loading = true;
    const payload = this.form.value as AdmissionLookupModel;
    if (this.lookupId === 'null') {
      this.admissionLookupService.create(payload).subscribe({
        next: (res: any) => {
          this._customNotificationService.notification('success', 'Success', res.data || 'Admission lookup saved.');
          this._route.navigateByUrl('colleges/admission-lookup');
        },
        error: () => {
          this._customNotificationService.notification('error', 'Error', 'Failed to create admission lookup');
        },
        complete: () => {
          this.loading = false;
        }
      });
    } else {
      this.admissionLookupService.update(this.lookupId, payload).subscribe({
        next: (res: any) => {
          if (res.status === 'success') {
            this._customNotificationService.notification('success', 'Success', res.data);
            this._route.navigateByUrl('colleges/admission-lookup');
          } else {
            this._customNotificationService.notification('error', 'Error', res.data);
          }
        },
        error: () => {
          this._customNotificationService.notification('error', 'Error', 'Failed to update admission lookup');
        },
        complete: () => {
          this.loading = false;
        }
      });
    }
  }

  goBack(): void {
    this._route.navigateByUrl('colleges/admission-lookup');
  }
}
