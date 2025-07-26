import { Component, OnInit } from '@angular/core';
import { StudentViewModel } from '../../models/student-view-model.model';
import { StaticData } from 'src/app/admission-request/model/StaticData';
import {
  ACADEMIC_TERM_STATUS,
  ACADEMIC_YEAR_NUMBER_STATUS,
  APPROVAL_STATUS,
} from 'src/app/common/constant';
import { StudentService } from '../../services/student.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-manage-student-course-registration',
  templateUrl: './manage-student-course-registration.component.html',
  styleUrls: ['./manage-student-course-registration.component.scss'],
})
export class ManageStudentCourseRegistrationComponent implements OnInit {
  seasonTitle: string = '';
  studentTermCourseReg: StudentViewModel[] = [];
  applicantUserId: string;
  listOfTermNumber: StaticData[] = [];
  listOfYearNumber: StaticData[] = [];
  expandSet = new Set<string>();
  approvalStatusList: StaticData[] = [];
  constructor(
    private _route: Router,
    private _studentService: StudentService
  ) {}
  ngOnInit(): void {
    this.seasonTitle = this.calculateSeason();
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
      });

  }

  onExpandChange(id: string, checked: boolean): void {
    if (checked) {
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
          grade: c.gradeLetter,
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
    APPROVAL_STATUS.forEach((pair) => {
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
    return program ? program.Description +" - " : '';
  }
  goToRegisterCousre() {
    this._route.navigateByUrl('students/student-course-registration');
  }
  calculateSeason(): string {
    const currentDate = new Date();
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();
    let seasonName = '';

    if (month >= 3 && month <= 5) {
      seasonName = 'Spring';
    } else if (month >= 6 && month <= 8) {
      seasonName = 'Summer';
    } else if (month >= 9 && month <= 11) {
      seasonName = 'Autumn';
    } else {
      seasonName = 'Winter';
    }

    return `${seasonName} ${year} - Term Registration`;
  }

}
