import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CoursePrerequisiteService {
  private apiUrl = `${environment.baseUrl}/CoursePrerequisites`;

  constructor(private http: HttpClient) {}

  getAllCoursePrerequisites(): Observable<any> {
    return this.http.get<any[]>(this.apiUrl);
  }

  getCoursePrerequisiteById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  createCoursePrerequisite(prerequisite: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, prerequisite);
  }

  updateCoursePrerequisite(id: string, prerequisite: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}`, prerequisite);
  }

  deleteCoursePrerequisite(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
} 