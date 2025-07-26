import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CourseModel } from '../Models/CourseModel';

@Injectable({
  providedIn: 'root'
})
export class CourseService {
  private apiUrl = `${environment.baseUrl}/Courses`;

  constructor(private http: HttpClient) {}

  getAllCourses(): Observable<CourseModel[]> {
    return this.http.get<CourseModel[]>(this.apiUrl);
  }

  getCourseById(id: string): Observable<CourseModel> {
    return this.http.get<CourseModel>(`${this.apiUrl}/${id}`);
  }

  createCourse(course: CourseModel): Observable<CourseModel> {
    return this.http.post<CourseModel>(this.apiUrl, course);
  }

  updateCourse(id: string, course: CourseModel): Observable<CourseModel> {
    return this.http.put<CourseModel>(`${this.apiUrl}/${id}`, course);
  }

  deleteCourse(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
} 