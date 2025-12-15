import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, map } from "rxjs";
import {
  Course,
  CurriculumBreakdown
} from "src/app/curricula/models/curriculum-breakdown.model";
import { environment } from "src/environments/environment";

@Injectable({
  providedIn: "root"
})
export class CurriculumQuadrantBreakdownService {
  baseUrl = environment.baseUrl;
  private readonly curriculumQuadrantBreakdowns: string = `/${environment.apiVersion}/curriculumquadrantbreakdowns`;
  private readonly Quadrants: string = `/${environment.apiVersion}/quadrants`;
  private readonly Courses: string = `/${environment.apiVersion}/courses`;
  private readonly curriculum: string = `/${environment.apiVersion}/curriculum`;
  getcurriculumQuadrantBreakdownsUrl() {
    return this.baseUrl + this.curriculumQuadrantBreakdowns;
  }
  getQuadrantsUrl() {
    return this.baseUrl + this.Quadrants;
  }
  getCoursesUrl() {
    return this.baseUrl + this.Courses;
  }
  getCurriculumsUrl() {
    return this.baseUrl + this.curriculum;
  }
  constructor(private httpClient: HttpClient) {}
  getCurriculumQuadrantBreakdownId(id: number): Observable<any> {
    const endpointUrl = `${this.getcurriculumQuadrantBreakdownsUrl()}/${id}`;
    return this.httpClient.get(endpointUrl).pipe(map(result => result as any));
  }
  create(postData: any): Observable<any> {
    const endPointUrl = `${this.getcurriculumQuadrantBreakdownsUrl()}`;
    return this.httpClient.post<any>(endPointUrl, postData).pipe(
      map(data => {
        return data;
      })
    );
  }
  createCurriculumBreakdown(postData: any): Observable<any> {
    const endPointUrl = `${this.getcurriculumQuadrantBreakdownsUrl()}`;
    return this.httpClient.post<any>(endPointUrl, postData).pipe(
      map(data => {
        return data;
      })
    );
  }
  getCurriculumQuadrantBreakdownByCurriculumId(
    id: string
  ): Observable<CurriculumBreakdown[]> {
    const endpointUrl = `${this.getcurriculumQuadrantBreakdownsUrl()}/breakdown/${id}`;
    return this.httpClient
      .get(endpointUrl)
      .pipe(map(result => result as CurriculumBreakdown[]));
  }
  getCurriculumQuadrantBreakdownList(): Observable<any> {
    const endpointUrl = `${this.getcurriculumQuadrantBreakdownsUrl()}`;
    return this.httpClient
      .get(endpointUrl)
      .pipe(map(result => result as any[]));
  }
  update(id: number, postData: any): Observable<any> {
    const endPointUrl = `${this.getcurriculumQuadrantBreakdownsUrl()}/${id}`;
    return this.httpClient.patch<any>(endPointUrl, postData).pipe(
      map(data => {
        return data;
      })
    );
  }
  delete(id: number): Observable<any> {
    const endPointUrl = `${this.getcurriculumQuadrantBreakdownsUrl()}/${id}`;
    return this.httpClient.delete<any>(endPointUrl).pipe(
      map(data => {
        return data;
      })
    );
  }
  getCourseList(): Observable<any> {
    const endpointUrl = `${this.getCoursesUrl()}`;
    return this.httpClient
      .get(endpointUrl)
      .pipe(map(result => result as any[]));
  }

  getQuadratList(): Observable<any> {
    const endpointUrl = `${this.getQuadrantsUrl()}`;
    return this.httpClient
      .get(endpointUrl)
      .pipe(map(result => result as any[]));
  }
  getCurriculumList(): Observable<any> {
    const endpointUrl = `${this.getCurriculumsUrl()}`;
    return this.httpClient
      .get(endpointUrl)
      .pipe(map(result => result as any[]));
  }
  getListOfUnRegisteredCourseById(id: string,quadrantId: string): Observable<any[]> {
    const endpointUrl = `${this.getcurriculumQuadrantBreakdownsUrl()}/getListOfUnRegisteredCourseById/${id}/${quadrantId}`;
    return this.httpClient
      .get(endpointUrl)
      .pipe(map(result => result as any[]));
  }
  getListOfCurriculumByProgramId(id: string): Observable<any[]> {
    const endpointUrl = `${this.getcurriculumQuadrantBreakdownsUrl()}/getListOfCurriculumByProgramId/${id}`;
    return this.httpClient
      .get(endpointUrl)
      .pipe(map(result => result as any[]));
  }
  getSavedCourses(curId: string, quadrantId: string): Observable<any[]> {
    const endpointUrl = `${this.getcurriculumQuadrantBreakdownsUrl()}/getCurriculumQuadrantCourseBreakdowns/${curId}/${quadrantId}`;
    return this.httpClient
      .get(endpointUrl)
      .pipe(map(result => result as any[]));
  }
  
}
