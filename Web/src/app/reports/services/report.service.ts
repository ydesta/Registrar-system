import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { CrudService } from 'src/app/services/crud.service';
import { RegisteredStudentPerCourse } from '../model/registered-student-per-course.model';
import { RegisteredStudentPerBatch } from '../model/registered-student-per-batch.model';
import { CourseOfferedPerTerm } from '../model/course-offered-per-term.model';
import { SearchQueryParams } from '../SearchParam/search-query-params';
import { GradeReportQueryParams } from '../model/grade-report-query-params.model';
import { PaginatedGradeReportResponse } from '../model/grade-report-view-model.model';
import { StudentGradeReportQueryParams } from '../model/student-grade-report-query-params.model';
import { StudentGradeReportViewModel } from '../model/student-grade-report-view-model.model';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private readonly reports = `/${environment.apiVersion}/rpt`;
  private readonly registrations = `/${environment.apiVersion}/registration`;

  constructor(private crud: CrudService) { }

  getListOfRegisteredStudentPerCourse(
    searchParms: SearchQueryParams
  ): Observable<RegisteredStudentPerCourse> {
    return this.crud.getList<RegisteredStudentPerCourse>(
      `${this.reports}/getListOfRegisteredStudentPerCourse`,
      {
        termId: searchParms.termId,
        termYear: searchParms.termYear,
        courseId: searchParms.courseId
      }
    );
  }

  getListOfRegisteredStudentPerCoursePaginated(
    termId: number,
    termYear: number,
    courseId: string,
    query: string
  ): Observable<any> {
    return this.crud.getPaginated(
      `${this.reports}/getListOfRegisteredStudentPerCourse`,
      query,
      { termId, termYear, courseId }
    );
  }

  getListOfRegisteredStudentPerBatch(
    searchParms: SearchQueryParams
  ): Observable<RegisteredStudentPerBatch[]> {
    return this.crud.getList<RegisteredStudentPerBatch[]>(
      `${this.reports}/getListOfRegisteredStudent/PerBatch`,
      {
        termId: searchParms.termId,
        termYear: searchParms.termYear,
        batchCode: searchParms.batchCode,
        courseId: searchParms.courseId
      }
    );
  }

  getListOfRegisteredStudentPerBatchPaginated(
    termId: number,
    termYear: number,
    batchCode: string,
    query: string
  ): Observable<any> {
    return this.crud.getPaginated(
      `${this.reports}/getListOfRegisteredStudent/PerBatch`,
      query,
      { termId, termYear, batchCode }
    );
  }

  getListOfCourseOfferedPerTerm(
    searchParms: SearchQueryParams
  ): Observable<CourseOfferedPerTerm[]> {
    return this.crud.getList<CourseOfferedPerTerm[]>(
      `${this.reports}/getListOfCourseOfferedPerTerm`,
      {
        termId: searchParms.termId,
        termYear: searchParms.termYear
      }
    );
  }

  getListOfCourseOfferedPerTermPaginated(
    termId: number,
    termYear: number,
    query: string
  ): Observable<any> {
    return this.crud.getPaginated(
      `${this.reports}/getListOfCourseOfferedPerTerm`,
      query,
      { termId, termYear }
    );
  }

  getGradeReport(
    queryParams: GradeReportQueryParams
  ): Observable<PaginatedGradeReportResponse> {
    return this.crud.getList<PaginatedGradeReportResponse>(`${this.reports}/getGradeReport`, {
      termId: queryParams.termId,
      termYear: queryParams.termYear,
      pageIndex: queryParams.pageIndex,
      pageSize: queryParams.pageSize,
      batchCode: queryParams.batchCode,
      sortField: queryParams.sortField,
      sortOrder: queryParams.sortOrder
    });
  }

  getStudentGradeReport(
    queryParams: StudentGradeReportQueryParams
  ): Observable<StudentGradeReportViewModel> {
    return this.crud.getList<StudentGradeReportViewModel>(`${this.reports}/getStudentGradeReport`, {
      studentId: queryParams.studentId,
      academicTerm: queryParams.academicTerm,
      year: queryParams.year
    });
  }

  getRegisteredStudents(searchParms: SearchQueryParams): Observable<any> {
    return this.crud.getList(`${this.registrations}/RegisteredStudent`, {
      AcademicTerm: searchParms.AcademicTerm,
      Course: searchParms.Course,
      Status: searchParms.Status
    });
  }

  getRegisteredStudentsPaginated(searchParms: SearchQueryParams, query: string): Observable<any> {
    return this.crud.getPaginated(`${this.registrations}/RegisteredStudent`, query, {
      academicTerm: searchParms.AcademicTerm,
      course: searchParms.Course,
      status: searchParms.Status
    });
  }

  getLateRegistrationReportPaginated(
    termId: number,
    termYear: number,
    batchCode: string,
    status: string,
    query: string
  ): Observable<any> {
    return this.crud.getPaginated(
      `${this.reports}/getLateRegistrationReport`,
      query,
      { termId, termYear, batchCode, status }
    );
  }
}
