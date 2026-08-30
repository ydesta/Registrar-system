import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ActivityModel } from 'src/app/Models/ActivityModel';
import { CrudService } from 'src/app/services/crud.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AcademicTermActivitiesService {
  private readonly activities = `/${environment.apiVersion}/activities`;
  private readonly termActivities = `/${environment.apiVersion}/academictermactivitys`;

  constructor(private crud: CrudService) { }

  createActivity(postData: ActivityModel): Observable<any> {
    return this.crud.add(this.activities, postData);
  }

  updateActivity(id: string, postData: ActivityModel): Observable<any> {
    return this.crud.update(this.activities, id, postData);
  }

  deleteActivity(id: string): Observable<any> {
    return this.crud.delete(this.activities, id);
  }

  getActivityList(): Observable<any> {
    return this.crud.getList(this.activities);
  }

  getActivityListPaginated(query: string): Observable<any> {
    return this.crud.getPaginated(this.activities, query);
  }

  getActivityById(id: string): Observable<any> {
    return this.crud.getById(this.activities, id);
  }

  create(postData: ActivityModel): Observable<any> {
    return this.crud.add(this.termActivities, postData);
  }

  update(id: string, postData: ActivityModel): Observable<any> {
    return this.crud.update(this.termActivities, id, postData);
  }

  delete(id: string): Observable<any> {
    return this.crud.delete(this.termActivities, id);
  }

  getAcademicTermActivityList(): Observable<any> {
    return this.crud.getList(this.termActivities);
  }

  getAcademicTermActivityListPaginated(query: string): Observable<any> {
    return this.crud.getPaginated(this.termActivities, query);
  }

  getAcademicTermActivityById(id: string): Observable<any> {
    return this.crud.getById(this.termActivities, id);
  }
}
