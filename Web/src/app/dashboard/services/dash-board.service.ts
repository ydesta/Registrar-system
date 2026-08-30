import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { KpiCard } from '../models/KpiCard';
import { GPATrend } from '../models/GPATrend';
import { CourseCompletion } from '../models/CourseCompletion';
import { TopCourse } from '../models/TopCourse';
import { StudentSummary } from '../models/StudentSummary';
import { CrudService } from 'src/app/services/crud.service';

@Injectable({
  providedIn: 'root'
})
export class DashBoardService {
  private readonly dashboard = `/${environment.apiVersion}/dash`;

  constructor(private crud: CrudService) { }

  getListOfKpiCards(applicantUserId: string): Observable<KpiCard[]> {
    return this.crud.getList<KpiCard[]>(`${this.dashboard}/${applicantUserId}`);
  }

  getListOfGPATrend(applicantUserId: string): Observable<GPATrend[]> {
    return this.crud.getList<GPATrend[]>(`${this.dashboard}/${applicantUserId}/getListOfGPATrend`);
  }

  getCourseCompletion(applicantUserId: string): Observable<CourseCompletion[]> {
    return this.crud.getList<CourseCompletion[]>(`${this.dashboard}/${applicantUserId}/getCourseCompletion`);
  }

  getTopCourses(applicantUserId: string): Observable<TopCourse[]> {
    return this.crud.getList<TopCourse[]>(`${this.dashboard}/${applicantUserId}/getTopCourses`);
  }

  getStudentSummary(applicantUserId: string): Observable<StudentSummary> {
    return this.crud.getList<StudentSummary>(`${this.dashboard}/${applicantUserId}/getStudentSummary`);
  }
}
