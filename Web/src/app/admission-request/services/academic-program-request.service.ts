import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, map } from "rxjs";
import { environment } from "src/environments/environment";
import { AcadamicProgramme } from "../model/acadamic-programme.model";

@Injectable({
  providedIn: "root"
})
export class AcademicProgramRequestService {
  baseUrl = environment.baseUrl;
  private readonly acadamicPrgram: string = "/AcademicProgramRequest";
  private readonly acadamicPrgramList: string = "/AcadamicProgramme";
  getacadamicPrgramUrl() {
    return this.baseUrl + this.acadamicPrgram;
  }
  getAcadamicPrgramListUrl() {
    return this.baseUrl + this.acadamicPrgramList;
  }
  constructor(private httpClient: HttpClient) {}
  getApplicantacadamicPrgramtId(id: string): Observable<any> {
    const endpointUrl = `${this.getacadamicPrgramUrl()}/applicant/${id}`;
    return this.httpClient.get(endpointUrl).pipe(map(result => result as any));
  }
  create(experience: any): Observable<any> {
    const endPointUrl = `${this.getacadamicPrgramUrl()}`;
    return this.httpClient.post<any>(endPointUrl, experience).pipe(
      map(data => {
        return data;
      })
    );
  }
  getAacadamicPrgramtList(): Observable<any> {
    const endpointUrl = `${this.getAcadamicPrgramListUrl()}`;
    return this.httpClient
      .get(endpointUrl)
      .pipe(map(result => result as any[]));
  }
  update(id: number, educationBackground: any): Observable<any> {
    const endPointUrl = `${this.getAcadamicPrgramListUrl()}/${id}`;
    return this.httpClient.patch<any>(endPointUrl, educationBackground).pipe(
      map(data => {
        return data;
      })
    );
  }
  delete(id: number): Observable<any> {
    const endPointUrl = `${this.getAcadamicPrgramListUrl()}/${id}`;
    return this.httpClient.delete<any>(endPointUrl).pipe(
      map(data => {
        return data;
      })
    );
  }
}
