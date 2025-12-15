import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { InstructorSectionModel, InstructorSectionRequest, InstructorSectionAssignmentViewModel } from '../Models/InstructorSectionModel';
import { ResponseDtos } from '../admission-request/model/response-dtos.model';
import { StaffTeachingDataViewModel } from '../Models/StaffTeachingDataViewModel';

@Injectable({
  providedIn: 'root'
})
export class InstructorSectionService {
  private apiUrl = `${environment.baseUrl}/${environment.apiVersion}/instructorsections`;

  constructor(private http: HttpClient) {}

  /**
   * Get all instructor sections
   */
  getInstructorSections(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }

  /**
   * Get instructor sections by criteria (academic term, year, batch ID)
   */
  getInstructorSectionsByCriteria(academicTerm: number, year: number, batchId: string): Observable<ResponseDtos> {
    return this.http.get<ResponseDtos>(`${this.apiUrl}/${academicTerm}/${year}/${batchId}`);
  }

  /**
   * Get instructor section by ID
   */
  getInstructorSectionById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create new instructor section
   */
  createInstructorSection(instructorSection: InstructorSectionRequest): Observable<any> {
    return this.http.post<any>(this.apiUrl, instructorSection);
  }

  /**
   * Update instructor section
   */
  updateInstructorSection(id: number, instructorSection: InstructorSectionRequest): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}`, instructorSection);
  }

  /**
   * Delete instructor section
   */
  deleteInstructorSection(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
  getStaffTeachingDataAsync(staffId: string,academicTerm: number, year: number, sectionType: number): Observable<StaffTeachingDataViewModel> {
    return this.http.get<StaffTeachingDataViewModel>(`${this.apiUrl}/${staffId}/${academicTerm}/${year}/${sectionType}`);
  }
}
