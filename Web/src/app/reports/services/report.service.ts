import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { RegisteredStudentPerCourse } from '../model/registered-student-per-course.model';
import { RegisteredStudentPerBatch } from '../model/registered-student-per-batch.model';
import { CourseOfferedPerTerm } from '../model/course-offered-per-term.model';
import { SearchQueryParams } from '../SearchParam/search-query-params';

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

}
