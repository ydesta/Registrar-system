import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { StudentService } from '../../services/student.service';
import { StudentProfileViewModel } from '../../models/student-profile-view-model.model';
import { StaticData } from 'src/app/admission-request/model/StaticData';
import {
  ACADEMIC_YEAR_NUMBER_STATUS,
  ACADEMIC_TERM_STATUS,
} from 'src/app/common/constant';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/services/auth.service';

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
  isUserAdmin = false;
  isUserInstructor = false;
  isUserStudent = false;
  isUserApplicant = false;
  isUserReviewer = false;
  isUserApprovedApplicant = false;
  isUserAcademicDirector = false;
  isUserReception = false;
  studentList: any;
  searchCollapse = true;
  initials = '';
  isLoading = false;
  progStatusId: any;

  constructor(
    private studentServices: StudentService,
    private _fb: FormBuilder,
    public aciveRoute: ActivatedRoute,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    this.userId = localStorage.getItem('userId') || localStorage.getItem('user_id');
    this.progStatusId = this.aciveRoute.snapshot.paramMap.get('id');
    this.applyRoles();
    if (this.progStatusId && this.progStatusId !== 'null' && this.progStatusId.trim() !== '') {
      this.getListStudentProfileByStudentId(this.progStatusId);
    }
    this.studentProfileForm = this._fb.group({
      StudentId: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    if (this.isUserInstructor || this.isUserAdmin || this.isUserAcademicDirector) {
      this.getStudentList();
    }
    this.getListOfYearNumberStatus();
    this.getListOfAcademicTermStatus();
    if (this.userId && this.isUserApprovedApplicant) {
      this.getStudentProfileByStudentId();
    }
    this.StudentId.valueChanges.subscribe((res) => {
      if (res && res !== 'null' && res.trim() !== '' && (this.isUserInstructor || this.isUserAdmin || this.isUserAcademicDirector)) {
        this.getListStudentProfileByStudentId(res);
      }
    });
  }

  get StudentId() {
    return this.studentProfileForm.get('StudentId');
  }

  getStudentProfileByStudentId() {
    this.isLoading = true;
    this.studentServices.getStudentProfileByStudentId(this.userId).subscribe({
      next: (res) => {
        this.applyProfile(res);
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  getListStudentProfileByStudentId(studentId: string) {
    if (!studentId || studentId === 'null' || studentId.trim() === '') {
      this.isLoading = false;
      return;
    }
    this.isLoading = true;
    this.studentServices.getListStudentProfileByStudentId(studentId).subscribe({
      next: (res) => {
        if (res) {
          this.applyProfile(res);
        }
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  isValidProfilePicture(url: string | null): boolean {
    return url !== null && !url.includes('/null');
  }

  getStudentList() {
    this.studentServices.getAllStudentList().subscribe((res: any) => {
      this.studentList = res.data;
    });
  }

  getListOfYearNumberStatus() {
    ACADEMIC_YEAR_NUMBER_STATUS.forEach((pair) => {
      this.listOfYearNumber.push({
        Id: pair.Id.toString(),
        Description: pair.Description,
      });
    });
  }

  getListOfAcademicTermStatus() {
    ACADEMIC_TERM_STATUS.forEach((pair) => {
      this.listOfTermNumber.push({
        Id: pair.Id.toString(),
        Description: pair.Description,
      });
    });
  }

  getAcademicTermStatusDescription(Id: any) {
    return this.listOfTermNumber.find((item) => item.Id == Id)?.Description || '';
  }

  getAcademicYearStatusDescription(Id: any) {
    return this.listOfYearNumber.find((item) => item.Id == Id)?.Description || '';
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
    if (!courses?.length) {
      return 0;
    }
    const validCourses = this.getValidCoursesForGpa(courses);
    if (!validCourses.length) {
      return 0;
    }
    const totalPoints = validCourses.reduce((total, course) => total + course.points, 0);
    const totalCreditHours = validCourses.reduce((total, course) => total + course.creditHours, 0);
    return totalCreditHours === 0 ? 0 : totalPoints / totalCreditHours;
  }

  getCGPA(academicYears: any[]): number {
    let totalPoints = 0;
    let totalCreditHours = 0;
    for (const academicYear of academicYears || []) {
      for (const academicTerm of academicYear?.studentAcademicTerms || []) {
        const validCourses = this.getValidCoursesForGpa(academicTerm.studentCoursesTaken || []);
        totalPoints += validCourses.reduce((total, course) => total + course.points, 0);
        totalCreditHours += validCourses.reduce((total, course) => total + course.creditHours, 0);
      }
    }
    return totalCreditHours === 0 ? 0 : totalPoints / totalCreditHours;
  }

  getCumulativeCgpa(upToYear: any, upToTerm: any): number {
    const years = this.studentProfile?.studentAcademicYears || [];
    let totalPoints = 0;
    let totalCreditHours = 0;

    for (const academicYear of years) {
      for (const academicTerm of academicYear?.studentAcademicTerms || []) {
        const validCourses = this.getValidCoursesForGpa(academicTerm.studentCoursesTaken || []);
        totalPoints += validCourses.reduce((total, course) => total + course.points, 0);
        totalCreditHours += validCourses.reduce((total, course) => total + course.creditHours, 0);

        const sameYear = academicYear?.year === upToYear?.year;
        const sameTerm = academicTerm?.academicTerm === upToTerm?.academicTerm;
        if (sameYear && sameTerm) {
          return totalCreditHours === 0 ? 0 : totalPoints / totalCreditHours;
        }
      }
    }

    return totalCreditHours === 0 ? 0 : totalPoints / totalCreditHours;
  }

  private getValidCoursesForGpa(courses: any[]): any[] {
    return (courses || []).filter(
      (course) =>
        course.grade &&
        course.grade !== '-' &&
        course.grade !== 'RC' &&
        course.grade !== 'RA' &&
        course.creditHours > 0
    );
  }

  isPassingGrade(grade: string): boolean {
    if (!grade) {
      return false;
    }
    const g = grade.trim().toUpperCase();
    return ['A', 'A+', 'A-', 'B', 'B+', 'B-', 'C', 'C+', 'C-', 'D', 'D+', 'P'].includes(g);
  }

  isFailingGrade(grade: string): boolean {
    if (!grade) {
      return false;
    }
    const g = grade.trim().toUpperCase();
    return g === 'F' || g === 'NG' || g === 'I';
  }

  getInitials(fullName: string): string {
    if (!fullName) {
      return '';
    }
    const nameParts = fullName.split(' ');
    return (nameParts[0]?.charAt(0) || '').toUpperCase() + (nameParts[1]?.charAt(0) || '').toUpperCase();
  }

  onSearchStudent(searchText: string): void {
    if (searchText && searchText.length >= 3) {
      this.studentServices.searchStudents(searchText).subscribe((res: any) => {
        this.studentList = res.data || [];
      });
      return;
    }
    this.studentList = [];
  }

  private applyRoles(): void {
    this.isUserAdmin = this.authService.hasRole('Super Admin') || this.authService.hasRole('Admin') || this.authService.hasRole('Administrator');
    this.isUserInstructor = this.authService.hasRole('Instructor');
    this.isUserStudent = this.authService.hasRole('Student');
    this.isUserReviewer = this.authService.hasRole('Reviewer');
    this.isUserApplicant = this.authService.hasRole('Applicant');
    this.isUserApprovedApplicant = this.authService.hasRole('ApprovedApplicant');
    this.isUserAcademicDirector = this.authService.hasRole('Academic Director');
    this.isUserReception = this.authService.hasRole('Reception');
  }

  private applyProfile(res: StudentProfileViewModel): void {
    this.studentProfile = res;
    this.profilePicture = res.photoUrl
      ? environment.fileUrl + '/Resources/profile/' + res.photoUrl
      : '';
    this.initials = this.getInitials(res.fullName);
    this.refreshTableLayout();
  }

  private refreshTableLayout(): void {
    this.cdr.detectChanges();
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
      this.cdr.detectChanges();
    }, 300);
  }
}
