import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { BaseModel } from 'src/app/Models/BaseMode';
import { CourseExemptionModel } from 'src/app/Models/CourseExemptionModel';
import { CourseExemptionService } from 'src/app/services/course-exemption.service';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';
import { CrudService } from 'src/app/services/crud.service';
import { StudentService } from 'src/app/students/services/student.service';

@Component({
  selector: 'app-course-exemption-form',
  templateUrl: './course-exemption-form.component.html',
  styleUrls: ['./course-exemption-form.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class CourseExemptionFormComponent implements OnInit, OnDestroy {
  form: FormGroup;
  isEditMode = false;
  courseExemptionId: number | null = null;
  loading = false;
  loadingStudents = false;
  loadingCourses = false;
  submitting = false;
  students: any[] = [];
  courses: any[] = [];
  private destroy$ = new Subject<void>();
  private studentSearch$ = new Subject<string>();
  private courseSearch$ = new Subject<string>();

  constructor(
    private fb: FormBuilder,
    private courseExemptionService: CourseExemptionService,
    private customNotificationService: CustomNotificationService,
    private crudService: CrudService,
    private studentService: StudentService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.studentSearch$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(text => this.searchStudents(text));

    this.courseSearch$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(text => this.searchCourses(text));

    this.loadInitialCourses();
    this.checkEditMode();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.form = this.fb.group({
      studentId: [null, [Validators.required]],
      exemptionCourseId: [null, [Validators.required]],
      exemptedCourseCode: ['', [Validators.required]],
      exemptedCourseName: ['', [Validators.required]],
      exemptedCourseCredit: ['', [Validators.required]],
      exemptedCollegeName: ['', [Validators.required]],
      reason: [''],
      grade: [null, [Validators.required]],
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

  studentLabel(item: any): string {
    const code = item.studentId || item.studId || '';
    const name = [item.firstName, item.fatherName, item.grandFatherName]
      .filter(Boolean)
      .join(' ');
    return `${code} ${name}`.trim() || item.label || String(item.id || '');
  }

  courseLabel(item: any): string {
    if (item.label) {
      return item.label;
    }
    return `${item.courseCode || ''} - ${item.courseTitle || ''}`.trim();
  }

  onSearchStudent(text: string): void {
    this.studentSearch$.next((text || '').trim());
  }

  onSearchCourse(text: string): void {
    this.courseSearch$.next((text || '').trim());
  }

  private searchStudents(text: string): void {
    if (!text || text.length < 2) {
      return;
    }
    this.loadingStudents = true;
    this.studentService.searchStudents(text).subscribe({
      next: (res: any) => {
        this.students = Array.isArray(res) ? res : (res?.data || []);
        this.loadingStudents = false;
      },
      error: () => {
        this.students = [];
        this.loadingStudents = false;
        this.customNotificationService.notification(
          'error',
          'Error',
          'Failed to search students'
        );
      }
    });
  }

  private loadInitialCourses(): void {
    this.loadingCourses = true;
    this.crudService.getPaginated('/Courses', { pageindex: 0, pageSize: 50 }).subscribe({
      next: (response: any) => {
        const rows = response?.data || [];
        this.courses = rows.map((course: any) => ({
          id: course.id,
          courseCode: course.courseCode,
          courseTitle: course.courseTitle,
          label: `${course.courseCode} - ${course.courseTitle}`
        }));
        this.loadingCourses = false;
      },
      error: () => {
        this.courses = [];
        this.loadingCourses = false;
      }
    });
  }

  private searchCourses(text: string): void {
    if (!text || text.length < 2) {
      return;
    }
    this.loadingCourses = true;
    this.crudService
      .getPaginated('/Courses', { pageindex: 0, pageSize: 50, searchKey: text })
      .subscribe({
        next: (response: any) => {
          const rows = response?.data || [];
          this.courses = rows.map((course: any) => ({
            id: course.id,
            courseCode: course.courseCode,
            courseTitle: course.courseTitle,
            label: `${course.courseCode} - ${course.courseTitle}`
          }));
          this.loadingCourses = false;
        },
        error: () => {
          this.courses = [];
          this.loadingCourses = false;
        }
      });
  }

  private loadCourseExemptionData(id: number): void {
    this.loading = true;
    this.courseExemptionService.getCourseExemptionById(id).subscribe({
      next: (response: BaseModel<CourseExemptionModel>) => {
        if (response.status === 'success' && response.data) {
          this.patchFormValues(response.data);
        } else {
          this.customNotificationService.notification(
            'error',
            'Error',
            'Failed to load course exemption data'
          );
        }
        this.loading = false;
      },
      error: () => {
        this.customNotificationService.notification(
          'error',
          'Error',
          'Failed to load course exemption data'
        );
        this.loading = false;
      }
    });
  }

  private patchFormValues(data: any): void {
    const student = data.student;
    if (data.studentId) {
      this.students = [
        student
          ? { ...student, id: student.id || data.studentId }
          : {
              id: data.studentId,
              studentId: '',
              firstName: data.studentName || 'Selected student',
              fatherName: '',
              grandFatherName: ''
            }
      ];
    }

    const course = data.exemptionCourse;
    if (data.exemptionCourseId) {
      const exists = this.courses.some(c => c.id === data.exemptionCourseId);
      if (!exists) {
        const label =
          typeof course === 'object' && course
            ? `${course.courseCode || ''} - ${course.courseTitle || ''}`.trim()
            : data.exemptionCourse && typeof data.exemptionCourse === 'string'
              ? data.exemptionCourse
              : 'Selected course';
        this.courses = [
          {
            id: data.exemptionCourseId,
            courseCode: course?.courseCode,
            courseTitle: course?.courseTitle,
            label
          },
          ...this.courses
        ];
      }
    }

    this.form.patchValue({
      studentId: data.studentId,
      exemptionCourseId: data.exemptionCourseId,
      exemptedCourseCode: data.exemptedCourseCode,
      exemptedCourseName: data.exemptedCourseName,
      exemptedCourseCredit: data.exemptedCourseCredit,
      exemptedCollegeName: data.exemptedCollegeName,
      reason: data.reason,
      grade: data.grade,
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
      this.customNotificationService.notification(
        'error',
        'Error',
        'Please fill in all required fields'
      );
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
      error: () => {
        this.customNotificationService.notification(
          'error',
          'Error',
          'Failed to add course exemption'
        );
        this.submitting = false;
      }
    });
  }

  private updateCourseExemption(data: CourseExemptionModel): void {
    if (!this.courseExemptionId) {
      return;
    }
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
      error: () => {
        this.customNotificationService.notification(
          'error',
          'Error',
          'Failed to update course exemption'
        );
        this.submitting = false;
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/course/course-exemption-list']);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.form.controls).forEach(key => {
      this.form.get(key)?.markAsTouched();
    });
  }

  get studentId() {
    return this.form.get('studentId');
  }
  get exemptionCourseId() {
    return this.form.get('exemptionCourseId');
  }
  get exemptedCourseCode() {
    return this.form.get('exemptedCourseCode');
  }
  get exemptedCourseName() {
    return this.form.get('exemptedCourseName');
  }
  get grade() {
    return this.form.get('grade');
  }
}
