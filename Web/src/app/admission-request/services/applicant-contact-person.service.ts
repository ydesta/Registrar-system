import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, map } from "rxjs";
import { environment } from "src/environments/environment";

@Injectable({
  providedIn: "root"
})
export class ApplicantContactPersonService {
  baseUrl = environment.baseUrl;
  private readonly _applicantContactPersonUrl: string = `/${environment.apiVersion}/applicantcontactpersons`;
  getApplicantContactPersonUrl() {
    return this.baseUrl + this._applicantContactPersonUrl;
  }

  constructor(private httpClient: HttpClient) {}
  getApplicantContactPersonId(id: string): Observable<any> {
    const endpointUrl = `${this.getApplicantContactPersonUrl()}/applicant/${id}`;
    return this.httpClient.get(endpointUrl).pipe(map(result => result as any));
  }
  create(educationBackground: any): Observable<any> {
    const endPointUrl = `${this.getApplicantContactPersonUrl()}`;
    return this.httpClient.post<any>(endPointUrl, educationBackground).pipe(
      map(data => {
        return data;
      })
    );
  }
  updateContact(id: string, applicantContact: any): Observable<any> {
    const endPointUrl = `${this.getApplicantContactPersonUrl()}/${id}`;
    return this.httpClient.patch<any>(endPointUrl, applicantContact).pipe(
      map(data => {
        return data;
      })
    );
  }
  delete(id: string): Observable<any> {
    const endPointUrl = `${this.getApplicantContactPersonUrl()}/${id}`;
    return this.httpClient.delete<any>(endPointUrl).pipe(
      map(data => {
        return data;
      })
    );
  }
}
