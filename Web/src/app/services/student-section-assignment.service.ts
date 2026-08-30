import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  BulkSectionAssignmentRequest,
  SectionTransferRequestWrapper,
  LabSectionAssignmentRequest
} from '../Models/BulkSectionAssignmentRequest';
import { SectionAssignedStudentsResponse } from '../Models/SectionAssignedStudentModel';
import { SectionViewModel } from '../Models/SectionViewModel';
import { CourseInfo, StudentRegisteredCoursesResult } from '../Models/StudentRegisteredCoursesModel';
import { ResponseDtos } from '../admission-request/model/response-dtos.model';
import { LabSectionAssignedStudentsResponse } from '../Models/LabSectionAssignedStudentModel';
import { StudentProfileViewModel } from '../students/models/student-profile-view-model.model';
import { UnassignedStudentsResponse } from '../Models/StudentInfo';
import { CrudService } from 'src/app/services/crud.service';

@Injectable({
  providedIn: 'root'
})
export class StudentSectionAssignmentService {
  private readonly assignments = `/${environment.apiVersion}/studentsectionassignments`;

  constructor(private crud: CrudService) { }

  getStudentRegisteredCourses(
    batchCode: string,
    academicTerm: number,
    year: number,
    sectionType: number
  ): Observable<StudentRegisteredCoursesResult> {
    return this.crud.getList<StudentRegisteredCoursesResult>(
      `${this.assignments}/getStudentRegisteredCourses/${batchCode}/${academicTerm}/${year}/${sectionType}`
    );
  }

  getStudentSectionAssignments(): Observable<any> {
    return this.crud.getList(this.assignments);
  }

  getStudentSectionAssignmentById(id: number): Observable<any> {
    return this.crud.getById(this.assignments, id);
  }

  addStudentSectionAssignment(assignment: any): Observable<any> {
    return this.crud.add(this.assignments, assignment);
  }

  updateStudentSectionAssignment(id: number, assignment: any): Observable<any> {
    return this.crud.update(this.assignments, id, assignment);
  }

  deleteStudentSectionAssignment(
    academicTerm: number,
    year: number,
    batchCode: string,
    sectionType: number
  ): Observable<any> {
    return this.crud.delete(`${this.assignments}/${academicTerm}/${year}/${batchCode}`, sectionType);
  }

  assignStudentsToSections(request: BulkSectionAssignmentRequest): Observable<any> {
    return this.crud.add(`${this.assignments}/assign-sections`, request);
  }

  assignStudentsToSectionsBulk(request: BulkSectionAssignmentRequest): Observable<any> {
    return this.crud.add(`${this.assignments}/assign-sections-bulk`, request);
  }

  modifySectionAssignments(postData: SectionTransferRequestWrapper): Observable<boolean> {
    return this.crud.add<boolean>(`${this.assignments}/reassign/section`, postData);
  }

  getAvailableSections(): Observable<any> {
    return this.crud.getList(`${this.assignments}/available-sections`);
  }

  getSectionAssignmentsForCourse(
    batchCode: string,
    academicTerm: number,
    year: number,
    courseId: string
  ): Observable<any> {
    return this.crud.getList(
      `${this.assignments}/course-assignments/${batchCode}/${academicTerm}/${year}/${courseId}`
    );
  }

  getSectionRecommendation(
    batchCode: string,
    academicTerm: number,
    year: number,
    courseId: string,
    maxStudentsPerSection: number,
    isDefaultSectionCourse: boolean = false
  ): Observable<any> {
    return this.crud.getList(
      `${this.assignments}/section-recommendation/${batchCode}/${academicTerm}/${year}/${courseId}/${maxStudentsPerSection}`,
      isDefaultSectionCourse ? { isDefaultSectionCourse } : undefined
    );
  }

  getBulkSectionRecommendations(
    batchCode: string,
    academicTerm: number,
    year: number,
    maxStudentsPerSection: number
  ): Observable<any> {
    return this.crud.getList(
      `${this.assignments}/bulk-section-recommendations/${batchCode}/${academicTerm}/${year}/${maxStudentsPerSection}`
    );
  }

  getListOfSectionAssignedStudents(
    batchCode: string,
    academicTerm: number,
    year: number,
    sectionType: number,
    courseId?: string,
    sectionId?: number
  ): Observable<SectionAssignedStudentsResponse> {
    return this.crud.getList<SectionAssignedStudentsResponse>(
      `${this.assignments}/section-assigned-students/${batchCode}/${academicTerm}/${year}`,
      {
        courseId,
        sectionType,
        sectionId
      }
    );
  }

  getListOfSectionAssignedStudentsPaginated(
    batchCode: string,
    academicTerm: number,
    year: number,
    query: string
  ): Observable<any> {
    return this.crud.getPaginated(
      `${this.assignments}/section-assigned-students/${batchCode}/${academicTerm}/${year}`,
      query
    );
  }

  getListOfSectionBasedOnBatch(
    batchCode: string,
    academicTerm: number,
    year: number,
    sectionType: number,
    courseId: string
  ): Observable<SectionViewModel[]> {
    return this.crud.getList<SectionViewModel[]>(
      `${this.assignments}/sections-by-batch/${batchCode}/${academicTerm}/${year}/${sectionType}/${courseId}`
    );
  }

  getListOfSectionAssignedStudentsBySectionId(
    batchCode: string,
    academicTerm: number,
    year: number,
    sectionId: number,
    sectionType: number
  ): Observable<ResponseDtos> {
    return this.crud.getList<ResponseDtos>(
      `${this.assignments}/${batchCode}/${academicTerm}/${year}/${sectionId}/${sectionType}`
    );
  }

  getListOfSectionAssignedStudentsForLab(
    batchCode: string,
    academicTerm: number,
    year: number,
    sectionId: number
  ): Observable<LabSectionAssignedStudentsResponse> {
    return this.crud.getList<LabSectionAssignedStudentsResponse>(
      `${this.assignments}/getListOfSectionAssigned/lab/${batchCode}/${academicTerm}/${year}/${sectionId}`
    );
  }

  getListOfSectionAssignedStudentsForLabPaginated(
    batchCode: string,
    academicTerm: number,
    year: number,
    sectionId: number,
    query: string
  ): Observable<any> {
    return this.crud.getPaginated(
      `${this.assignments}/getListOfSectionAssigned/lab/${batchCode}/${academicTerm}/${year}/${sectionId}`,
      query
    );
  }

  assignStudentLabSections(request: LabSectionAssignmentRequest): Observable<any> {
    return this.crud.add(`${this.assignments}/student/lab/section`, request);
  }

  getStudentSectioningByStudentId(
    userId: string,
    academicTerm: number,
    year: number
  ): Observable<StudentProfileViewModel> {
    return this.crud.getList<StudentProfileViewModel>(
      `${this.assignments}/getStudentSectioningByStudentId/${userId}/${academicTerm}/${year}`
    );
  }

  getUnassignedStudents(
    batchCode: string,
    academicTerm: number,
    year: number,
    sectionType: number
  ): Observable<UnassignedStudentsResponse> {
    return this.crud.getList<UnassignedStudentsResponse>(
      `${this.assignments}/unassigned-students/${batchCode}/${academicTerm}/${year}`,
      { sectionType }
    );
  }

  getUnassignedStudentsPaginated(
    batchCode: string,
    academicTerm: number,
    year: number,
    query: string
  ): Observable<any> {
    return this.crud.getPaginated(
      `${this.assignments}/unassigned-students/${batchCode}/${academicTerm}/${year}`,
      query
    );
  }

  getUnassignedCoursesForStudent(
    studentId: string,
    academicTerm: number,
    year: number,
    batchCode: string,
    sectionType: number
  ): Observable<CourseInfo[]> {
    return this.crud.getList<CourseInfo[]>(
      `${this.assignments}/unassigned-course-for-students/${studentId}/${academicTerm}/${year}/${batchCode}/${sectionType}`
    );
  }

  getListOfSectionAssignedBatch(
    batchCode: string,
    academicTerm: number,
    year: number,
    sectionType: number
  ): Observable<SectionViewModel> {
    return this.crud.getList<SectionViewModel>(
      `${this.assignments}/assigned-batch-section/${batchCode}/${academicTerm}/${year}/${sectionType}`
    );
  }
}
