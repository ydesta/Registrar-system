import { Component, OnInit } from '@angular/core';
import { StaticData } from 'src/app/admission-request/model/StaticData';
import { ACADEMIC_TERM_STATUS, ACADEMIC_YEAR_NUMBER_STATUS } from 'src/app/common/constant';
import { StudentSectionAssignmentService } from 'src/app/services/student-section-assignment.service';
import { StudentProfileViewModel } from 'src/app/students/models/student-profile-view-model.model';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-student-course-section-assignment',
  templateUrl: './student-course-section-assignment.component.html',
  styleUrls: ['./student-course-section-assignment.component.scss']
})
export class StudentCourseSectionAssignmentComponent implements OnInit {
  studentProfile: StudentProfileViewModel;
  userId: string;
  listOfTermNumber: StaticData[] = [];
  listOfYearNumber: StaticData[] = [];
  profilePicture: string | null = null;
  public studentList: any;
  searchCollapse = true;
  initials: string = '';
  isLoading: boolean = false;
  progStatusId: any;
  academicTerm: number;
  yearNumber: number;
  nextAcademicTerm: any;
  constructor(private studentSectionAssignmentService: StudentSectionAssignmentService) {
    const next = sessionStorage.getItem('nextAcademicTerm');
    this.nextAcademicTerm = next ? JSON.parse(next) : null;
    
    this.academicTerm = this.nextAcademicTerm.termId;
    this.yearNumber = this.nextAcademicTerm.year;
    this.userId = localStorage.getItem('userId');
  }

  ngOnInit(): void {
    this.getListOfYearNumberStatus();
    this.getListOfAcademicTermStatus();
    this.getStudentSectioningByStudentId(this.userId, this.academicTerm, this.yearNumber);
  }

  getStudentSectioningByStudentId(userId: string, academicTerm?: number, year?: number) {
    this.isLoading = true;
    this.studentSectionAssignmentService.getStudentSectioningByStudentId(userId, academicTerm, year).subscribe({
      next: (res) => {
        if (res) {
          this.studentProfile = res;
          this.profilePicture = res.photoUrl;
          if (this.profilePicture) {
            this.profilePicture = res.photoUrl
              ? environment.fileUrl + '/Resources/profile/' + this.profilePicture
              : '';
          }

          this.initials = this.getInitials(this.studentProfile.fullName);
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching student profile:', err);
        this.isLoading = false;
      }
    });
  }
  getListOfYearNumberStatus() {
    let division: StaticData = new StaticData();
    ACADEMIC_YEAR_NUMBER_STATUS.forEach((pair) => {
      division = {
        Id: pair.Id.toString(),
        Description: pair.Description,
      };
      this.listOfYearNumber.push(division);
    });
  }
  getListOfAcademicTermStatus() {
    let division: StaticData = new StaticData();
    ACADEMIC_TERM_STATUS.forEach((pair) => {
      division = {
        Id: pair.Id.toString(),
        Description: pair.Description,
      };
      this.listOfTermNumber.push(division);
    });
  }
  getAcademicTermStatusDescription(Id: any) {
    const program = this.listOfTermNumber.find((item) => item.Id == Id);
    return program ? program.Description : '';
  }
  getAcademicYearStatusDescription(Id: any) {
    const program = this.listOfYearNumber.find((item) => item.Id == Id);
    return program ? program.Description : '';
  }
  getDefaultImage(): string {
    return 'assets/images/profile.png';
  }
  getInitials(fullName: string): string {
    if (!fullName) return '';
    const nameParts = fullName.split(' ');
    const firstName = nameParts[0] || '';
    const fatherName = nameParts[1] || '';
    return firstName.charAt(0).toUpperCase() + fatherName.charAt(0).toUpperCase(); // D + B
  }
  isValidProfilePicture(url: string | null): boolean {
    return url !== null && !url.includes('/null');
  }
}
