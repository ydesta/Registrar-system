import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CourseViewModel } from 'src/app/students/models/course-break-down-offering.model';
import { StudentService } from 'src/app/students/services/student.service';
import { NzMessageService } from 'ng-zorro-antd/message';

export class StudentAddedViewModel {
  public studentId: string;
  public courseId: string;
  public studentCourseOfferingId: string;
  public courseTakenId: string;
  public fullName: string;
  public batchCode: string;
}

export class CourseTaken {
  public id: number;
  public status: number;
}

@Component({
  selector: 'app-add-course-approval',
  templateUrl: './add-course-approval.component.html',
  styleUrls: ['./add-course-approval.component.scss']
})
export class AddCourseApprovalComponent implements OnInit {
  listOfAddedCourses: CourseViewModel[] = [];
  listOfStudents: StudentAddedViewModel[] = [];
  formAddedCourses: FormGroup;
  approvalForm: FormGroup;
  loading = false;
  setOfCheckedId = new Set<string>();
  checked = false;
  indeterminate = false;
  listOfCurrentPageData: readonly any[] = [];

  get approvedCount(): number {
    return this.setOfCheckedId.size;
  }

  get rejectedCount(): number {
    return this.listOfStudents.filter(student => student.courseTakenId && !this.setOfCheckedId.has(student.courseTakenId)).length;
  }

  constructor(
    private courseApprovalService: StudentService,
    private _fb: FormBuilder,
    private message: NzMessageService
  ) {
    this.createForms();
  }

  ngOnInit(): void {
    this.getListOfAddedCourses();
    this.courseId.valueChanges.subscribe((value) => {
      if (value) {
        this.getListOfStudentCourseAdded(value);
      }
    });
  }

  createForms() {
    this.formAddedCourses = this._fb.group({
      courseId: ['', Validators.required],
    });

    this.approvalForm = this._fb.group({
      approvalStatus: ['', Validators.required]
    });
  }

  get courseId() {
    return this.formAddedCourses.get('courseId');
  }

  getListOfStudentCourseAdded(courseId?: string) {
    this.loading = true;
    this.courseApprovalService.getListOfStudentCourseAdded(courseId)
      .subscribe({
        next: (data: any[]) => {
          this.listOfStudents = data.map(item => ({
            studentId: item.studentId,
            courseId: item.courseId,
            studentCourseOfferingId: item.studentCourseOfferingId,
            courseTakenId: item.courseTakenId,
            fullName: item.fullName,
            batchCode: item.batchCode
          }));
          this.loading = false;
        },
        error: (error) => {
          console.error('Error fetching student courses:', error);
          this.loading = false;
          this.message.error('Failed to fetch student courses');
        }
      });
  }

  getListOfAddedCourses() {
    this.loading = true;
    this.courseApprovalService.getListOfAddedCourse()
      .subscribe({
        next: (data: CourseViewModel[]) => {
          this.listOfAddedCourses = data;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error fetching courses:', error);
          this.loading = false;
          this.message.error('Failed to fetch courses');
        }
      });
  }

  onItemChecked(id: string, checked: boolean): void {
    this.updateCheckedSet(id, checked);
    this.refreshCheckedStatus();
  }

  onAllChecked(checked: boolean): void {
    this.listOfStudents
      .filter(item => item.courseTakenId) // Only select items that have courseTakenId
      .forEach(item => this.updateCheckedSet(item.courseTakenId, checked));
    this.refreshCheckedStatus();
  }

  updateCheckedSet(id: string, checked: boolean): void {
    if (checked) {
      this.setOfCheckedId.add(id);
    } else {
      this.setOfCheckedId.delete(id);
    }
  }

  refreshCheckedStatus(): void {
    const validItems = this.listOfStudents.filter(item => item.courseTakenId);
    this.checked = validItems.every(item => this.setOfCheckedId.has(item.courseTakenId));
    this.indeterminate = validItems.some(item => this.setOfCheckedId.has(item.courseTakenId)) && !this.checked;
  }

  onCurrentPageDataChange(listOfCurrentPageData: readonly any[]): void {
    this.listOfCurrentPageData = listOfCurrentPageData;
    this.refreshCheckedStatus();
  }

  submitApproval() {
    if (this.listOfStudents.length > 0) {
      const courseTakens: CourseTaken[] = this.listOfStudents
        .filter(student => student.courseTakenId)
        .map(student => ({
          id: parseInt(student.courseTakenId),
          status: this.setOfCheckedId.has(student.courseTakenId) ? 3 : 2
        }));
      
      this.loading = true;
      this.courseApprovalService.submitCourseTakenApproval(courseTakens)
        .subscribe({
          next: (response) => {
            this.loading = false;
            this.message.success('Course approval submitted successfully');
            this.formAddedCourses.reset();
            this.listOfStudents = [];
            this.setOfCheckedId.clear();
            this.checked = false;
            this.indeterminate = false;
            // Reload both course and student lists
            this.getListOfAddedCourses();
            if (this.courseId.value) {
              this.getListOfStudentCourseAdded(this.courseId.value);
            }
          },
          error: (error) => {
            this.loading = false;
            this.message.error('Failed to submit course approval');
            console.error('Error submitting approval:', error);
          }
        });
    } else {
      this.message.warning('No students to approve');
    }
  }
}
