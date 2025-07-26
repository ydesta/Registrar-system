import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { StudentViewModel } from '../models/student-view-model.model';
import { RegisteredNewStudentViewModel, StudentAddedViewModel, StudentCoursesTaken, StudentProfileViewModel, StudentRegistrationSlipViewModel } from '../models/student-profile-view-model.model';
import { PendingStudentPaymentModel } from '../../banks/models/pending-sudent-payment.model';
import { StudentCourseRegistrationView } from '../models/student-course-registration-view.model';
import { CourseBreakDownOffering, CourseViewModel } from '../models/course-break-down-offering.model';
import { CourseTaken } from '../course-registration/course-add/add-course-approval/add-course-approval.component';
import { StudentTranscriptViewModel } from 'src/app/reports/model/student-transcript-view-model.model';

@Injectable({
  providedIn: 'root',
})
export class StudentService {
  private apiUrl = 'assets/student-profile-mock.json';
  baseUrl = environment.baseUrl;
  private readonly studentUrlList: string = '/Students';
  private readonly studentUrl: string = '/StudentCourseOfferings';
  private readonly studentSemesterUrl: string = '/RegistrarWorkFlows';
  private readonly studentGradesUrl: string = '/StudentGrades';
  getStudentUrlList() {
    return this.baseUrl + this.studentUrlList;
  }

  getStudentUrl() {
    return this.baseUrl + this.studentUrl;
  }

  getRegistrarWorkFlowsUrl() {
    return this.baseUrl + this.studentSemesterUrl;
  }
  getStudentGradesUrl() {
    return this.baseUrl + this.studentGradesUrl;
  }
  constructor(private httpClient: HttpClient) { }
  getStudentCourseOfferingId(
    applicantUserId: string,
    term: number,
    id: number
  ): Observable<StudentViewModel> {
    const endpointUrl = `${this.getStudentUrl()}/getTermCourseOffering/${applicantUserId}/${term}/${id}`;
    return this.httpClient
      .get(endpointUrl)
      .pipe(map((result) => result as StudentViewModel));
  }
  getTermStudentCourseRegistration(
    applicantUserId: string,
    term: number
  ): Observable<StudentViewModel> {
    const endpointUrl = `${this.getStudentUrl()}/${applicantUserId}/${term}`;
    return this.httpClient
      .get(endpointUrl)
      .pipe(map((result) => result as StudentViewModel));
  }
  create(postData: any): Observable<any> {
    const endPointUrl = `${this.getStudentUrl()}`;
    return this.httpClient.post<any>(endPointUrl, postData).pipe(
      map((data) => {
        return data;
      })
    );
  }
  updateStudentCourseRegistration(id: string, postData: any): Observable<any> {
    const endpointUrl = `${this.getStudentUrl()}/${id}`;
    return this.httpClient.patch<any>(endpointUrl, postData).pipe(
      catchError((error) => {
        console.error('Error occurred while updating student course registration:', error);
        return throwError(() => new Error(error.message || 'Error updating student course registration'));
      })
    );
  }

  getStudentCourseTakenList(
    applicatUserId: string
  ): Observable<StudentCourseRegistrationView[]> {
    const endpointUrl = `${this.getStudentUrl()}/getStudentCourseTaken/${applicatUserId}`;
    return this.httpClient.get<StudentCourseRegistrationView[]>(endpointUrl);
  }

  getStudentCourseRegistrationList(): Observable<StudentViewModel[]> {
    const endpointUrl = `${this.getStudentUrl()}/getStudentCourseRegistrationList`;
    return this.httpClient.get<StudentViewModel[]>(endpointUrl);
  }
  addWorkFlow(postData: any): Observable<any> {
    const endPointUrl = `${this.getRegistrarWorkFlowsUrl()}`;
    return this.httpClient.post<any>(endPointUrl, postData).pipe(
      map((data) => {
        return data;
      })
    );
  }
  updateStudentCourseTaken(id: number, status: number): Observable<any> {
    const endpointUrl = `${this.getStudentUrl()}/updateStudentCourseTaken/${id}/${status}`;
    return this.httpClient.get<any[]>(endpointUrl);
  }
  updateStudentCourseOffering(id: string): Observable<any> {
    const endpointUrl = `${this.getStudentUrl()}/updateStudentCourseOffering/${id}`;
    return this.httpClient.get<any[]>(endpointUrl);
  }
  getUnAssignedBatchStudents(
    acadamicProgrammeCode: string,
    entryTerm: string
  ): Observable<StudentViewModel[]> {
    const endpointUrl = `${this.getStudentUrlList()}/getUnAssignedBatchStudents/${acadamicProgrammeCode}/${entryTerm}`;
    return this.httpClient.get<StudentViewModel[]>(endpointUrl);
  }
  batchAssign(postData: any): Observable<any> {
    const endPointUrl = `${this.getStudentUrlList()}/batch-assign`;
    return this.httpClient.post<any>(endPointUrl, postData).pipe(
      map((data) => {
        return data;
      })
    );
  }

  uploadGrade(postData: any): Observable<any> {
    const endPointUrl = `${this.getStudentGradesUrl()}/upload/excel`;
    return this.httpClient.post<any>(endPointUrl, postData).pipe(
      map((data) => {
        return data;
      })
    );
  }
  getStudentProfileByStudentId(
    applicantUserId: string
  ): Observable<StudentProfileViewModel> {
    const endpointUrl = `${this.getStudentUrlList()}/student/profile/${applicantUserId}`;
    return this.httpClient.get<StudentProfileViewModel>(endpointUrl);
  }
  getStudentProfileById(): Observable<StudentProfileViewModel> {
    return this.httpClient.get<StudentProfileViewModel>(`${this.apiUrl}`);
  }
  getListStudentProfileByStudentId(
    studentId: string
  ): Observable<StudentProfileViewModel> {
    const endpointUrl = `${this.getStudentUrlList()}/getListStudentProfile/student/profile/${studentId}`;
    return this.httpClient.get<StudentProfileViewModel>(endpointUrl);
  }
  getStudentProfileByApplicationId(
    applicationId: string
  ): Observable<StudentProfileViewModel> {
    const endpointUrl = `${this.getStudentUrlList()}/getStudentProfileByApplicationId/app/student/profile/${applicationId}`;
    return this.httpClient.get<StudentProfileViewModel>(endpointUrl);
  }
  getAllStudentList(): Observable<any> {
    const endpointUrl = `${this.getStudentUrlList()}`;
    return this.httpClient.get<any>(endpointUrl);
  }
  searchStudents(query: string): Observable<any> {
    return this.httpClient.get(`${this.getStudentUrlList()}/getSearchStudent/student`, { params: { query } });
  }
  getStudentRegisteredCourse(
    id: string,
    batchCode: string,
    type: number
  ): Observable<StudentViewModel> {
    const endpointUrl = `${this.getStudentUrl()}/getStudentRegisteredCourse/semester/${id}/${batchCode}/${type}`;
    return this.httpClient
      .get(endpointUrl)
      .pipe(map((result) => result as StudentViewModel));
  }
  getStudentCoursePendingPayment(id: string): Observable<PendingStudentPaymentModel[]> {
    const endpointUrl = `${this.getStudentUrl()}/${id}/getStudentCoursePendingPayment`;
    return this.httpClient
      .get(endpointUrl)
      .pipe(map(result => result as PendingStudentPaymentModel[]));
  }
  getStudentCourseAddPendingPayment(id: string): Observable<PendingStudentPaymentModel[]> {
    const endpointUrl = `${this.getStudentUrl()}/${id}/addRequest/getStudentCourseAddPendingPayment`;
    return this.httpClient
      .get(endpointUrl)
      .pipe(map(result => result as PendingStudentPaymentModel[]));
  }

  getListOfAddableTermCourseOffering(
    applicantUserId: string,
    term: number,
    id: number
  ): Observable<CourseBreakDownOffering[]> {
    const endpointUrl = `${this.getStudentUrl()}/addable/${applicantUserId}/${term}/${id}/getListOfAddableTermCourseOffering`;
    return this.httpClient
      .get(endpointUrl)
      .pipe(map((result) => result as CourseBreakDownOffering[]));
  }
  getListOfRetakeTermCourseOffering(
    applicantUserId: string,
    term: number,
    id: number
  ): Observable<CourseBreakDownOffering[]> {
    const endpointUrl = `${this.getStudentUrl()}/getListOfRetakeTermCourseOffering/${applicantUserId}/getListOfRetake/${term}/${id}`;
    return this.httpClient
      .get(endpointUrl)
      .pipe(map((result) => result as CourseBreakDownOffering[]));
  }
  getListOfAddedCourse(): Observable<CourseViewModel[]> {
    const endpointUrl = `${this.getStudentUrl()}/course/getListOfAddedCourse`;
    return this.httpClient
      .get(endpointUrl)
      .pipe(map((result) => result as CourseViewModel[]));
  }
  getListOfStudentCourseAdded(courseId): Observable<StudentAddedViewModel[]> {
    const endpointUrl = `${this.getStudentUrl()}/course/student/getListOfStudentCourseAdded/${courseId}`;
    return this.httpClient
      .get(endpointUrl)
      .pipe(map((result) => result as StudentAddedViewModel[]));
  }
  submitCourseTakenApproval(courseTakens: CourseTaken[]): Observable<any> {
    const endpointUrl = `${this.getStudentUrl()}`;
    return this.httpClient
      .put(endpointUrl, courseTakens)
      .pipe(map(result => result as any));
  }
  getListOfAllAddDropCourse(applicantId: string): Observable<StudentCoursesTaken[]> {
    const endpointUrl = `${this.getStudentUrl()}/student/${applicantId}/getListOfAllAddDropCourse`;
    return this.httpClient
      .get(endpointUrl)
      .pipe(map((result) => result as StudentCoursesTaken[]));
  }
  getListOfAddDropCourse(applicantUserId: string, seasonTerm: number): Observable<StudentProfileViewModel> {
    const endpointUrl = `${this.getStudentUrl()}/student/${applicantUserId}/${seasonTerm}/getListOfAddDropCourse`;
    return this.httpClient
      .get(endpointUrl)
      .pipe(map((result) => result as StudentProfileViewModel));
  }

  getListOfTermRegisteredCourseList(termId: string): Observable<StudentRegistrationSlipViewModel[]> {
    const endpointUrl = `${this.getStudentUrl()}/student/${termId}/getListOfTermRegisteredCourseList`;
    return this.httpClient
      .get(endpointUrl)
      .pipe(map((result) => result as StudentRegistrationSlipViewModel[]));
  }
  getRegisteredNewStudentList(academicProgrameCode: string,entryYear:number, startDate: string, endDate: string): Observable<RegisteredNewStudentViewModel[]> {
    const endpointUrl = `${this.getStudentUrlList()}/student/getRegisteredNewStudentList/new`;
    let params = new HttpParams();
    
    if (academicProgrameCode && academicProgrameCode.trim() !== '' || academicProgrameCode != null) {
      params = params.append('academicProgrameCode', academicProgrameCode);
    }
    if (entryYear && entryYear !== 0 || entryYear != undefined) {
      params = params.append('entryYear', entryYear);
    }
    if (startDate && startDate.trim() !== '') {
      params = params.append('startDate', startDate);
    }
    if (endDate && endDate.trim() !== '') {
      params = params.append('endDate', endDate);
    }
    
    return this.httpClient
      .get(endpointUrl, { params })
      .pipe(map((result) => result as RegisteredNewStudentViewModel[]));
  }

  updateStudentEmail(studentId: string, newEmail: string): Observable<any> {
    const endpointUrl = `${this.getStudentUrlList()}/UpdateStudentEmail/${studentId}/${newEmail}`;
    return this.httpClient.put<any>(endpointUrl, null).pipe(
      catchError((error) => {
        console.error('Error occurred while updating student email:', error);
        return throwError(() => new Error(error.message || 'Error updating student email'));
      })
    );
  }
  getStudentTranscriptByStudentId(
    studentId: string
  ): Observable<StudentTranscriptViewModel> {
    const endpointUrl = `${this.getStudentUrlList()}/transcript/${studentId}`;
    return this.httpClient.get<StudentTranscriptViewModel>(endpointUrl);
  }

  getCalculatedCGPA(studentId: string): Observable<number> {
    const endpointUrl = `${this.getStudentUrlList()}/cgpa/${studentId}`;
    return this.httpClient.get<number>(endpointUrl);
  }
}
