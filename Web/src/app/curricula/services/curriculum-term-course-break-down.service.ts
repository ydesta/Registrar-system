import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, map } from "rxjs";
import { environment } from "src/environments/environment";

@Injectable({
  providedIn: "root"
})
export class CurriculumTermCourseBreakDownService {
  baseUrl = environment.baseUrl;
  private readonly curriculumTernCourseBreakdowns: string = `/${environment.apiVersion}/curriculumtermcoursebreakdown`;
  getCurriculumTermCourseBreakdownsUrl() {
    return this.baseUrl + this.curriculumTernCourseBreakdowns;
  }
  constructor(private httpClient: HttpClient) {}

  create(postData: any): Observable<any> {
    const endPointUrl = `${this.getCurriculumTermCourseBreakdownsUrl()}`;
    return this.httpClient.post<any>(endPointUrl, postData).pipe(
      map(data => {
        return data;
      })
    );
  }
  update(id: number, postData: any): Observable<any> {
    const endPointUrl = `${this.getCurriculumTermCourseBreakdownsUrl()}/${id}`;
    return this.httpClient.patch<any>(endPointUrl, postData).pipe(
      map(data => {
        return data;
      })
    );
  }

  delete(id: number): Observable<any> {
    const endPointUrl = `${this.getCurriculumTermCourseBreakdownsUrl()}/${id}`;
    return this.httpClient.delete<any>(endPointUrl).pipe(
      map(data => {
        return data;
      })
    );
  }
  getCurriculumCourseBreakdowns(
    id: string,
    yearNumber: number
  ): Observable<any[]> {
    const endpointUrl = `${this.getCurriculumTermCourseBreakdownsUrl()}/getCurriculumCourseBreakdowns/${id}/${yearNumber}`;
    return this.httpClient
      .get(endpointUrl)
      .pipe(map(result => result as any[]));
  }
  getCurriculumCourseBreakdownList(): Observable<any[]> {
    const endpointUrl = `${this.getCurriculumTermCourseBreakdownsUrl()}`;
    return this.httpClient
      .get(endpointUrl)
      .pipe(map(result => result as any[]));
  }
  getListOfUnRegisteredCourse(): Observable<any[]> {
    const endpointUrl = `${this.getCurriculumTermCourseBreakdownsUrl()}/getUnSelectedCourse`;
    return this.httpClient
      .get(endpointUrl)
      .pipe(map(result => result as any[]));
  }
  getCurriculumTermBreakdownById(id: number): Observable<any> {
    const endpointUrl = `${this.getCurriculumTermCourseBreakdownsUrl()}/${id}`;
    return this.httpClient.get(endpointUrl).pipe(map(result => result as any));
  }
  getSavedCourses(
    curId: string,
    term: number,
    year: number
  ): Observable<any[]> {
    const endpointUrl = `${this.getCurriculumTermCourseBreakdownsUrl()}/getCurriculumTermYearCourseBreakdowns/${curId}/${term}/${year}`;
    return this.httpClient
      .get(endpointUrl)
      .pipe(map(result => result as any[]));
  }
  getListOfUnRegisteredCourseById(
    curId: string,
    term: number,
    year: number
  ): Observable<any[]> {
    const endpointUrl = `${this.getCurriculumTermCourseBreakdownsUrl()}/getListOfUnRegisteredCourse/yearBreakdown/${curId}/${term}/${year}`;
    return this.httpClient
      .get(endpointUrl)
      .pipe(map(result => result as any[]));
  }
}
