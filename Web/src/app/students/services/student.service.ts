import { Injectable } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { StudentViewModel } from '../models/student-view-model.model';
import { RegisteredNewStudentViewModel, StudentAddedViewModel, StudentCoursesTaken, StudentProfileViewModel, StudentRegistrationSlipViewModel } from '../models/student-profile-view-model.model';
import { PendingStudentPaymentModel } from '../../banks/models/pending-sudent-payment.model';
import { StudentCourseRegistrationView } from '../models/student-course-registration-view.model';
import { CourseBreakDownOffering, CourseViewModel } from '../models/course-break-down-offering.model';
import { CourseTaken } from '../course-registration/course-add/add-course-approval/add-course-approval.component';
import { StudentTranscriptViewModel } from 'src/app/reports/model/student-transcript-view-model.model';
import { SpecialCaseManualRegistrationRequest } from '../models/special-case-manual-registration-request .model';
import { StudentInformationView } from '../models/student-information-view .model';
import { CrudService } from 'src/app/services/crud.service';

@Injectable({
  providedIn: 'root',
})
export class StudentService {
  private readonly students = `/${environment.apiVersion}/std`;
  private readonly offerings = `/${environment.apiVersion}/studentcourseofferings`;
  private readonly workflows = `/${environment.apiVersion}/registrarworkflows`;
  private readonly grades = `/${environment.apiVersion}/grade`;

  constructor(private crud: CrudService) { }

  getStudentCourseOfferingId(
    applicantUserId: string,
    term: number,
    id: number
  ): Observable<StudentViewModel> {
    return this.crud.getList<StudentViewModel>(
      `${this.offerings}/getTermCourseOffering/${applicantUserId}/${term}/${id}`
    );
  }

  getTermStudentCourseRegistration(applicantUserId: string, term: number): Observable<StudentViewModel> {
    return this.crud.getList<StudentViewModel>(`${this.offerings}/${applicantUserId}/${term}`);
  }

  create(postData: any): Observable<any> {
    return this.crud.add(this.offerings, postData);
  }

  updateStudentCourseRegistration(id: string, postData: any): Observable<any> {
    return this.crud.update(this.offerings, id, postData).pipe(
      catchError((error) => throwError(() => new Error(error.message || 'Error updating student course registration')))
    );
  }

  getStudentCourseTakenList(applicatUserId: string): Observable<StudentCourseRegistrationView[]> {
    return this.crud.getList<StudentCourseRegistrationView[]>(
      `${this.offerings}/getStudentCourseTaken/${applicatUserId}`
    );
  }

  getStudentCourseRegistrationList(): Observable<StudentViewModel[]> {
    return this.crud.getList<StudentViewModel[]>(`${this.offerings}/getStudentCourseRegistrationList`);
  }

  getStudentCourseRegistrationListPaginated(query: string): Observable<any> {
    return this.crud.getPaginated(`${this.offerings}/getStudentCourseRegistrationList`, query);
  }

  addWorkFlow(postData: any): Observable<any> {
    return this.crud.add(this.workflows, postData);
  }

  updateStudentCourseTaken(id: number, status: number): Observable<any> {
    return this.crud.getList(`${this.offerings}/updateStudentCourseTaken/${id}/${status}`);
  }

  updateStudentCourseOffering(id: string): Observable<any> {
    return this.crud.getList(`${this.offerings}/updateStudentCourseOffering/${id}`);
  }

  getUnAssignedBatchStudents(acadamicProgrammeCode: string, entryTerm: string): Observable<StudentViewModel[]> {
    return this.crud.getList<StudentViewModel[]>(
      `${this.students}/getUnAssignedBatchStudents/${acadamicProgrammeCode}/${entryTerm}`
    );
  }

  getUnAssignedBatchStudentsPaginated(
    acadamicProgrammeCode: string,
    entryTerm: string,
    query: string
  ): Observable<any> {
    return this.crud.getPaginated(
      `${this.students}/getUnAssignedBatchStudents/${acadamicProgrammeCode}/${entryTerm}`,
      query
    );
  }

  batchAssign(postData: any): Observable<any> {
    return this.crud.add(`${this.students}/batch-assign`, postData);
  }

  uploadGrade(postData: any, gradeActionToken?: string): Observable<any> {
    const headers = gradeActionToken ? { 'X-Grade-Action-Token': gradeActionToken } : undefined;
    return this.crud.add(`${this.grades}/upload/excel`, postData, undefined, headers);
  }

  recordSingleGrade(postData: any, gradeActionToken?: string): Observable<any> {
    const headers = gradeActionToken ? { 'X-Grade-Action-Token': gradeActionToken } : undefined;
    return this.crud.add(`${this.grades}/single`, postData, undefined, headers);
  }

  getStudentProfileByStudentId(applicantUserId: string): Observable<StudentProfileViewModel> {
    return this.crud.getList<StudentProfileViewModel>(`${this.students}/student/profile/${applicantUserId}`);
  }

  getListStudentProfileByStudentId(studentId: string): Observable<StudentProfileViewModel> {
    if (!studentId || studentId === 'null' || studentId.trim() === '') {
      throw new Error('StudentService: Invalid studentId provided. studentId cannot be null, undefined, or empty.');
    }
    return this.crud.getList<StudentProfileViewModel>(
      `${this.students}/getListStudentProfile/student/profile/${studentId}`
    );
  }

  getStudentProfileByApplicationId(applicationId: string): Observable<StudentProfileViewModel> {
    return this.crud.getList<StudentProfileViewModel>(
      `${this.students}/getStudentProfileByApplicationId/app/student/profile/${applicationId}`
    );
  }

  updateProfilePhoto(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('photo', file);
    // Not under student/profile/{id} — that GET template would catch "photo" and return 405 on POST
    return this.crud.add(`${this.students}/student/profile-photo`, formData);
  }

  getAllStudentList(): Observable<any> {
    return this.crud.getList(this.students);
  }

  searchStudents(query: string): Observable<any> {
    return this.crud.getList(`${this.students}/getSearchStudent/student`, { queryParms: query });
  }

  getStudentRegisteredCourse(id: string, batchCode: string, type: number): Observable<StudentViewModel> {
    return this.crud.getList<StudentViewModel>(
      `${this.offerings}/getStudentRegisteredCourse/semester/${id}/${batchCode}/${type}`
    );
  }

  getStudentCoursePendingPayment(id: string): Observable<PendingStudentPaymentModel[]> {
    return this.crud.getList<PendingStudentPaymentModel[]>(`${this.offerings}/${id}/getStudentCoursePendingPayment`);
  }

  getStudentCourseAddPendingPayment(id: string): Observable<PendingStudentPaymentModel[]> {
    return this.crud.getList<PendingStudentPaymentModel[]>(
      `${this.offerings}/${id}/addRequest/getStudentCourseAddPendingPayment`
    );
  }

  getListOfAddableTermCourseOffering(
    applicantUserId: string,
    term: number,
    id: number
  ): Observable<CourseBreakDownOffering[]> {
    return this.crud.getList<CourseBreakDownOffering[]>(
      `${this.offerings}/addable/${applicantUserId}/${term}/${id}/getListOfAddableTermCourseOffering`
    );
  }

  getListOfRetakeTermCourseOffering(
    applicantUserId: string,
    term: number,
    id: number
  ): Observable<CourseBreakDownOffering[]> {
    return this.crud.getList<CourseBreakDownOffering[]>(
      `${this.offerings}/getListOfRetakeTermCourseOffering/${applicantUserId}/getListOfRetake/${term}/${id}`
    );
  }

  getListOfAddedCourse(): Observable<CourseViewModel[]> {
    return this.crud.getList<CourseViewModel[]>(`${this.offerings}/course/getListOfAddedCourse`);
  }

  getListOfStudentCourseAdded(
    courseId: string,
    approvalStatus?: number | string | null
  ): Observable<StudentAddedViewModel[]> {
    return this.crud.getList<StudentAddedViewModel[]>(
      `${this.offerings}/course/student/getListOfStudentCourseAdded/${courseId}`,
      { approvalStatus }
    );
  }

  getListOfStudentCourseAddedPaginated(courseId: string, query: string): Observable<any> {
    return this.crud.getPaginated(
      `${this.offerings}/course/student/getListOfStudentCourseAdded/${courseId}`,
      query
    );
  }

  submitCourseTakenApproval(courseTakens: CourseTaken[]): Observable<any> {
    return this.crud.put(this.offerings, courseTakens);
  }

  getListOfAllAddDropCourse(applicantId: string): Observable<StudentCoursesTaken[]> {
    return this.crud.getList<StudentCoursesTaken[]>(
      `${this.offerings}/student/${applicantId}/getListOfAllAddDropCourse`
    );
  }

  getListOfAddDropCourse(applicantUserId: string, seasonTerm: number): Observable<StudentProfileViewModel> {
    return this.crud.getList<StudentProfileViewModel>(
      `${this.offerings}/student/${applicantUserId}/${seasonTerm}/getListOfAddDropCourse`
    );
  }

  getListOfTermRegisteredCourseList(
    filters: {
      studentId?: string | null;
      academicTerm?: number | null;
      year?: number | null;
      batchCode?: string | null;
      startDate?: string | null;
      endDate?: string | null;
    }
  ): Observable<StudentRegistrationSlipViewModel[]> {
    return this.crud.getList<StudentRegistrationSlipViewModel[]>(
      `${this.offerings}/student/getListOfTermRegisteredCourseList`,
      {
        studentId: filters.studentId || undefined,
        academicTerm: filters.academicTerm ?? undefined,
        year: filters.year ?? undefined,
        batchCode: filters.batchCode || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined
      }
    );
  }

  getListOfTermRegisteredCourseListPaginated(
    filters: {
      studentId?: string | null;
      academicTerm?: number | null;
      year?: number | null;
      batchCode?: string | null;
      startDate?: string | null;
      endDate?: string | null;
    },
    query: string
  ): Observable<any> {
    return this.crud.getPaginated(
      `${this.offerings}/student/getListOfTermRegisteredCourseList`,
      query,
      {
        studentId: filters.studentId || undefined,
        academicTerm: filters.academicTerm ?? undefined,
        year: filters.year ?? undefined,
        batchCode: filters.batchCode || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined
      }
    );
  }

  getRegisteredNewStudentList(
    academicProgrameCode: string,
    entryYear: number,
    startDate: string,
    endDate: string
  ): Observable<RegisteredNewStudentViewModel[]> {
    return this.crud.getList<RegisteredNewStudentViewModel[]>(
      `${this.students}/student/getRegisteredNewStudentList/new`,
      { academicProgrameCode, entryYear, startDate, endDate }
    );
  }

  getRegisteredNewStudentListPaginated(query: string): Observable<any> {
    return this.crud.getPaginated(`${this.students}/student/getRegisteredNewStudentList/new`, query);
  }

  updateStudentEmail(studentId: string, newEmail: string): Observable<any> {
    return this.crud.put(`${this.students}/UpdateStudentEmail/${studentId}/${newEmail}`).pipe(
      catchError((error) => throwError(() => new Error(error.message || 'Error updating student email')))
    );
  }

  getStudentTranscriptByStudentId(studentId: string): Observable<StudentTranscriptViewModel> {
    return this.crud.getList<StudentTranscriptViewModel>(`${this.students}/transcript/${studentId}`);
  }

  getCalculatedCGPA(studentId: string): Observable<number> {
    return this.crud.getList<number>(`${this.students}/cgpa/${studentId}`);
  }

  getStudentsPaginated(
    studentCode: string = '',
    batchCode: string = '',
    pageIndex: number = 0,
    pageSize: number = 20,
    sortColumn: string = 'studentid',
    sortOrder: string = 'asc'
  ): Observable<any> {
    return this.crud.getPaginated(this.students, undefined, {
      pageIndex,
      pageSize,
      sortColumn,
      sortOrder,
      studentCode,
      batchCode
    });
  }

  deleteStudent(id: string): Observable<any> {
    return this.crud.delete(this.students, id);
  }

  activateStudent(id: string): Observable<any> {
    return this.crud.update(`${this.students}/activate`, id, null);
  }

  getStudentById(id: string): Observable<any> {
    return this.crud.getList(`${this.students}/student/${id}`);
  }

  updateStudent(id: string, data: any): Observable<any> {
    return this.crud.update(this.students, id, data);
  }

  addStudent(data: any): Observable<any> {
    return this.crud.add(this.students, data);
  }

  exportStudentsExcel(): Observable<any> {
    return this.crud.getList(`${this.students}/excel`);
  }

  getCoursesNotOnStudentProfile(studentCode: string): Observable<CourseBreakDownOffering[]> {
    return this.crud.getList<CourseBreakDownOffering[]>(
      `${this.offerings}/studentProfile/getUnRegisterCourse/${studentCode}/getCoursesNotOnStudentProfile`
    );
  }

  getStudentRegisteredCourseList(studentCode: string): Observable<StudentViewModel> {
    return this.crud.getList<StudentViewModel>(
      `${this.offerings}/${studentCode}/getStudentRegisteredCourseList/registeredCourses`
    );
  }

  updateTakenCourses(ids: number[], modifiedBy: string): Observable<any> {
    return this.crud.add(`${this.offerings}/updateTakenCourses`, { ids, modifiedBy });
  }

  addStudentManualCourseOfferingAsync(request: SpecialCaseManualRegistrationRequest): Observable<any> {
    return this.crud.add(`${this.offerings}/manual/semester-registration`, request);
  }

  getStudentInformationWithInstructor(userId: string, studentId: string): Observable<StudentInformationView> {
    return this.crud.getList<StudentInformationView>(
      `${this.grades}/getStudentInformationWithInstructor/${userId}/${studentId}`
    ).pipe(
      catchError((error) => throwError(() => new Error(error.message || 'Error fetching student information with instructor')))
    );
  }

  getListOfCourseRegistrationSlipList(applicationUserId: string): Observable<StudentRegistrationSlipViewModel[]> {
    return this.crud.getList<StudentRegistrationSlipViewModel[]>(
      `${this.offerings}/student/getListOfCourseRegistrationSlipList/${applicationUserId}`
    );
  }

  getAddableCoursesWithEquivalentsAsync(
    applicantUserId: string,
    term: number,
    id: number
  ): Observable<CourseBreakDownOffering[]> {
    return this.crud.getList<CourseBreakDownOffering[]>(
      `${this.offerings}/addable-with-equivalents/${applicantUserId}/${term}/${id}`
    );
  }

  getManualTermCourseOfferingProgramBased(
    studentCode: string,
    seasonTerm: number,
    academicYear: number
  ): Observable<CourseBreakDownOffering[]> {
    return this.crud.getList<CourseBreakDownOffering[]>(
      `${this.offerings}/manual-program-based/${studentCode}/${seasonTerm}/${academicYear}`
    );
  }
}
