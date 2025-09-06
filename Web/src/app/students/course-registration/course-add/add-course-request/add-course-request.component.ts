import { Component, OnInit, TrackByFunction, OnDestroy } from '@angular/core';
import { StaticData } from 'src/app/admission-request/model/StaticData';
import { ACADEMIC_TERM_STATUS } from 'src/app/common/constant';
import { StudentProfileViewModel } from 'src/app/students/models/student-profile-view-model.model';
import { StudentService } from 'src/app/students/services/student.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Subject } from 'rxjs';
import { takeUntil, finalize, catchError } from 'rxjs/operators';



@Component({
  selector: 'app-add-course-request',
  templateUrl: './add-course-request.component.html',
  styleUrls: ['./add-course-request.component.scss']
})
export class AddCourseRequestComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  listOfOfAddDropCourse: StudentProfileViewModel;
  nextAcademicTerm: any;
  nextTerm = '';
  nextTermYear: number = 0;
  academicTermId = 0;
  courseSectionTitle = '';
  listOfTermNumber: StaticData[] = [];
  applicantId: string = '';
  loading = false;
  totalCreditHours = 0;
  totalAmount = 0;

  constructor(
    private courseApprovalService: StudentService,
    private message: NzMessageService
  ) {}

  ngOnInit(): void {
    this.initializeComponent();
  }

  private initializeComponent(): void {
    this.loading = true;
    this.getListOfAcademicTermStatus();
    this.loadUserData();
    this.loading = false;
  }

  private loadUserData(): void {
    this.applicantId = localStorage.getItem('userId');
    const next = sessionStorage.getItem('nextAcademicTerm');
    this.nextAcademicTerm = next ? JSON.parse(next) : null;
    
    if (this.nextAcademicTerm) {
      this.academicTermId = this.nextAcademicTerm.termId;
      this.nextTermYear = this.nextAcademicTerm.year;
      this.nextTerm = `🎓 Registration : ${this.getAcademicTermStatusDescription(this.nextAcademicTerm.termId)} ${this.nextAcademicTerm.year}`;
      this.getListOfAddDropCourse(this.applicantId, this.academicTermId);
    } else {
      this.message.error('Academic term information not found');
    }
  }

  getListOfAddDropCourse(applicationId: string, academicTermId: number): void {
    this.loading = true;
    this.courseApprovalService.getListOfAddDropCourse(applicationId, academicTermId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.loading = false;
        }),
        catchError((error) => {
          console.error('Error fetching course data:', error);
          this.message.error('Failed to fetch course data');
          return [];
        })
      )
      .subscribe((response) => {
        this.listOfOfAddDropCourse = response;
        this.calculateTotals();
      });
  }

  getListOfAcademicTermStatus(): void {
    this.listOfTermNumber = ACADEMIC_TERM_STATUS.map(pair => ({
      Id: pair.Id.toString(),
      Description: pair.Description
    }));
  }

  getAcademicTermStatusDescription(Id: any): string {
    const program = this.listOfTermNumber.find((item) => item.Id == Id);
    return program ? program.Description : '';
  }

  calculateTotals(): void {
    if (this.listOfOfAddDropCourse?.studentCoursesTaken) {
      // Calculate total credit hours
      this.totalCreditHours = this.listOfOfAddDropCourse.studentCoursesTaken.reduce((sum, course) => 
        sum + (course.creditHours || 0), 0);

      // Calculate total amount
      this.totalAmount = this.listOfOfAddDropCourse.studentCoursesTaken.reduce((sum, course) => 
        sum + (course.totalAmount || 0), 0);
    }
  }

  getStatusColor(status: string): string {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  }

  refreshData(): void {
    this.loading = true;
    this.getListOfAddDropCourse(this.applicantId, this.academicTermId);
  }

  // TrackBy functions for better performance
  trackByCourseId: TrackByFunction<any> = (index: number, course: any) => 
    course?.id || course?.courseCode || index;

  trackByIndex: TrackByFunction<any> = (index: number) => index;

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
