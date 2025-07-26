import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, map } from "rxjs";
import { environment } from "src/environments/environment";

@Injectable({
  providedIn: "root"
})
export class WorkExperienceService {
  baseUrl = environment.baseUrl;
  private readonly _workExperience: string = "/ApplicantWorkExperiences";
  getWorkExperienceUrl() {
    return this.baseUrl + this._workExperience;
  }

  constructor(private httpClient: HttpClient) {}
  getApplicantExperienceByApplicantId(id: string): Observable<any> {
    const endpointUrl = `${this.getWorkExperienceUrl()}/applicant/${id}`;
    return this.httpClient.get(endpointUrl).pipe(map(result => result as any));
  }
  createExperience(experience: any): Observable<any> {
    const endPointUrl = `${this.getWorkExperienceUrl()}`;
    return this.httpClient.post<any>(endPointUrl, experience).pipe(
      map(data => {
        return data;
      })
    );
  }
  update(id: string, experience: any): Observable<any> {
    const endPointUrl = `${this.getWorkExperienceUrl()}/${id}`;
    return this.httpClient.patch<any>(endPointUrl, experience).pipe(
      map(data => {
        return data;
      })
    );
  }

  delete(id: string): Observable<any> {
    const endPointUrl = `${this.getWorkExperienceUrl()}/${id}`;
    return this.httpClient.delete<any>(endPointUrl).pipe(
      map(data => {
        return data;
      })
    );
  }
}
