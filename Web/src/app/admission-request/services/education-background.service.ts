import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, map } from "rxjs";
import { environment } from "src/environments/environment";

@Injectable({
  providedIn: "root"
})
export class EducationBackgroundService {
  baseUrl = environment.baseUrl;
  private readonly _educationBackgroundUrl: string = "/ApplicantEducationBackgrounds";
  getEducationBackgroundUrl() {
    return this.baseUrl + this._educationBackgroundUrl;
  }

  constructor(private httpClient: HttpClient) {}
  getApplicantEducationByApplicantId(id: string): Observable<any> {
    const endpointUrl = `${this.getEducationBackgroundUrl()}/applicantId/${id}`;
    return this.httpClient.get(endpointUrl).pipe(map(result => result as any));
  }
  createEducation(educationBackground: any): Observable<any> {
    const endPointUrl = `${this.getEducationBackgroundUrl()}`;
    return this.httpClient.post<any>(endPointUrl, educationBackground).pipe(
      map(data => {
        return data;
      })
    );
  }

  update(id: string, educationBackground: any): Observable<any> {
    const endPointUrl = `${this.getEducationBackgroundUrl()}/${id}`;
    return this.httpClient.patch<any>(endPointUrl, educationBackground).pipe(
      map(data => {
        return data;
      })
    );
  }
  delete(id: string): Observable<any> {
    const endPointUrl = `${this.getEducationBackgroundUrl()}/${id}`;
    return this.httpClient.delete<any>(endPointUrl).pipe(
      map(data => {
        return data;
      })
    );
  }
}
