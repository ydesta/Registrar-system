import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, map } from "rxjs";
import { environment } from "src/environments/environment";
import { TermCourseOfferingRequest } from "../model/term-course-offering-request.model";

@Injectable({
  providedIn: "root"
})
export class TermCourseOfferingService {
  baseUrl = environment.baseUrl;
  private readonly _entrys: string = "/entrys";
  private readonly _academicTerms: string = "/academicTerms";
  private readonly _staffs: string = "/staffs";
  private readonly _termCourseOfferings: string = "/TermCourseOfferings";
  private readonly _batchs: string = "/batchs";
  pageindex = 1;
  totalRecord = 0;
  pageSize = 10;
  pageSizeOption = [5, 10, 15, 25, 50, 100];
  sortOrder = "";
  searchKey = "";
  sortColumn = "";
  getEntrysUrl() {
    return this.baseUrl + this._entrys;
  }

  getAcademicTermsUrl() {
    return this.baseUrl + this._academicTerms;
  }

  getStaffsUrl() {
    return this.baseUrl + this._staffs;
  }
  getTermCourseOfferingsUrl() {
    return this.baseUrl + this._termCourseOfferings;
  }
  getBatchsUrl() {
    return this.baseUrl + this._batchs;
  }
  constructor(private httpClient: HttpClient) { }

  create(postData: TermCourseOfferingRequest): Observable<any> {
    const endPointUrl = `${this.getTermCourseOfferingsUrl()}`;
    return this.httpClient.post<any>(endPointUrl, postData).pipe(
      map(data => {
        return data;
      })
    );
  }
  update(id: string, postData: TermCourseOfferingRequest): Observable<any> {
    const endPointUrl = `${this.getTermCourseOfferingsUrl()}/${id}`;
    return this.httpClient.patch<any>(endPointUrl, postData).pipe(
      map(data => {
        return data;
      })
    );
  }
  deactivate(id: string): Observable<any> {
    const url = `${this.getTermCourseOfferingsUrl()}/${id}`;
    return this.httpClient.put<any>(url, {}).pipe(map(response => response));
  }
  deactivateCourseOfering(id: number): Observable<any> {
    const url = `${this.getTermCourseOfferingsUrl()}/activate/${id}`;
    return this.httpClient.put<any>(url, {}).pipe(map(response => response));
  }

  activateCourseOffering(id: number): Observable<any> {
    const url = `${this.getTermCourseOfferingsUrl()}/activate/${id}`;
    return this.httpClient.put<any>(url, {}).pipe(map(response => response));
  }


  delete(id: string): Observable<any> {
    const endPointUrl = `${this.getTermCourseOfferingsUrl()}/${id}`;
    return this.httpClient.delete<any>(endPointUrl).pipe(
      map(data => {
        return data;
      })
    );
  }
  getEntryList(): Observable<any> {
    const endpointUrl = `${this.getEntrysUrl()}`;
    return this.httpClient
      .get(endpointUrl)
      .pipe(map(result => result as any[]));
  }

  getAcademicTermList(): Observable<any> {
    const endpointUrl = `${this.getAcademicTermsUrl()}`;
    return this.httpClient
      .get(endpointUrl)
      .pipe(map(result => result as any[]));
  }

  getStaffList(): Observable<any> {
    const endpointUrl = `${this.getStaffsUrl()}`;
    return this.httpClient
      .get(endpointUrl)
      .pipe(map(result => result as any[]));
  }

  getBatchList(): Observable<any> {
    const endpointUrl = `${this.getBatchsUrl()}`;
    return this.httpClient
      .get(endpointUrl)
      .pipe(map(result => result as any[]));
  }
  getCourseBreakDownList(
    curriculumId: string,
    seasonTerm: number,
    termYear: number
  ): Observable<any> {
    const endPointUrl = `${this.getTermCourseOfferingsUrl()}/${curriculumId}/${seasonTerm}/${termYear}`;
    return this.httpClient.get<any>(endPointUrl).pipe(
      map(data => {
        return data;
      })
    );
  }
  getListOfBatchCodeByAcademicTerm(
    academicTerm: number,
    year: number
  ): Observable<any> {
    const endPointUrl = `${this.getTermCourseOfferingsUrl()}/${academicTerm}/${year}/getListOfBatchCodeByAcademicTerm`;
    return this.httpClient.get<any>(endPointUrl).pipe(
      map(data => {
        return data;
      })
    );
  }
  getTermCourseOfferingById(id: string): Observable<any> {
    const endpointUrl = `${this.getTermCourseOfferingsUrl()}/${id}`;
    return this.httpClient.get(endpointUrl).pipe(map(result => result as any));
  }
  getTermCourseOfferingList(): Observable<any> {
    const endpointUrl = `${this.getTermCourseOfferingsUrl()}paginated?searchKey=${this.searchKey}&pageindex=${this.pageindex - 1}&pageSize=${this.pageSize}&sortColumn=${this.sortColumn}&sortOrder=${this.sortOrder}`;
    return this.httpClient.get(endpointUrl).pipe(map(result => result as any));
  }
  getListOfCourseByAcademicTerm(
    termId: number,
    termYear: number
  ): Observable<any> {
    const endPointUrl = `${this.getTermCourseOfferingsUrl()}/${termId}/${termYear}`;
    return this.httpClient.get<any>(endPointUrl).pipe(
      map(data => {
        return data;
      })
    );
  }

    getListOfCourseByAcademicTermAndBatch(
    termId: number,
    termYear: number,
    batchCode: string
  ): Observable<any> {
    const endPointUrl = `${this.getTermCourseOfferingsUrl()}/getListOfCourseByAcademicTermAndBatch/${termId}/${termYear}/${batchCode}`;
    return this.httpClient.get<any>(endPointUrl).pipe(
      map(data => {
        return data;
      })
    );
  }
}
