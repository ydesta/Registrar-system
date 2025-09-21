import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, map, catchError, of } from "rxjs";
import { environment } from "src/environments/environment";
import { AcadamicProgramme } from "../model/acadamic-programme.model";
import { ApplicantFeeViewModel } from "../model/applicant-fee-view-model.model";

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
    return this.httpClient.post<any>(endPointUrl, experience, {
      observe: 'response'
    }).pipe(
      map(response => {
        console.log('Create response:', response);
        // Handle different response structures
        if (response.body) {
          return response.body;
        } else if (response.status === 200) {
          return "success";
        }
        return response;
      }),
      catchError(error => {
        console.error('Create error:', error);
        // If it's a 200 status but treated as error, treat it as success
        if (error.status === 200) {
          return of("success");
        }
        throw error;
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
    const endPointUrl = `${this.getacadamicPrgramUrl()}/${id}`;
    return this.httpClient.patch<any>(endPointUrl, educationBackground, {
      observe: 'response'
    }).pipe(
      map(response => {
        console.log('Update response:', response);
        // Handle different response structures
        if (response.body) {
          return response.body;
        } else if (response.status === 200) {
          return "success";
        }
        return response;
      }),
      catchError(error => {
        console.error('Update error:', error);
        // If it's a 200 status but treated as error, treat it as success
        if (error.status === 200) {
          return of("success");
        }
        throw error;
      })
    );
  }
  delete(id: number): Observable<any> {
    const endPointUrl = `${this.getacadamicPrgramUrl()}/${id}`;
    return this.httpClient.delete<any>(endPointUrl, {
      observe: 'response'
    }).pipe(
      map(response => {
        console.log('Delete response:', response);
        // Handle different response structures
        if (response.body) {
          return response.body;
        } else if (response.status === 200) {
          return "success";
        }
        return response;
      }),
      catchError(error => {
        console.error('Delete error:', error);
        // If it's a 200 status but treated as error, treat it as success
        if (error.status === 200) {
          return of("success");
        }
        throw error;
      })
    );
  }
  getApplicationFee(id: string): Observable<ApplicantFeeViewModel> {
    const endpointUrl = `${this.getacadamicPrgramUrl()}/getApplicationFee/applicant/${id}`;
    return this.httpClient.get<ApplicantFeeViewModel>(endpointUrl).pipe(
      map(result => result as ApplicantFeeViewModel)
    );
  }
}
