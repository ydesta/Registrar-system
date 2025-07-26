import { Component, OnInit } from '@angular/core';
import { StudentService } from '../../services/student.service';
import { StudentProfileViewModel } from '../../models/student-profile-view-model.model';
import { StaticData } from 'src/app/admission-request/model/StaticData';
import {
  ACADEMIC_YEAR_NUMBER_STATUS,
  ACADEMIC_TERM_STATUS,
} from 'src/app/common/constant';
import { environment } from 'src/environments/environment';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-student-profile-summary',
  templateUrl: './student-profile-summary.component.html',
  styleUrls: ['./student-profile-summary.component.scss'],
})
export class StudentProfileSummaryComponent implements OnInit {
  studentProfile: StudentProfileViewModel;
  userId: string;
  listOfTermNumber: StaticData[] = [];
  listOfYearNumber: StaticData[] = [];
  profilePicture: string | null = null;
  studentProfileForm: FormGroup;
  public isUserAdmin: boolean = false;
  public isUserInstructor: boolean = false;
  public isUserStudent: boolean = false;
  public isUserApplicant: boolean = false;
  public isUserReviewer: boolean = false;
  public isUserAuthenticated: boolean = false;
  public isUserApprovedApplicant: boolean = false;
  public isUserAlreadyApplied: boolean = false;
  public studentList: any;
  searchCollapse = true;
  initials: string = '';
  isLoading: boolean = false;
  constructor(
    private studentServices: StudentService,
    private _fb: FormBuilder
  ) {
    this.userId = localStorage.getItem('userId');
    this.getLoggedRole();
    this.studentProfileForm = this._fb.group({
      StudentId: ['', Validators.required],
    });

  }
  ngOnInit(): void {
    if ((this.isUserInstructor || this.isUserAdmin)) {
      this.getStudentList();
    }
    this.getListOfYearNumberStatus();
    this.getListOfAcademicTermStatus();
    if (this.userId != undefined && this.isUserApprovedApplicant) {
      this.getStudentProfileByStudentId();
    }
    this.StudentId.valueChanges.subscribe((res) => {
      if (res && (this.isUserInstructor || this.isUserAdmin)) {
        this.getListStudentProfileByStudentId(res);
      }
    });
  }

  getStudentProfileByStudentId() {
    this.isLoading = true;
    this.studentServices
      .getStudentProfileByStudentId(this.userId)
      .subscribe({
        next: (res) => {
          this.profilePicture = res.photoUrl;
          if (this.profilePicture) {
            this.profilePicture = res.photoUrl
              ? environment.fileUrl + '/Resources/profile/' + this.profilePicture
              : '';
          }
          this.studentProfile = res;
          this.initials = this.getInitials(this.studentProfile.fullName);
          this.isLoading = false;
        },
        error: (error) => {
          this.isLoading = false;
        }
      });
  }
  getListStudentProfileByStudentId(studentId: string) {
    this.isLoading = true;
    this.studentServices
      .getListStudentProfileByStudentId(studentId)
      .subscribe({
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
        error: (error) => {
          this.isLoading = false;
        }
      });
  }
  getLoggedRole() {
    const role = localStorage.getItem('role');
    this.isUserAdmin = role === 'Super Admin' || role === 'Admin';
    this.isUserInstructor = role === 'Instructor';
    this.isUserStudent = role === 'Student';
    this.isUserReviewer = role === 'Reviewer';
    this.isUserApplicant = role === 'Applicant';
    this.isUserApprovedApplicant = role === 'ApprovedApplicant';
  }

  isValidProfilePicture(url: string | null): boolean {
    return url !== null && !url.includes('/null');
  }
  get StudentId() {
    return this.studentProfileForm.get('StudentId');
  }
  getStudentProfileById() {
    this.studentServices.getStudentProfileById().subscribe((res) => {
      this.studentProfile = res;
    });
  }
  getStudentList() {
    this.studentServices.getAllStudentList().subscribe((res: any) => {
      this.studentList = res.data;
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
  getTotalCreditHours(courses: any[]): number {
    return courses.reduce((total, course) => total + course.creditHours, 0);
  }

  getTotalPoints(courses: any[]): number {
    return courses.reduce((total, course) => total + course.points, 0);
  }
  getGPA(courses: any[]): number {
    if (courses.length === 0) {
      return 0; // Handle division by zero
    }

    const totalPoints = courses.reduce(
      (total, course) => total + course.points,
      0
    );
    const totalCreditHours = courses.reduce(
      (total, course) => total + course.creditHours,
      0
    );

    return totalPoints / totalCreditHours;
  }

  getCGPA(academicYears: any[]): number {
    let totalPoints = 0;
    let totalCreditHours = 0;

    for (const academicYear of academicYears) {
      for (const academicTerm of academicYear?.studentAcademicTerms) {
        totalPoints += academicTerm.studentCoursesTaken.reduce(
          (total, course) => total + course.points,
          0
        );
        totalCreditHours += academicTerm.studentCoursesTaken.reduce(
          (total, course) => total + course.creditHours,
          0
        );
      }
    }

    if (totalCreditHours === 0) {
      return 0; // Handle division by zero
    }

    return totalPoints / totalCreditHours;
  }
  getInitials(fullName: string): string {
    if (!fullName) return '';
    const nameParts = fullName.split(' ');
    const firstName = nameParts[0] || '';
    const fatherName = nameParts[1] || '';
    return firstName.charAt(0).toUpperCase() + fatherName.charAt(0).toUpperCase(); // D + B
  }
  onSearchStudent(searchText: string): void {
    if (searchText && searchText.length >= 3) {
      this.studentServices
        .searchStudents(searchText)
        .pipe(debounceTime(300), distinctUntilChanged())
        .subscribe((res: any) => {
          this.studentList = res.data || [];
        });
    } else {
      this.studentList = [];
    }
  }

}
