import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { BulkSectionAssignmentRequest, SectionTransferRequestWrapper, StudentSectionTransferRequest, CourseSectionAssignmentRequest, LabSectionAssignmentRequest } from '../Models/BulkSectionAssignmentRequest';
import { SectionAssignedStudentInfo, SectionAssignedStudentsResponse } from '../Models/SectionAssignedStudentModel';
import { SectionViewModel } from '../Models/SectionViewModel';
import { CourseInfo, StudentRegisteredCoursesResult } from '../Models/StudentRegisteredCoursesModel';
import { ResponseDtos } from '../admission-request/model/response-dtos.model';
import { LabSectionAssignedStudentsResponse } from '../Models/LabSectionAssignedStudentModel';
import { StudentProfileViewModel } from '../students/models/student-profile-view-model.model';
import { UnassignedStudentsResponse } from '../Models/StudentInfo';

@Injectable({
  providedIn: 'root'
})
export class StudentSectionAssignmentService {
  private apiUrl = `${environment.baseUrl}/${environment.apiVersion}/studentsectionassignments`;

  constructor(private http: HttpClient) { }


  getStudentRegisteredCourses(batchCode: string, academicTerm: number, year: number, sectionType: number): Observable<StudentRegisteredCoursesResult> {
    return this.http.get<StudentRegisteredCoursesResult>(`${this.apiUrl}/getStudentRegisteredCourses/${batchCode}/${academicTerm}/${year}/${sectionType}`);
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


  deleteStudentSectionAssignment(academicTerm: number, year: number, batchCode: string, sectionType: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${academicTerm}/${year}/${batchCode}/${sectionType}`);
  }

  assignStudentsToSections(request: CourseSectionAssignmentRequest): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/assign-sections`, request);
  }


  assignStudentsToSectionsBulk(request: BulkSectionAssignmentRequest): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/assign-sections-bulk`, request);
  }
  modifySectionAssignments(postData: SectionTransferRequestWrapper): Observable<boolean> {
    return this.http.post<any>(`${this.apiUrl}/reassign/section`, postData);
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

  getListOfSectionAssignedStudents(batchCode: string, academicTerm: number, year: number, sectionType: number, courseId?: string, sectionId?: number): Observable<SectionAssignedStudentsResponse> {
    let url = `${this.apiUrl}/section-assigned-students/${batchCode}/${academicTerm}/${year}`;
    const params: string[] = [];

    if (courseId) {
      params.push(`courseId=${courseId}`);
    }

    if (sectionType) {
      params.push(`sectionType=${sectionType}`);
    }
    if (sectionId) {
      params.push(`sectionId=${sectionId}`);
    }

    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }

    return this.http.get<SectionAssignedStudentsResponse>(url);
  }


  getListOfSectionBasedOnBatch(batchCode: string, academicTerm: number, year: number, sectionType: number, courseId: string): Observable<SectionViewModel[]> {
    return this.http.get<SectionViewModel[]>(`${this.apiUrl}/sections-by-batch/${batchCode}/${academicTerm}/${year}/${sectionType}/${courseId}`);
  }
  getListOfSectionAssignedStudentsBySectionId(batchCode: string, academicTerm: number, year: number, sectionId: number, sectionType: number): Observable<ResponseDtos> {
    return this.http.get<ResponseDtos>(`${this.apiUrl}/${batchCode}/${academicTerm}/${year}/${sectionId}/${sectionType}`);
  }
  getListOfSectionAssignedStudentsForLab(batchCode: string, academicTerm: number, year: number, sectionId: number): Observable<LabSectionAssignedStudentsResponse> {
    return this.http.get<LabSectionAssignedStudentsResponse>(`${this.apiUrl}/getListOfSectionAssigned/lab/${batchCode}/${academicTerm}/${year}/${sectionId}`);
  }

  assignStudentLabSections(request: LabSectionAssignmentRequest): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/student/lab/section`, request);
  }

  getStudentSectioningByStudentId(userId: string, academicTerm: number, year: number): Observable<StudentProfileViewModel> {
    return this.http.get<any>(`${this.apiUrl}/getStudentSectioningByStudentId/${userId}/${academicTerm}/${year}`);
  }

  getUnassignedStudents(batchCode: string, academicTerm: number, year: number, sectionType: number): Observable<UnassignedStudentsResponse> {
    return this.http.get<UnassignedStudentsResponse>(`${this.apiUrl}/unassigned-students/${batchCode}/${academicTerm}/${year}?sectionType=${sectionType}`);
  }
  getUnassignedCoursesForStudent(studentId: string, academicTerm: number, year: number, batchCode: string, sectionType: number): Observable<CourseInfo[]> {
    return this.http.get<CourseInfo[]>(`${this.apiUrl}/unassigned-course-for-students/${studentId}/${academicTerm}/${year}/${batchCode}/${sectionType}`);
  }
  getListOfSectionAssignedBatch(batchCode: string, academicTerm: number, year: number, sectionType: number): Observable<SectionViewModel> {
    return this.http.get<SectionViewModel>(`${this.apiUrl}/assigned-batch-section/${batchCode}/${academicTerm}/${year}/${sectionType}`);
  }

} 