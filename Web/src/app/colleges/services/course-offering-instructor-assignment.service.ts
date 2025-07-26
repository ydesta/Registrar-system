import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, map } from "rxjs";
import { environment } from "src/environments/environment";
import { CourseOfferingInstructorAssignment } from "../model/course-offering-instructor-assignment.model";

@Injectable({
  providedIn: "root"
})
export class CourseOfferingInstructorAssignmentService {
  baseUrl = environment.baseUrl;
  private readonly _courseOfferingInstructorAssignment: string = "/CourseOfferingInstructorAssignment";
  getCourseOfferingInstructorAssignmentUrl() {
    return this.baseUrl + this._courseOfferingInstructorAssignment;
  }
  constructor(private httpClient: HttpClient) {}
  create(postData: CourseOfferingInstructorAssignment): Observable<any> {
    const endPointUrl = `${this.getCourseOfferingInstructorAssignmentUrl()}`;
    return this.httpClient.post<any>(endPointUrl, postData).pipe(
      map(data => {
        return data;
      })
    );
  }
  getCourseOfferingInstructorAssigned(
    courseId: string,
    offeringId: string
  ): Observable<any> {
    const endPointUrl = `${this.getCourseOfferingInstructorAssignmentUrl()}/${courseId}/${offeringId}`;
    return this.httpClient.get<any>(endPointUrl).pipe(
      map(data => {
        return data;
      })
    );
  }
  getListOfAssignedCourses(staffId: string): Observable<any> {
    const endPointUrl = `${this.getCourseOfferingInstructorAssignmentUrl()}/getListOfAssignedCourses/${staffId}`;
    return this.httpClient.get<any>(endPointUrl).pipe(
      map(data => {
        return data;
      })
    );
  }
}
