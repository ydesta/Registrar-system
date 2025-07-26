import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { CourseModel } from 'src/app/Models/CourseModel';
import { CoursePrerequisiteService } from 'src/app/services/course-prerequisite.service';
import { CourseService } from 'src/app/services/course.service';

@Component({
  selector: 'app-add-course-prerequisite',
  templateUrl: './add-course-prerequisite.component.html',
  styleUrls: ['./add-course-prerequisite.component.scss'],
  providers: [CourseService, CoursePrerequisiteService]
})
export class AddCoursePrerequisiteComponent implements OnInit {
  action = 'Add Course Prerequisite';
  submit = 'Submit';
  isLoading = false;
  courses: CourseModel[] = [];
  prerequisiteForm: FormGroup;

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private fb: FormBuilder,
    private coursePrerequisiteService: CoursePrerequisiteService,
    private courseService: CourseService,
    private message: NzMessageService
  ) {
    this.createForm();
  }

  ngOnInit(): void {
    this.loadCourses();
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'null') {
      this.action = 'Edit Course Prerequisite';
      this.submit = 'Update';
      this.loadPrerequisite(id);
    }
  }

  courseNotSameValidator(group: FormGroup): ValidationErrors | null {
    const course = group.get('courseId')?.value;
    const prerequisite = group.get('preRequisiteCourseId')?.value;
    return course && prerequisite && course === prerequisite
      ? { sameCourse: true }
      : null;
  }
  createForm() {
    this.prerequisiteForm = this.fb.group({
      courseId: ['', [Validators.required]],
      preRequisiteCourseId: ['', [Validators.required]],
      remark: ['', [Validators.maxLength(250)]]
    }, { validators: [this.courseNotSameValidator] });
  }

  loadCourses(): void {
    this.isLoading = true;
    this.courseService.getAllCourses().subscribe({
      next: (res: any) => {
        if (Array.isArray(res)) {
          this.courses = res;
        } else if (res && Array.isArray(res.data)) {
          this.courses = res.data;
        } else {
          this.courses = [];
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.message.error('Failed to load courses');
        this.courses = [];
        this.isLoading = false;
      }
    });
  }

  loadPrerequisite(id: string): void {
    this.isLoading = true;
    this.coursePrerequisiteService.getCoursePrerequisiteById(id).subscribe({
      next: (res) => {
        this.prerequisiteForm.patchValue({
          courseId: res.data.courseID,
          preRequisiteCourseId: res.data.preRequisiteCourseID,
          remark: res.data.remark
        });
        this.isLoading = false;
      },
      error: (error) => {
        this.message.error('Failed to load course prerequisite');
        this.isLoading = false;
      }
    });
  }

  submitForm(): void {
    if (this.prerequisiteForm.invalid || this.prerequisiteForm.errors && this.prerequisiteForm.errors['sameCourse']) {
      this.message.error('Please fill in all required fields correctly and ensure Course and Prerequisite are not the same');
      return;
    }

    // this.isLoading = true;
    const id = this.route.snapshot.paramMap.get('id');
    const formData = this.prerequisiteForm.value;

    if (id && id !== 'null') {
      this.coursePrerequisiteService.updateCoursePrerequisite(id, formData).subscribe({
        next: () => {
          console.log('Update success');
          this.message.success('Course prerequisite updated successfully');
          this.router.navigate(['course/course-prerequisite']).then(
            (navigated) => {
              if (!navigated) {
                this.isLoading = false;
                this.message.error('Navigation failed.');
              }
            },
            (err) => {
              this.isLoading = false;
              this.message.error('Navigation error: ' + err);
            }
          );
        },
        error: (error) => {
          console.error('Update error', error);
          this.message.error('Failed to update course prerequisite');
          this.isLoading = false;
        }
      });
    } else {
      this.coursePrerequisiteService.createCoursePrerequisite(formData).subscribe({
        next: () => {
          console.log('Create success');
          this.message.success('Course prerequisite created successfully');
          this.router.navigate(['course/course-prerequisite']).then(
            (navigated) => {
              if (!navigated) {
                this.isLoading = false;
                this.message.error('Navigation failed.');
              }
            },
            (err) => {
              this.isLoading = false;
              this.message.error('Navigation error: ' + err);
            }
          );
        },
        error: (error) => {
          console.error('Create error', error);
          this.message.error('Failed to create course prerequisite');
          this.isLoading = false;
        }
      });
    }
  }
}
