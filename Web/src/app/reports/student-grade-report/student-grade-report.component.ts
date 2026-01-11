import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReportService } from '../services/report.service';
import { ExcelExportService } from '../services/excel-export.service';
import { PdfExportService } from '../services/pdf-export.service';
import { StudentGradeReportQueryParams } from '../model/student-grade-report-query-params.model';
import { StudentGradeReportViewModel, StudentGradeReportTermViewModel } from '../model/student-grade-report-view-model.model';
import { ACADEMIC_TERM_STATUS } from 'src/app/common/constant';
import { StaticData } from 'src/app/admission-request/model/StaticData';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-student-grade-report',
  templateUrl: './student-grade-report.component.html',
  styleUrls: ['./student-grade-report.component.scss']
})
export class StudentGradeReportComponent implements OnInit {
  studentGradeReport: StudentGradeReportViewModel | null = null;
  isLoading = false;
  isExportingExcel = false;
  isExportingPdf = false;
  isFormCollapsed = false;
  hasSearched = false;
  formStudentGradeReport: FormGroup;
  listOfTermNumber: StaticData[] = [];
  yearList: number[] = [];
  
  expandSet = new Set<number>();

  constructor(
    private _reportService: ReportService,
    private _excelExportService: ExcelExportService,
    private _pdfExportService: PdfExportService,
    private _fb: FormBuilder
  ) {
    const currentYear = new Date();
    this.yearList = this.getYearRange(currentYear.getFullYear());
    this.createForm();
  }

  ngOnInit(): void {
    this.getListOfAcademicTermStatus();
  }

  private createForm() {
    this.formStudentGradeReport = this._fb.group({
      studentId: [null, [Validators.required]],
      academicTerm: [null, []],
      year: [null, []],
    });
  }

  get studentId() {
    return this.formStudentGradeReport.get('studentId');
  }

  get academicTerm() {
    return this.formStudentGradeReport.get('academicTerm');
  }

  get year() {
    return this.formStudentGradeReport.get('year');
  }

  getListOfAcademicTermStatus() {
    let division: StaticData = new StaticData();
    ACADEMIC_TERM_STATUS.forEach(pair => {
      division = {
        Id: pair.Id,
        Description: pair.Description
      };
      this.listOfTermNumber.push(division);
    });
  }

  getYearRange(currentYear: number): number[] {
    const startYear = 1998;
    const yearList = [];
    for (let year = startYear; year <= currentYear; year++) {
      yearList.push(year);
    }
    return yearList.reverse();
  }

  getTermDescription(termId: number): string {
    const term = this.listOfTermNumber.find(t => t.Id === termId);
    return term ? term.Description : '';
  }

  getStudentGradeReport() {
    if (!this.formStudentGradeReport.valid) {
      return;
    }

    this.isLoading = true;
    this.hasSearched = true;
    const queryParams = this.buildQueryParams();
    
    this._reportService.getStudentGradeReport(queryParams)
      .subscribe({
        next: (res: StudentGradeReportViewModel) => {
          this.studentGradeReport = res;
          this.isLoading = false;
          this.expandSet.clear();
        },
        error: (err) => {
          console.error('Error fetching student grade report:', err);
          this.isLoading = false;
          this.studentGradeReport = null;
        }
      });
  }

  buildQueryParams(): StudentGradeReportQueryParams {
    const formModel = this.formStudentGradeReport.getRawValue();
    const params = new StudentGradeReportQueryParams();
    params.studentId = formModel.studentId;
    params.academicTerm = formModel.academicTerm || undefined;
    params.year = formModel.year || undefined;
    return params;
  }

  onExpandChange(serialNo: number, checked: boolean): void {
    if (checked) {
      this.expandSet.add(serialNo);
    } else {
      this.expandSet.delete(serialNo);
    }
  }

  loadData() {
    this.formStudentGradeReport.reset();
    this.studentGradeReport = null;
    this.hasSearched = false;
    this.isFormCollapsed = true;
    this.expandSet.clear();
  }

  formatDate(dateString: string | null): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  getInitials(fullName: string): string {
    if (!fullName) return '';
    const names = fullName.trim().split(' ');
    if (names.length === 0) return '';
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  }

  getTotalCreditHours(courses: any[]): number {
    if (!courses || courses.length === 0) return 0;
    return courses.reduce((sum, course) => sum + (course.creditHours || 0), 0);
  }

  getTotalPoints(courses: any[]): number {
    if (!courses || courses.length === 0) return 0;
    return courses.reduce((sum, course) => sum + (course.points || 0), 0);
  }

  exportToExcel(): void {
    if (!this.formStudentGradeReport.valid || !this.studentGradeReport) {
      return;
    }

    this.isExportingExcel = true;
    const profile = this.studentGradeReport.studentProfile;
    
    const excelData: any[] = [
      ['Student Grade Report'],
      [],
      // Student Profile on top right
      [{ v: `Student ID: ${profile.studentId}`, t: 's' }, { v: '', t: 's' }, { v: '', t: 's' }, { v: '', t: 's' }, { v: `Full Name: ${profile.fullName}`, t: 's' }],
      [{ v: `Academic Program: ${profile.academicProgram}`, t: 's' }, { v: '', t: 's' }, { v: '', t: 's' }, { v: '', t: 's' }, { v: `Birth Date: ${this.formatDate(profile.birthDate)}`, t: 's' }],
      [{ v: `Batch Code: ${profile.batchCode}`, t: 's' }, { v: '', t: 's' }, { v: '', t: 's' }, { v: '', t: 's' }, { v: `CGPA: ${this.studentGradeReport.cgpa}`, t: 's' }],
      [],
      ['#', 'Academic Term', 'Year', 'Term GPA', 'Course Code', 'Course Title', 'Credit Hour', 'Grade', 'Points']
    ];

    let rowCounter = 6; // Start adding grades from this row

    this.studentGradeReport.academicTerms.forEach((term, termIndex) => {
      if (term.courses && term.courses.length > 0) {
        term.courses.forEach((course, courseIndex) => {
          excelData.push([
            courseIndex === 0 ? termIndex + 1 : '',
            courseIndex === 0 ? term.academicTermName : '',
            courseIndex === 0 ? term.year : '',
            courseIndex === 0 ? term.termGPA : '',
            course.courseCode,
            course.courseTitle,
            course.creditHours,
            course.grade,
            course.points || 0
          ]);
        });
      } else {
        excelData.push([
          termIndex + 1,
          term.academicTermName,
          term.year,
          term.termGPA,
          '',
          'No course grades available',
          '',
          '',
          ''
        ]);
      }
    });

    const merges: XLSX.Range[] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } }, // Title
      // Profile mergers, extending across
      { s: { r: 2, c: 0 }, e: { r: 2, c: 3 } }, { s: { r: 2, c: 4 }, e: { r: 2, c: 8 } }, // Student ID, Full Name
      { s: { r: 3, c: 0 }, e: { r: 3, c: 3 } }, { s: { r: 3, c: 4 }, e: { r: 3, c: 8 } }, // Academic Program, Birth Date
      { s: { r: 4, c: 0 }, e: { r: 4, c: 3 } }, { s: { r: 4, c: 4 }, e: { r: 4, c: 8 } }, // Batch Code, CGPA
    ];

    this._excelExportService.exportWithCustomLayout(
      excelData,
      'Student_Grade_Report',
      'Grades',
      merges
    );
    this.isExportingExcel = false;
  }

  exportToPdf(): void {
    if (!this.formStudentGradeReport.valid || !this.studentGradeReport) {
      return;
    }

    this.isExportingPdf = true;
    
    this._pdfExportService.exportStudentGradeReportToPdf(
      this.studentGradeReport,
      'Student_Grade_Report'
    );
    
    this.isExportingPdf = false;
  }
}
