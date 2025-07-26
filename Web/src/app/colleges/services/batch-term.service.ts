import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from 'src/environments/environment.prod';
import { TermViewModel } from '../model/term-view-model';

@Injectable({
  providedIn: 'root'
})
export class BatchTermService {
  baseUrl = environment.baseUrl;
  private readonly _batchTerms: string = "/BatchTerms";
  getBatchTermsUrl() {
    return this.baseUrl + this._batchTerms;
  }
  constructor(private httpClient: HttpClient) { }
  getNextAcademicTerm(): Observable<any> {
    const endpointUrl = `${this.getBatchTermsUrl()}`;
    return this.httpClient
      .get(endpointUrl)
      .pipe(map(result => result as any[]));
  }
  GetAcademicTermList(): Observable<TermViewModel[]> {
    const endpointUrl = `${this.getBatchTermsUrl()}/academicterm/activity`;
    return this.httpClient
      .get(endpointUrl)
      .pipe(map(result => result as TermViewModel[]));
  }
  getCurrentAcademicTerm(): Observable<any> {
    const endpointUrl = `${this.getBatchTermsUrl()}/current-term`;
    return this.httpClient
      .get(endpointUrl)
      .pipe(map(result => result as any[]));
  }
  getCourseBreakDownList(
    curriculumId: string,
    seasonTerm: number,
    batchId: string,
    isUpdate: boolean
  ): Observable<any> {
    const endPointUrl = `${this.getBatchTermsUrl()}/${curriculumId}/${seasonTerm}/${batchId}/${isUpdate}`;
    return this.httpClient.get<any>(endPointUrl).pipe(
      map(data => {
        return data;
      })
    );
  }
  getAllCourseByBatchId(curriculumId: string,batchId: string,isUpdate: boolean,academicTermId: number): Observable<any> {
    const endPointUrl = `${this.getBatchTermsUrl()}/${curriculumId}/${batchId}/${isUpdate}/${academicTermId}/getAllCourseByBatchId`;
    return this.httpClient.get<any>(endPointUrl).pipe(
      map(data => {
        return data;
      })
    );
  }
}
