import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { StaticData } from 'src/app/admission-request/model/StaticData';
import { ACADEMIC_TERM_STATUS } from 'src/app/common/constant';
import { CurriculumService } from 'src/app/curricula/services/curriculum.service';
import { CourseService } from 'src/app/services/course.service';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';
import { StudentService } from '../../services/student.service';
import { StaffService } from 'src/app/services/staff.service';
import { GradeChangeRequestService } from 'src/app/services/grade-change-request.service';
import { StudentSearchComponent } from 'src/app/shared-module/shared/components/student-search/student-search.component';

@Component({
  selector: 'app-grade-change-request-form',
  templateUrl: './grade-change-request-form.component.html',
  styleUrls: ['./grade-change-request-form.component.scss']
})
export class GradeChangeRequestFormComponent implements OnInit {
  @ViewChild(StudentSearchComponent) studentSearchComponent!: StudentSearchComponent;

  gradeChangeRequestForm: FormGroup;
  yearList: number[] = [];
  listOfTermNumber: StaticData[] = [];
  curricula: any[] = [];
  courses: any[] = [];
  studentList: any[] = [];
  gradeList: string[] = ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F', 'RC', 'RA', , 'NG', '-'];
  userId: string | null = localStorage.getItem('userId');
  staffId: string | null;
  showSearchForm = true;
  // New properties for the form
  loading = false;

  // Student information properties
  selectedStudent: any = null;
  studentCourses: any[] = [];

  constructor(
    private _route: Router,
    private _fb: FormBuilder,
    private _customNotificationService: CustomNotificationService,
    private _curriculumService: CurriculumService,
    private _courseService: CourseService,
    private studentServices: StudentService,
    private staffService: StaffService,
    private gradeChangeRequestService: GradeChangeRequestService
  ) {
    this.createForm();
    const currentYear = new Date();
    this.yearList = this.getYearRange(currentYear.getFullYear());
  }

  ngOnInit(): void {
    this.getCurriculumList();
    this.getListOfAcademicTermStatus();
    this.getStudentList();
    // Remove the general course list loading since we'll load courses based on student

    if (this.userId) {
      this.staffService.getStaffByUserId(this.userId).subscribe((res: any) => {
        this.staffId = res.data.id;
        this.gradeChangeRequestForm.patchValue({
          staffId: this.staffId
        });
      })
    }
  }

  createForm() {
    this.gradeChangeRequestForm = this._fb.group({
      staffId: [null, [Validators.required]],
      studentId: [null, [Validators.required]],
      // curriculumId: [null, []],
      courseId: [null, Validators.required],
      academicTermId: [null, [Validators.required]],
      academicYear: [null, []],
      previousGrade: [null, [Validators.required]],
      newGrade: [null, [Validators.required]],
      reason: [null, []]
    });
  }

  getStudentList() {
    this.studentServices.getAllStudentList().subscribe({
      next: (res: any) => {
        this.studentList = res.data || [];
      },
      error: (error) => {
        console.error('Error loading students:', error);
        this.studentList = [];
      }
    });
  }

  showSearch(): void {
    this.showSearchForm = true;
    this.selectedStudent = null;
    this.studentCourses = [];
    this.gradeChangeRequestForm.patchValue({
      courseId: null,
      academicTermId: null,
      academicYear: null,
      previousGrade: null,
      newGrade: null,
      reason: null
    });
    this.studentSearchComponent.resetForm();
  }

  onSearchSubmitted(studentId: string): void {
    this.studentServices.getStudentInformationWithInstructor(this.userId!, studentId).subscribe({
      next: (res: any) => {
        if (res) {
          this.selectedStudent = res;
          this.studentCourses = res.courses || [];

          this.gradeChangeRequestForm.patchValue({
            studentId: res.id,
            fullName: res.fullName,
            studentCode: res.studentCode,
            entryYear: res.entryYear,
            academicProgram: res.academicProgram,
            curriculumCode: res.curriculumCode,
            batchCode: res.batchCode
          });
          this.showSearchForm = false;
        } else {
          console.warn('Student not found or null response received.');
        }
      },
      error: (err) => {
        console.error('Error occurred while fetching student information:', err);
      }
    });
  }




  getListOfAcademicTermStatus() {
    this.listOfTermNumber = [];
    ACADEMIC_TERM_STATUS.forEach(pair => {
      const division: StaticData = {
        Id: pair.Id,
        Description: pair.Description
      };
      this.listOfTermNumber.push(division);
    });
  }

  getCourseList() {
    this._courseService
      .getAllCourses()
      .subscribe({
        next: (res: any) => {
          console.log("object      ", res);
          this.courses = res.data || [];
        },
        error: (error) => {
          console.error('Error loading courses:', error);
          this.courses = [];
        }
      });
  }

  getCurriculumList() {
    this._curriculumService.getCurriculumList().subscribe({
      next: (res: any) => {
        this.curricula = res.data || [];
      },
      error: (error) => {
        console.error('Error loading curricula:', error);
        this.curricula = [];
      }
    });
  }

  getYearRange(currentYear: number): number[] {
    const startYear = currentYear - 10;
    const yearList = [];

    for (let year = startYear; year <= currentYear; year++) {
      yearList.push(year);
    }

    return yearList.reverse();
  }


  filterStudentOption = (input: string, option: any): boolean => {
    return option.nzLabel.toLowerCase().indexOf(input.toLowerCase()) >= 0;
  }

  filterCourseOption = (input: string, option: any): boolean => {
    return option.nzLabel.toLowerCase().indexOf(input.toLowerCase()) >= 0;
  }

  onCurriculumChange(curriculumId: any): void {
    this.gradeChangeRequestForm.patchValue({
      courseId: null
    });
  }

  onCourseChange(courseId: any): void {
    const selectedCourse = this.studentCourses.find(course => course.courseId === courseId);
    if (selectedCourse) {
      this.gradeChangeRequestForm.patchValue({
        academicTermId: selectedCourse.academicTerm,
        academicYear: selectedCourse.academicYear,
        previousGrade: selectedCourse.previousGrade
      });
    }
  }

  onSubmit(): void {
    if (this.gradeChangeRequestForm.valid) {
      this.loading = true;

      const formData = this.gradeChangeRequestForm.value;
      this.gradeChangeRequestService.createGradeChange(formData).subscribe({
        next: (response) => {
          this._customNotificationService.notification('success', 'Success', 'Grade change request submitted successfully');
          this.loading = false;
          this.onCancel();
        },
        error: (error) => {
          console.error('Error submitting grade change request:', error);
          this._customNotificationService.notification('error', 'Error', 'Failed to submit grade change request. Please try again.');
          this.loading = false;
        }
      });
    } else {
      this._customNotificationService.notification('error', 'Error', 'Please fill in all required fields');
    }
  }

  onCancel(): void {
    this._route.navigate(['/students/grade-change-request']);
  }
}
