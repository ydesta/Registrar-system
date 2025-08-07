import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { BulkSectionAssignmentRequest } from '../Models/BulkSectionAssignmentRequest';
import { SectionAssignedStudentsResponse } from '../Models/SectionAssignedStudentModel';
import { SectionViewModel } from '../Models/SectionViewModel';
import { StudentRegisteredCoursesResult } from '../Models/StudentRegisteredCoursesModel';

@Injectable({
  providedIn: 'root'
})
export class StudentSectionAssignmentService {
  private apiUrl = `${environment.baseUrl}/StudentSectionAssignments`;

  constructor(private http: HttpClient) {}


  getStudentRegisteredCourses(batchCode: string, academicTerm: number, year: number): Observable<StudentRegisteredCoursesResult> {
    return this.http.get<StudentRegisteredCoursesResult>(`${this.apiUrl}/getStudentRegisteredCourses/${batchCode}/${academicTerm}/${year}`);
  }

  getStudentSectionAssignments(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }

  
  getStudentSectionAssignmentById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

 
  addStudentSectionAssignment(assignment: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, assignment);
  }

  updateStudentSectionAssignment(id: number, assignment: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}`, assignment);
  }

 
  deleteStudentSectionAssignment(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  assignStudentsToSections(request: BulkSectionAssignmentRequest): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/assign-sections`, request);
  }

 
  assignStudentsToSectionsBulk(request: BulkSectionAssignmentRequest): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/assign-sections-bulk`, request);
  }

  getAvailableSections(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/available-sections`);
  }

 
  getSectionAssignmentsForCourse(batchCode: string, academicTerm: number, year: number, courseId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/course-assignments/${batchCode}/${academicTerm}/${year}/${courseId}`);
  }

  
  getSectionRecommendation(batchCode: string, academicTerm: number, year: number, courseId: string, maxStudentsPerSection: number, isDefaultSectionCourse: boolean = false): Observable<any> {
    const params = isDefaultSectionCourse ? `?isDefaultSectionCourse=${isDefaultSectionCourse}` : '';
    return this.http.get<any>(`${this.apiUrl}/section-recommendation/${batchCode}/${academicTerm}/${year}/${courseId}/${maxStudentsPerSection}${params}`);
  }

  
  getBulkSectionRecommendations(batchCode: string, academicTerm: number, year: number, maxStudentsPerSection: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/bulk-section-recommendations/${batchCode}/${academicTerm}/${year}/${maxStudentsPerSection}`);
  }

  getListOfSectionAssignedStudents(batchCode: string, academicTerm: number, year: number, courseId?: string, sectionId?: number): Observable<SectionAssignedStudentsResponse> {
    let url = `${this.apiUrl}/section-assigned-students/${batchCode}/${academicTerm}/${year}`;
    const params: string[] = [];
    
    if (courseId) {
      params.push(`courseId=${courseId}`);
    }
    
    if (sectionId) {
      params.push(`sectionId=${sectionId}`);
    }
    
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }
    
    return this.http.get<SectionAssignedStudentsResponse>(url);
  }

  
  getListOfSectionBasedOnBatch(batchCode: string, academicTerm: number, year: number): Observable<SectionViewModel[]> {
    return this.http.get<SectionViewModel[]>(`${this.apiUrl}/sections-by-batch/${batchCode}/${academicTerm}/${year}`);
  }
} 