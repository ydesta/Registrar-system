import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CrudService } from 'src/app/services/crud.service';
import { environment } from 'src/environments/environment';
import { CourseOfferingInstructorAssignment } from '../model/course-offering-instructor-assignment.model';

@Injectable({
  providedIn: 'root'
})
export class CourseOfferingInstructorAssignmentService {
  private readonly assignments = `/${environment.apiVersion}/courseofferinginstructorassignment`;

  constructor(private crud: CrudService) { }

  create(postData: CourseOfferingInstructorAssignment): Observable<any> {
    return this.crud.add(this.assignments, postData);
  }

  getCourseOfferingInstructorAssigned(courseId: string, offeringId: number): Observable<any> {
    return this.crud.getList(`${this.assignments}/${courseId}/${offeringId}`);
  }

  getListOfAssignedCourses(staffId: string): Observable<any> {
    return this.crud.getList(`${this.assignments}/getListOfAssignedCourses/${staffId}`);
  }

  getAssignedInstructors(
    academicTerm: number,
    year: number,
    batchId: string,
    courseId: string
  ): Observable<any> {
    return this.crud.getList(
      `${this.assignments}/getAssignedInstructors/${academicTerm}/${year}/${batchId}/${courseId}`
    );
  }
}
