import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, map } from "rxjs";
import { BatchModel } from "src/app/Models/BatchModel";
import { environment } from "src/environments/environment";

@Injectable({
  providedIn: "root"
})
export class BatchService {
  baseUrl = environment.baseUrl;
  private readonly _batchs: string = `/${environment.apiVersion}/batch`;
  getBatchsUrl() {
    return this.baseUrl + this._batchs;
  }
  constructor(private httpClient: HttpClient) {}
  create(postData: BatchModel): Observable<any> {
    const endPointUrl = `${this.getBatchsUrl()}`;
    return this.httpClient.post<any>(endPointUrl, postData).pipe(
      map(data => {
        return data;
      })
    );
  }
  update(id: string, postData: BatchModel): Observable<any> {
    const endPointUrl = `${this.getBatchsUrl()}/${id}`;
    return this.httpClient.patch<any>(endPointUrl, postData).pipe(
      map(data => {
        return data;
      })
    );
  }

  delete(id: string): Observable<any> {
    const endPointUrl = `${this.getBatchsUrl()}/${id}`;
    return this.httpClient.delete<any>(endPointUrl).pipe(
      map(data => {
        return data;
      })
    );
  }
  getBatchList(): Observable<any> {
    const endpointUrl = `${this.getBatchsUrl()}`;
    return this.httpClient
      .get(endpointUrl)
      .pipe(map(result => result as any[]));
  }
  getBatchById(id: string): Observable<any> {
    const endpointUrl = `${this.getBatchsUrl()}/${id}`;
    return this.httpClient.get(endpointUrl).pipe(map(result => result as any));
  }
}
