import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { BaseModel } from '../Models/BaseMode';
import { CourseExemptionModel } from '../Models/CourseExemptionModel';

@Injectable({
  providedIn: 'root'
})
export class CourseExemptionService {
  // Service for managing course exemptions
  private baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) { }

  // Get all course exemptions
  getCourseExemptions(): Observable<BaseModel<CourseExemptionModel[]>> {
    return this.http.get<BaseModel<CourseExemptionModel[]>>(`${this.baseUrl}/CourseExemptions`);
  }

  // Get course exemption by ID
  getCourseExemptionById(id: number): Observable<BaseModel<CourseExemptionModel>> {
    return this.http.get<BaseModel<CourseExemptionModel>>(`${this.baseUrl}/CourseExemptions/${id}`);
  }

  // Get course exemptions by student ID
  getCourseExemptionsByStudentId(studentId: string): Observable<BaseModel<CourseExemptionModel[]>> {
    return this.http.get<BaseModel<CourseExemptionModel[]>>(`${this.baseUrl}/CourseExemptions/student/${studentId}`);
  }

  // Add new course exemption
  addCourseExemption(courseExemption: CourseExemptionModel): Observable<BaseModel<any>> {
    return this.http.post<BaseModel<any>>(`${this.baseUrl}/CourseExemptions`, courseExemption);
  }

  // Update course exemption
  updateCourseExemption(id: number, courseExemption: CourseExemptionModel): Observable<BaseModel<any>> {
    return this.http.patch<BaseModel<any>>(`${this.baseUrl}/CourseExemptions/${id}`, courseExemption);
  }

  // Delete course exemption
  deleteCourseExemption(id: number): Observable<BaseModel<any>> {
    return this.http.delete<BaseModel<any>>(`${this.baseUrl}/CourseExemptions/${id}`);
  }
}
