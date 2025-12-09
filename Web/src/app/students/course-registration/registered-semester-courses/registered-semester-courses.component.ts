import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { StudentService } from '../../services/student.service';
import { StudentViewModel } from '../../models/student-view-model.model';
import { StaticData } from 'src/app/admission-request/model/StaticData';
import { ACADEMIC_TERM_STATUS, ACADEMIC_YEAR_NUMBER_STATUS, APPROVAL_STATUS, COURSE_REGISTRATION_STATUS } from 'src/app/common/constant';
import { StudentCourseRegistrationView } from '../../models/student-course-registration-view.model';

@Component({
  selector: 'app-registered-semester-courses',
  templateUrl: './registered-semester-courses.component.html',
  styleUrls: ['./registered-semester-courses.component.scss']
})
export class RegisteredSemesterCoursesComponent implements OnInit {
  studentTermCourseReg: StudentCourseRegistrationView[] = [];
  applicantUserId: string;
  listOfTermNumber: StaticData[] = [];
  listOfYearNumber: StaticData[] = [];
  expandSet = new Set<string>();
  approvalStatusList: StaticData[] = [];
  constructor(
    private _route: Router,
    private _studentService: StudentService
  ) { }
  ngOnInit(): void {
    this.getListOfAcademicTermStatus();
    this.getListOfYearNumberStatus();
    this.getListOfRegisterApprovalStatus();
    this.applicantUserId = localStorage.getItem('userId');
    if (this.applicantUserId != undefined) {
      this.getListOfStudentCourseTaken(this.applicantUserId);
    }
  }

  getListOfStudentCourseTaken(applicantUserId: string) {
    this._studentService
      .getStudentCourseTakenList(applicantUserId)
      .subscribe((res) => {
        this.studentTermCourseReg = res;
        console.log("list  ",this.studentTermCourseReg);
      });

  }

  onExpandChange(id: string, checked: boolean): void {
    if (checked) {
      this.expandSet.clear(); // Ensure only one row expands at a time
      this.expandSet.add(id);
    } else {
      this.expandSet.delete(id);
    }
  }


  getCourseDetails(data: any): any[] {
    if (data.courseTermOfferings && data.courseTermOfferings.length > 0) {
      return data.courseTermOfferings.map((c, index) => {
        return {
          number: index + 1,
          title: c.courseTitle,
          code: c.courseCode,
          creditHours: c.creditHours,
          grade: c.grade,
          point: c.point,
          status: c.status,
        };
      });
    }
    return [];
  }
  getTotalCreditHours(data: any): number {
    let totalCreditHours = 0;
    if (data.courseTermOfferings && data.courseTermOfferings.length > 0) {
      data.courseTermOfferings.forEach((c) => {
        totalCreditHours += c.creditHours;
      });
    }
    return totalCreditHours;
  }

  calculateGPA(data: any): number {
    let totalPoints = 0;
    let totalCreditHours = 0;
    if (data.courseTermOfferings && data.courseTermOfferings.length > 0) {
      data.courseTermOfferings.forEach((course) => {
        totalPoints += course.point;
        totalCreditHours += course.creditHours;
      });
    }
    const gpa = totalPoints / totalCreditHours;
    return Math.round(gpa * 100) / 100;
  }
  getTotalPoints(data: any): number {
    let totalPoints = 0;
    if (data.courseTermOfferings && data.courseTermOfferings.length > 0) {
      data.courseTermOfferings.forEach((course) => {
        totalPoints += course.point;
      });

    }
    return totalPoints;
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
  getListOfRegisterApprovalStatus() {
    let division: StaticData = new StaticData();
    COURSE_REGISTRATION_STATUS.forEach((pair) => {
      division = {
        Id: pair.Id.toString(),
        Description: pair.Description,
      };
      this.approvalStatusList.push(division);
    });
  }
  getStatusDescription(Id: any) {
    const program = this.approvalStatusList.find((item) => item.Id == Id);
    return program ? program.Description : '';
  }
  getYearNumberDescription(Id: any) {
    const program = this.listOfYearNumber.find((item) => item.Id == Id);
    return program ? program.Description : '';
  }

  getAcademicTermStatusDescription(Id: any) {
    const program = this.listOfTermNumber.find((item) => item.Id == Id);
    return program ? program.Description + " - " : '';
  }

}
