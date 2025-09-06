import { Component, OnInit, Inject, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseModel } from 'src/app/Models/BaseMode';
import { CourseExemptionModel } from 'src/app/Models/CourseExemptionModel';
import { CourseExemptionService } from 'src/app/services/course-exemption.service';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';
import { CrudService } from 'src/app/services/crud.service';

@Component({
  selector: 'app-course-exemption-form',
  templateUrl: './course-exemption-form.component.html',
  styleUrls: ['./course-exemption-form.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class CourseExemptionFormComponent implements OnInit {
  form: FormGroup;
  isEditMode = false;
  courseExemptionId: number | null = null;
  loading = false;
  submitting = false;

  // Dropdown data
  students: any[] = [];
  courses: any[] = [];

  constructor(
    private fb: FormBuilder,
    @Inject(CourseExemptionService) private courseExemptionService: CourseExemptionService,
    private customNotificationService: CustomNotificationService,
    private crudService: CrudService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.loadDropdownData();
    this.checkEditMode();
  }

  private initializeForm(): void {
    this.form = this.fb.group({
      studentId: ['', [Validators.required]],
      exemptionCourseId: ['', [Validators.required]],
      exemptedCourseCode: ['', [Validators.required]],
      exemptedCourseName: ['', [Validators.required]],
      exemptedCourseCredit: ['', [Validators.required]],
      exemptedCollegeName: ['', [Validators.required]],
      reason: ['', []],
      grade: ['', [Validators.required]],
      createdBy: [sessionStorage.getItem('user_id') || ''],
      lastModifiedBy: [sessionStorage.getItem('user_id') || '']
    });
  }

  private checkEditMode(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'null') {
      this.isEditMode = true;
      this.courseExemptionId = +id;
      this.loadCourseExemptionData(+id);
    }
  }

  private loadDropdownData(): void {
    this.loading = true;
    
    // Load students
    this.crudService.getList('/Students').subscribe({
      next: (response: BaseModel<any[]>) => {
        if (response.status === 'success') {
          this.students = response.data.map(student => ({
            value: student.id,
            label: `${student.studentId} - ${student.firstName} ${student.fatherName} ${student.grandFatherName}`,
            studentId: student.id
          }));
        }
      },
      error: (error) => {
        this.customNotificationService.notification('error', 'Error', 'Failed to load students');
      }
    });

    // Load courses
    this.crudService.getList('/Courses').subscribe({
      next: (response: BaseModel<any[]>) => {
        if (response.status === 'success') {
          this.courses = response.data.map(course => ({
            value: course.id,
            label: `${course.courseCode} - ${course.courseTitle}`,
            courseId: course.id
          }));
        }
        this.loading = false;
      },
      error: (error) => {
        this.customNotificationService.notification('error', 'Error', 'Failed to load courses');
        this.loading = false;
      }
    });
  }

  private loadCourseExemptionData(id: number): void {
    this.loading = true;
    this.courseExemptionService.getCourseExemptionById(id).subscribe({
      next: (response: BaseModel<CourseExemptionModel>) => {
        if (response.status === 'success') {
          this.patchFormValues(response.data);
        } else {
          this.customNotificationService.notification('error', 'Error', 'Failed to load course exemption data');
        }
        this.loading = false;
      },
      error: (error) => {
        this.customNotificationService.notification('error', 'Error', 'Failed to load course exemption data');
        this.loading = false;
      }
    });
  }

  private patchFormValues(data: CourseExemptionModel): void {
    this.form.patchValue({
      studentId: data.studentId,
      exemptionCourseId: data.exemptionCourseId,
      exemptedCourseCode: data.exemptedCourseCode,
      exemptedCourseName: data.exemptedCourseName,
      exemptedCourseCredit: data.exemptedCourseCredit,
      exemptedCollegeName: data.exemptedCollegeName,
      reason: data.reason,
      grade: data.grade,
      // approvedBy: data.approvedBy,
      // approvedDate: data.approvedDate ? new Date(data.approvedDate) : null,
      lastModifiedBy: sessionStorage.getItem('user_id') || ''
    });
  }

  onSubmit(): void {
    if (this.form.valid && !this.submitting) {
      this.submitting = true;
      const formData = this.form.value;

      if (this.isEditMode && this.courseExemptionId) {
        this.updateCourseExemption(formData);
      } else {
        this.addCourseExemption(formData);
      }
    } else {
      this.markFormGroupTouched();
      this.customNotificationService.notification('error', 'Error', 'Please fill in all required fields');
    }
  }

  private addCourseExemption(data: CourseExemptionModel): void {
    this.courseExemptionService.addCourseExemption(data).subscribe({
      next: (response: BaseModel<any>) => {
        if (response.status === 'success') {
          this.customNotificationService.notification('success', 'Success', response.data);
          this.router.navigate(['/course/course-exemption-list']);
        } else {
          this.customNotificationService.notification('error', 'Error', response.data);
        }
        this.submitting = false;
      },
      error: (error) => {
        this.customNotificationService.notification('error', 'Error', 'Failed to add course exemption');
        this.submitting = false;
      }
    });
  }

  private updateCourseExemption(data: CourseExemptionModel): void {
    if (this.courseExemptionId) {
      this.courseExemptionService.updateCourseExemption(this.courseExemptionId, data).subscribe({
        next: (response: BaseModel<any>) => {
          if (response.status === 'success') {
            this.customNotificationService.notification('success', 'Success', response.data);
            this.router.navigate(['/course/course-exemption-list']);
          } else {
            this.customNotificationService.notification('error', 'Error', response.data);
          }
          this.submitting = false;
        },
        error: (error) => {
          this.customNotificationService.notification('error', 'Error', 'Failed to update course exemption');
          this.submitting = false;
        }
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/course/course-exemption-list']);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.form.controls).forEach(key => {
      const control = this.form.get(key);
      control?.markAsTouched();
    });
  }
  // Getters for form controls
  get studentId() { return this.form.get('studentId'); }
  get exemptionCourseId() { return this.form.get('exemptionCourseId'); }
  get exemptedCourseCode() { return this.form.get('exemptedCourseCode'); }
  get exemptedCourseName() { return this.form.get('exemptedCourseName'); }
  get collegeName() { return this.form.get('collegeName'); }
  get reason() { return this.form.get('reason'); }
  get grade() { return this.form.get('grade'); }
}
