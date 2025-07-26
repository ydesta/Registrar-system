import { Component, OnInit } from '@angular/core';
import { StaticData } from 'src/app/admission-request/model/StaticData';
import { ACADEMIC_TERM_STATUS } from 'src/app/common/constant';
import { StudentProfileViewModel } from 'src/app/students/models/student-profile-view-model.model';
import { StudentService } from 'src/app/students/services/student.service';
import { NzMessageService } from 'ng-zorro-antd/message';



@Component({
  selector: 'app-add-course-request',
  templateUrl: './add-course-request.component.html',
  styleUrls: ['./add-course-request.component.scss']
})
export class AddCourseRequestComponent implements OnInit {
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
      .subscribe({
        next: (response) => {
          this.listOfOfAddDropCourse = response;
          this.calculateTotals();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error fetching course data:', error);
          this.message.error('Failed to fetch course data');
          this.loading = false;
        }
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
}
