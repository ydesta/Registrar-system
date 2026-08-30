import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';
import { AuthService } from 'src/app/services/auth.service';
import { StaffService } from 'src/app/services/staff.service';
import { StaffModel } from 'src/app/Models/StaffModel';
import { EMPLOYMENT_TYPE, INSTRUCTOR_TITLES, ethiopianMobileValidator, normalizeEthiopianMobile, applyEthiopianMobileControl, COUNTRIES } from 'src/app/common/constant';

@Component({
  selector: 'app-add-staff',
  templateUrl: './add-staff.component.html',
  styleUrls: ['./add-staff.component.scss']
})
export class AddStaffComponent implements OnInit {
  action = 'Add Staff';
  staffForm: FormGroup;
  progStatusId: any;
  submit = 'Submit';
  employmentTypes = EMPLOYMENT_TYPE;
  instructorTitles = INSTRUCTOR_TITLES;
  countries = COUNTRIES;

  constructor(
    public aciveRoute: ActivatedRoute,
    private _route: Router,
    private _fb: FormBuilder,
    private _staffService: StaffService,
    private _customNotificationService: CustomNotificationService,
    private _authService: AuthService
  ) {
    this.staffForm = this._fb.group({
      createdBy: ['-'],
      lastModifiedBy: ['-'],
      firstName: ['', Validators.required],
      middleName: ['', Validators.required],
      lastName: ['', Validators.required],
      gender: ['', Validators.required],
      birthDate: [null],
      mobile: ['', [Validators.required, ethiopianMobileValidator()]],
      email: ['', [Validators.required, Validators.email]],
      employmentType: [null, Validators.required],
      title: ['', Validators.required],
      nationality: ['']
    });
  }

  ngOnInit(): void {
    this.progStatusId = this.aciveRoute.snapshot.paramMap.get('id');
    if (this.progStatusId != 'null') {
      this.action = 'Edit Staff';
      this.submit = 'Update';
      this._staffService.getStaffById(this.progStatusId).subscribe((res: any) => {
        this.patchValues(res.data);
      });
    }
  }

  submitForm() {
    if (!this.staffForm.valid) {
      this._customNotificationService.notification('error', 'error', 'Enter valid data.');
      return;
    }
    const mobile = normalizeEthiopianMobile(this.staffForm.value.mobile);
    if (!mobile) {
      this._customNotificationService.notification('error', 'error', 'Enter a valid Ethiopian mobile (09 / 07).');
      return;
    }
    const formData: Partial<StaffModel> = {
      ...this.staffForm.value,
      mobile,
      userId: localStorage.getItem('userId') || localStorage.getItem('user_id') || ''
    };
    if (this.progStatusId == 'null') {
      this._staffService.createStaff(formData as StaffModel).subscribe((res: any) => {
        this._customNotificationService.notification('success', 'Success', res.data);
        this._route.navigateByUrl(this.navigationPath());
      });
      return;
    }
    this._staffService.updateStaff(this.progStatusId, formData as StaffModel).subscribe((res: any) => {
      if (res.status == 'success') {
        this._customNotificationService.notification('success', 'Success', res.data);
        this._route.navigateByUrl(this.navigationPath());
        return;
      }
      this._customNotificationService.notification('error', 'Error', res.data);
    });
  }

  patchValues(data: any) {
    this.staffForm.patchValue({
      firstName: data.firstName,
      middleName: data.middleName || '',
      lastName: data.lastName,
      gender: data.gender,
      birthDate: data.birthDate,
      mobile: normalizeEthiopianMobile(data.mobile) || data.mobile || '',
      email: data.email,
      employmentType: data.employmentType,
      title: data.title,
      nationality: data.nationality || ''
    });
  }

  onPhoneBlur(): void {
    applyEthiopianMobileControl(this.staffForm.get('mobile'));
  }

  filterNationality = (input: string, option: any): boolean => {
    const searchTerm = (input || '').toLowerCase();
    const countryName = (option.nzLabel || '').toLowerCase();
    const nationality = (option.nzValue || '').toLowerCase();
    return countryName.includes(searchTerm) || nationality.includes(searchTerm);
  };

  private navigationPath(): string {
    return this._authService.hasRole('Instructor') ? '/staffs/staff-profile' : '/staffs';
  }
}
