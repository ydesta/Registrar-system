import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { CrudService } from 'src/app/services/crud.service';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';
import { BaseModel } from 'src/app/Models/BaseMode';
import { AcademicTermModel } from 'src/app/Models/AcademicTermModel';
import { ACADEMIC_TERM_STATUS } from 'src/app/common/constant';

@Component({
  selector: 'app-add-academic-term',
  templateUrl: './add-academic-term.component.html',
  styleUrls: ['./add-academic-term.component.scss']
})
export class AddAcademicTermComponent implements OnInit {
  action = 'Add Academic Term';
  academicTermForm: FormGroup;
  academicTermId: string | null = null;
  submit = 'Submit';
  isSubmitting = false;
  isLoading = false;
  termStatusList = ACADEMIC_TERM_STATUS;
  currentYear = new Date().getFullYear();
  yearOptions: number[] = [];

  constructor(
    public activeRoute: ActivatedRoute,
    private _router: Router,
    private _fb: FormBuilder,
    private _crudService: CrudService,
    private _customNotificationService: CustomNotificationService
  ) {
    // Generate year options (current year ± 5 years)
    for (let i = this.currentYear - 5; i <= this.currentYear + 5; i++) {
      this.yearOptions.push(i);
    }

    this.academicTermForm = this._fb.group({
      termId: [null, [Validators.required]],
      year: [this.currentYear, [Validators.required]],
      startDate: [null, [Validators.required]],
      endDate: [null, [Validators.required]],
      isCurrentTerm: [false],
      showRegular: [true],
      showAdd: [true],
      showAssessment: [true],
      showEquivalent: [true],
    }, { validators: this.dateRangeValidator });
  }

  ngOnInit(): void {
    this.academicTermId = this.activeRoute.snapshot.paramMap.get('id');
    
    if (this.academicTermId && this.academicTermId !== 'null') {
      this.action = 'Edit Academic Term';
      this.submit = 'Update';
      this.loadAcademicTerm(this.academicTermId);
    }
  }

  private loadAcademicTerm(id: string): void {
    this.isLoading = true;
    this._crudService
      .getById('/AcademicTerms', id)
      .pipe(
        catchError((error) => {
          this._customNotificationService.notification(
            'error',
            'Error',
            'Failed to load academic term. Please try again.'
          );
          return of({ data: null } as BaseModel<AcademicTermModel>);
        }),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe((res: BaseModel<AcademicTermModel>) => {
        if (res && res.data) {
          this.patchFormValues(res.data);
        } else {
          this._customNotificationService.notification(
            'error',
            'Error',
            'Academic term not found.'
          );
          this._router.navigate(['../academic-term'], { relativeTo: this.activeRoute });
        }
      });
  }

  submitForm(): void {
    if (this.academicTermForm.invalid) {
      // Mark all fields as touched to show validation errors
      Object.keys(this.academicTermForm.controls).forEach(key => {
        this.academicTermForm.get(key)?.markAsTouched();
      });
      this._customNotificationService.notification(
        'error',
        'Validation Error',
        'Please fill in all required fields correctly.'
      );
      return;
    }

    if (this.isSubmitting) {
      return;
    }

    // Validate date range
    const startDate = this.academicTermForm.get('startDate')?.value;
    const endDate = this.academicTermForm.get('endDate')?.value;
    
    if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
      this._customNotificationService.notification(
        'error',
        'Validation Error',
        'End date must be after start date.'
      );
      return;
    }

    this.isSubmitting = true;
    const formValue = this.academicTermForm.value;

    if (this.academicTermId && this.academicTermId !== 'null') {
      this.updateAcademicTerm(formValue);
    } else {
      this.addAcademicTerm(formValue);
    }
  }

  private addAcademicTerm(formData: any): void {
    this._crudService
      .add('/AcademicTerms', formData)
      .pipe(
        catchError((error) => {
          this._customNotificationService.notification(
            'error',
            'Error',
            error?.error?.data || 'Failed to add academic term. Please try again.'
          );
          return of({ status: 'error', data: 'Add operation failed' });
        }),
        finalize(() => {
          this.isSubmitting = false;
        })
      )
      .subscribe((res: BaseModel<any>) => {
        if (res.status === 'success') {
          this._customNotificationService.notification(
            'success',
            'Success',
            res.data || 'Academic term added successfully.'
          );
          this._router.navigate(['../academic-term'], { relativeTo: this.activeRoute });
        } else {
          this._customNotificationService.notification(
            'error',
            'Error',
            res.data || res.error || 'Failed to add academic term.'
          );
        }
      });
  }

  private updateAcademicTerm(formData: any): void {
    this._crudService
      .update('/AcademicTerms', this.academicTermId!, formData)
      .pipe(
        catchError((error) => {
          this._customNotificationService.notification(
            'error',
            'Error',
            error?.error?.data || 'Failed to update academic term. Please try again.'
          );
          return of({ status: 'error', data: 'Update operation failed' });
        }),
        finalize(() => {
          this.isSubmitting = false;
        })
      )
      .subscribe((res: BaseModel<any>) => {
        if (res.status === 'success') {
          this._customNotificationService.notification(
            'success',
            'Success',
            res.data || 'Academic term updated successfully.'
          );
          this._router.navigate(['../academic-term'], { relativeTo: this.activeRoute });
        } else {
          this._customNotificationService.notification(
            'error',
            'Error',
            res.data || res.error || 'Failed to update academic term.'
          );
        }
      });
  }

  private patchFormValues(data: AcademicTermModel): void {
    this.academicTermForm.patchValue({
      termId: data.termId,
      year: data.year,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      isCurrentTerm: data.isCurrentTerm || false,
      showRegular: data.showRegular !== false,
      showAdd: data.showAdd !== false,
      showAssessment: data.showAssessment !== false,
      showEquivalent: data.showEquivalent !== false,
    });
  }

  goBack(): void {
    this._router.navigateByUrl('colleges/academic-term');
  }

  private dateRangeValidator = (control: AbstractControl): ValidationErrors | null => {
    const formGroup = control as FormGroup;
    const startDate = formGroup.get('startDate')?.value;
    const endDate = formGroup.get('endDate')?.value;

    if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
      return { dateRangeError: true };
    }

    return null;
  };
}
