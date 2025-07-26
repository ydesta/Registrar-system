import { Component, OnInit } from '@angular/core';
import { NgxPrintModule } from 'ngx-print';
import { StudentGradeModel } from 'src/app/Models/StudentGradeModel';
import { CrudService } from 'src/app/services/crud.service';
interface Person {
  key: string;
  name: string;
  age: string;
  address: string;
  grade: string;
  gradePoint: string;
}

@Component({
  selector: 'app-student-grade-report',
  templateUrl: './student-grade-report.component.html',
  styleUrls: ['./student-grade-report.component.scss'],
})
export class StudentGradeReportComponent implements OnInit {
  listOfData: Person[] = [
    {
      key: '1',
      name: 'Calculus I',
      age: 'CC230',
      address: '4',
      grade: 'A',
      gradePoint: '16.0',
    },
  ];
  reportQuery: any;
  reportData: any;

  totalCH = 0.0;
  totalGPoint = 0.0;

  totalCHPrevious = 0.0;
  totalGPointPrevious = 0.0;

  currentDate: any;
  courseList: any = [];
  studentGrades: StudentGradeModel[] = [];
  studentPrevGrades: StudentGradeModel[] = [];
  academicProgrammeTitle: string = '';
  constructor(private _crudService: CrudService) {
    this.currentDate = new Date();
  }

  ngOnInit(): void {
    this.reportQuery = JSON.parse(localStorage.getItem('report-query')!);
    this.gradeQueryFormSubmit();
    this.gradeQueryFormSubmitPrev();
  }

  gradeQueryFormSubmitPrev() {
    if (this.reportQuery) {
      this._crudService
        .add('/StudentGrades/reportPrev', this.reportQuery)
        .subscribe((res: any) => {
          this.studentPrevGrades = res.data;
          
          this.gradePointPrev();
          this._crudService
            .getList(
              '/AcadamicProgramme/one/' +
                this.studentPrevGrades![0].student.acadamicProgrammeCode
            )
            .subscribe((res: any) => {
              //this.studentGrades = res.data;
              this.academicProgrammeTitle = res.acadamicProgrammeTitle;
            });
        });
    } else {
      alert('Please select query!');
    }
  }
  gradeQueryFormSubmit() {
    if (this.reportQuery) {
      this._crudService
        .add('/StudentGrades/report', this.reportQuery)
        .subscribe((res: any) => {
          this.studentGrades = res.data;
          this.gradePoint();
          this._crudService
            .getList(
              '/AcadamicProgramme/one/' +
                this.studentGrades![0].student.acadamicProgrammeCode
            )
            .subscribe((res: any) => {
              // this.studentGrades = res.data;
              this.academicProgrammeTitle = res.acadamicProgrammeTitle;
            });
        });
    } else {
      alert('Please select query!');
    }
  }
  //totalGPointPrev
  gradePointPrev() {
    
    this.studentPrevGrades?.map((grade) => {
      if(grade.couse != null) {
        this.totalCHPrevious = this.totalCHPrevious + grade.couse != null? grade.couse.creditHours : 0;
      if (grade.gradeLetter == 'A' || grade.gradeLetter == 'A+') {
        this.totalGPointPrevious = this.totalGPointPrevious + 4.0 * grade.couse != null? grade.couse.creditHours : 0;
      }
      if (grade.gradeLetter == 'B+') {
        this.totalGPointPrevious = this.totalGPointPrevious + 3.5 * grade.couse.creditHours;
      }
      if (grade.gradeLetter == 'B') {
        this.totalGPointPrevious = this.totalGPointPrevious + 3.0 * grade.couse.creditHours;
      }
      if (grade.gradeLetter == 'C+') {
        this.totalGPointPrevious = this.totalGPointPrevious + 2.5 * grade.couse.creditHours;
      }
      if (grade.gradeLetter == 'C') {
        this.totalGPointPrevious = this.totalGPointPrevious + 2.0 * grade.couse.creditHours;
      }
      if (grade.gradeLetter == 'D') {
        this.totalGPointPrevious = this.totalGPointPrevious + 1.0 * grade.couse.creditHours;
      }
      if (grade.gradeLetter == 'F') {
        this.totalGPointPrevious = this.totalGPointPrevious + 0.0 * grade.couse.creditHours;
      } else {
        this.totalGPointPrevious = this.totalGPointPrevious + 0.0 * grade.couse.creditHours;
      }
      }
    });
  }
  //totalGPoint
  gradePoint() {
    this.studentGrades?.map((grade) => {
      this.totalCH = this.totalCH + grade.couse.creditHours;
      if (grade.gradeLetter == 'A' || grade.gradeLetter == 'A+') {
        this.totalGPoint = this.totalGPoint + 4.0 * grade.couse.creditHours;
      }
      if (grade.gradeLetter == 'A-') {
        this.totalGPoint = this.totalGPoint + 3.75 * grade.couse.creditHours;
      }
      if (grade.gradeLetter == 'B+') {
        this.totalGPoint = this.totalGPoint + 3.5 * grade.couse.creditHours;
      }
      if (grade.gradeLetter == 'B') {
        this.totalGPoint = this.totalGPoint + 3.0 * grade.couse.creditHours;
      }
      if (grade.gradeLetter == 'B-') {
        this.totalGPoint = this.totalGPoint + 2.75 * grade.couse.creditHours;
      }
      if (grade.gradeLetter == 'C+') {
        this.totalGPoint = this.totalGPoint + 2.5 * grade.couse.creditHours;
      }
      if (grade.gradeLetter == 'C') {
        this.totalGPoint = this.totalGPoint + 2.0 * grade.couse.creditHours;
      }
      if (grade.gradeLetter == 'D') {
        this.totalGPoint = this.totalGPoint + 1.0 * grade.couse.creditHours;
      }
      if (grade.gradeLetter == 'F') {
        this.totalGPoint = this.totalGPoint + 0.0 * grade.couse.creditHours;
      } else {
        this.totalGPoint = this.totalGPoint + 0.0 * grade.couse.creditHours;
      }
    });
  }
}
