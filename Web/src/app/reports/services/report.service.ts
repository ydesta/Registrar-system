import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
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
  baseUrl = environment.baseUrl;
  private readonly _reports: string = `/${environment.apiVersion}/rpt`;
  getReportsUrl() {
    return this.baseUrl + this._reports;
  }

  constructor(private httpClient: HttpClient) { }

  getListOfRegisteredStudentPerCourse(
    searchParms: SearchQueryParams
  ): Observable<RegisteredStudentPerCourse> {
    const endpointUrl = `${this.getReportsUrl()}/getListOfRegisteredStudentPerCourse`;
    let saParams = new HttpParams()
      .append('termId', searchParms.termId.toString())
      .append('termYear', searchParms.termYear.toString());
    
    // Only add courseId if it's not null or undefined
    if (searchParms.courseId != null) {
      saParams = saParams.append('courseId', searchParms.courseId.toString());
    }
    
    return this.httpClient.get<RegisteredStudentPerCourse>(endpointUrl, { params: saParams });
  }

  getListOfRegisteredStudentPerBatch(
    searchParms: SearchQueryParams
  ): Observable<RegisteredStudentPerBatch[]> {
    const endpointUrl = `${this.getReportsUrl()}/getListOfRegisteredStudent/PerBatch`;
    let saParams = new HttpParams()
      .append('termId', searchParms.termId.toString())
      .append('termYear', searchParms.termYear.toString())
      .append('batchCode', searchParms.batchCode.toString());
    
    // Only add courseId if it's not null or undefined
    if (searchParms.courseId != null) {
      saParams = saParams.append('courseId', searchParms.courseId.toString());
    }
    
    return this.httpClient.get<RegisteredStudentPerBatch[]>(endpointUrl, { params: saParams });
  }

  getListOfCourseOfferedPerTerm(
    searchParms: SearchQueryParams
  ): Observable<CourseOfferedPerTerm[]> {
    const endpointUrl = `${this.getReportsUrl()}`;
    const saParams = new HttpParams()
    .append('termId', searchParms.termId.toString())
    .append('termYear', searchParms.termYear.toString())
    return this.httpClient.get<CourseOfferedPerTerm[]>(endpointUrl, { params: saParams });
  }

  getGradeReport(
    queryParams: GradeReportQueryParams
  ): Observable<PaginatedGradeReportResponse> {
    const endpointUrl = `${this.getReportsUrl()}/getGradeReport`;
    let saParams = new HttpParams()
      .append('termId', queryParams.termId.toString())
      .append('termYear', queryParams.termYear.toString())
      .append('pageIndex', queryParams.pageIndex.toString())
      .append('pageSize', queryParams.pageSize.toString());
    
    // Only add batchCode if it's not null or empty
    if (queryParams.batchCode != null && queryParams.batchCode !== '') {
      saParams = saParams.append('batchCode', queryParams.batchCode.toString());
    }
    
    // Add sort parameters if provided
    if (queryParams.sortField != null && queryParams.sortField !== '') {
      saParams = saParams.append('sortField', queryParams.sortField);
    }
    
    if (queryParams.sortOrder != null && queryParams.sortOrder !== '') {
      saParams = saParams.append('sortOrder', queryParams.sortOrder);
    }
    
    return this.httpClient.get<PaginatedGradeReportResponse>(endpointUrl, { params: saParams });
  }

  getStudentGradeReport(
    queryParams: StudentGradeReportQueryParams
  ): Observable<StudentGradeReportViewModel> {
    const endpointUrl = `${this.getReportsUrl()}/getStudentGradeReport`;
    let saParams = new HttpParams()
      .append('studentId', queryParams.studentId);
    
    if (queryParams.academicTerm != null) {
      saParams = saParams.append('academicTerm', queryParams.academicTerm.toString());
    }
    
    if (queryParams.year != null) {
      saParams = saParams.append('year', queryParams.year.toString());
    }
    
    return this.httpClient.get<StudentGradeReportViewModel>(endpointUrl, { params: saParams });
  }

}
