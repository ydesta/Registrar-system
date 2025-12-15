import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, map } from "rxjs";
import { environment } from "src/environments/environment";

@Injectable({
  providedIn: "root"
})
export class CurriculumService {
  baseUrl = environment.baseUrl;
  private readonly _curriculums: string = `/${environment.apiVersion}/curriculum`;
  getCurriculumsUrl() {
    return this.baseUrl + this._curriculums;
  }
  constructor(private httpClient: HttpClient) {}

  create(postData: any): Observable<any> {
    const endPointUrl = `${this.getCurriculumsUrl()}`;
    return this.httpClient.post<any>(endPointUrl, postData).pipe(
      map(data => {
        return data;
      })
    );
  }
  update(id: string, postData: any): Observable<any> {
    const endPointUrl = `${this.getCurriculumsUrl()}/${id}`;
    return this.httpClient.patch<any>(endPointUrl, postData).pipe(
      map(data => {
        return data;
      })
    );
  }

  delete(id: string): Observable<any> {
    const endPointUrl = `${this.getCurriculumsUrl()}/${id}`;
    return this.httpClient.delete<any>(endPointUrl).pipe(
      map(data => {
        return data;
      })
    );
  }
  getCurriculumList(): Observable<any> {
    const endpointUrl = `${this.getCurriculumsUrl()}`;
    return this.httpClient
      .get(endpointUrl)
      .pipe(map(result => result as any[]));
  }

  getCurriculumStatusTrackingByCurriculumId(
    curriculumId: string
  ): Observable<any> {
    const endpointUrl = `${this.getCurriculumsUrl()}/getCurriculumStatusTracking/${curriculumId}`;
    return this.httpClient
      .get(endpointUrl)
      .pipe(map(result => result as any[]));
  }
  getCurriculumById(id:string): Observable<any> {
    const endpointUrl = `${this.getCurriculumsUrl()}/${id}`;
    return this.httpClient
      .get(endpointUrl)
      .pipe(map(result => result as any[]));
  }
}
