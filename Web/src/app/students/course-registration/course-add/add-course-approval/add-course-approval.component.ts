import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CourseViewModel } from 'src/app/students/models/course-break-down-offering.model';
import { StudentService } from 'src/app/students/services/student.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { StaticData } from 'src/app/admission-request/model/StaticData';
import { REGISTARAR_APPROVAL_STATUS } from 'src/app/common/constant';
import { PaginatorService, ServerPaginator } from 'src/app/reports/services/paginator.service';

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
export class AddCourseApprovalComponent implements OnInit, OnDestroy {
  listOfAddedCourses: CourseViewModel[] = [];
  listOfStudents: StudentAddedViewModel[] = [];
  formAddedCourses: FormGroup;
  approvalForm: FormGroup;
  loading = false;
  setOfCheckedId = new Set<string>();
  checked = false;
  indeterminate = false;
  listOfCurrentPageData: readonly any[] = [];
  approvalStatusList: StaticData[] = [];
  pager: ServerPaginator;

  get approvedCount(): number {
    return this.setOfCheckedId.size;
  }

  get rejectedCount(): number {
    return this.listOfStudents.filter(student => student.courseTakenId && !this.setOfCheckedId.has(student.courseTakenId)).length;
  }

  constructor(
    private courseApprovalService: StudentService,
    private _fb: FormBuilder,
    private message: NzMessageService,
    private paginator: PaginatorService
  ) {
    this.pager = this.paginator.create();
    this.createForms();
  }

  ngOnInit(): void {
    this.getListOfAddedCourses();
    this.getListOfApprovalStatus();
    this.pager.init(() => this.getListOfStudentCourseAdded());
  }

  ngOnDestroy(): void {
    this.pager.destroy();
  }

  createForms() {
    this.formAddedCourses = this._fb.group({
      courseId: ['', Validators.required],
      approvalStatus: [null]
    });

    this.approvalForm = this._fb.group({
      approvalStatus: ['', Validators.required]
    });
  }

  get courseId() {
    return this.formAddedCourses.get('courseId');
  }

  get approvalStatus() {
    return this.formAddedCourses.get('approvalStatus');
  }

  getListOfApprovalStatus() {
    let division: StaticData = new StaticData();
    REGISTARAR_APPROVAL_STATUS.forEach(pair => {
      division = {
        Id: pair.Id.toString(),
        Description: pair.Description
      };
      this.approvalStatusList.push(division);
    });
    // Add "All" option at the beginning
    this.approvalStatusList.unshift({ Id: null, Description: 'All' });
  }

  onSearch() {
    if (!this.courseId.value) {
      this.message.warning('Please select a course');
      return;
    }
    this.pager.pageIndex = 1;
    this.setOfCheckedId.clear();
    this.getListOfStudentCourseAdded();
  }

  getListOfStudentCourseAdded() {
    const courseId = this.courseId.value;
    if (!courseId) {
      return;
    }
    const approvalStatus = this.approvalStatus.value;
    this.pager.loading = true;
    this.loading = true;
    this.courseApprovalService.getListOfStudentCourseAddedPaginated(
      courseId,
      this.pager.query({
        approvalStatus: approvalStatus === null || approvalStatus === undefined || approvalStatus === '' ? null : approvalStatus
      })
    ).subscribe({
      next: (res: any) => {
        this.listOfStudents = (res.data || []).map((item: any) => ({
          studentId: item.studentId || item.sudentId,
          courseId: item.courseId,
          studentCourseOfferingId: item.studentCourseOfferingId,
          courseTakenId: item.courseTakenId != null ? String(item.courseTakenId) : '',
          fullName: item.fullName,
          batchCode: item.batchCode
        }));
        this.pager.applyResult(res);
        this.setOfCheckedId.clear();
        if (approvalStatus === 3 || approvalStatus === '3') {
          this.listOfStudents.forEach(student => {
            if (student.courseTakenId) {
              this.setOfCheckedId.add(student.courseTakenId);
            }
          });
        }
        this.refreshCheckedStatus();
        this.loading = false;
      },
      error: () => {
        this.listOfStudents = [];
        this.pager.fail();
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
            const currentCourseId = this.courseId.value;
            const currentApprovalStatus = this.approvalStatus.value;
            this.setOfCheckedId.clear();
            this.checked = false;
            this.indeterminate = false;
            // Reload student list with current filters
            if (currentCourseId) {
              this.getListOfStudentCourseAdded();
            } else {
              this.listOfStudents = [];
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
