import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ActivityModel } from 'src/app/Models/ActivityModel';
import { environment } from 'src/environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class AcademicTermActivitiesService {
  baseUrl = environment.baseUrl;
  private readonly _academicTermActivities: string = "/AcademicTermActivitys";
  private readonly _activities: string = "/Activities";
  getAcademicTermActivityUrl() {
    return this.baseUrl + this._academicTermActivities;
  }
  getActivityUrl() {
    return this.baseUrl + this._activities;
  }
  constructor(private httpClient: HttpClient) { }
  createActivity(postData: ActivityModel): Observable<any> {
    const endPointUrl = `${this.getActivityUrl()}`;
    return this.httpClient.post<any>(endPointUrl, postData).pipe(
      map(data => {
        return data;
      })
    );
  }
  updateActivity(id: string, postData: ActivityModel): Observable<any> {
    const endPointUrl = `${this.getActivityUrl()}/${id}`;
    return this.httpClient.patch<any>(endPointUrl, postData).pipe(
      map(data => {
        return data;
      })
    );
  }

  deleteActivity(id: string): Observable<any> {
    const endPointUrl = `${this.getActivityUrl()}/${id}`;
    return this.httpClient.delete<any>(endPointUrl).pipe(
      map(data => {
        return data;
      })
    );
  }
  getActivityList(): Observable<any> {
    const endpointUrl = `${this.getActivityUrl()}`;
    return this.httpClient
      .get(endpointUrl)
      .pipe(map(result => result as any[]));
  }
  getActivityById(id: string): Observable<any> {
    const endpointUrl = `${this.getActivityUrl()}/${id}`;
    return this.httpClient.get(endpointUrl).pipe(map(result => result as any));
  }
  create(postData: ActivityModel): Observable<any> {
    const endPointUrl = `${this.getAcademicTermActivityUrl()}`;
    return this.httpClient.post<any>(endPointUrl, postData).pipe(
      map(data => {
        return data;
      })
    );
  }
  update(id: string, postData: ActivityModel): Observable<any> {
    const endPointUrl = `${this.getAcademicTermActivityUrl()}/${id}`;
    return this.httpClient.patch<any>(endPointUrl, postData).pipe(
      map(data => {
        return data;
      })
    );
  }

  delete(id: string): Observable<any> {
    const endPointUrl = `${this.getAcademicTermActivityUrl()}/${id}`;
    return this.httpClient.delete<any>(endPointUrl).pipe(
      map(data => {
        return data;
      })
    );
  }
  getAcademicTermActivityList(): Observable<any> {
    const endpointUrl = `${this.getAcademicTermActivityUrl()}`;
    return this.httpClient
      .get(endpointUrl)
      .pipe(map(result => result as any[]));
  }
  getAcademicTermActivityById(id: string): Observable<any> {
    const endpointUrl = `${this.getAcademicTermActivityUrl()}/${id}`;
    return this.httpClient.get(endpointUrl).pipe(map(result => result as any));
  }
}
