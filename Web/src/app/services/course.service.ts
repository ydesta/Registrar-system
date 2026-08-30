import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CourseModel } from '../Models/CourseModel';
import { CrudService } from 'src/app/services/crud.service';

@Injectable({
  providedIn: 'root'
})
export class CourseService {
  private readonly courses = `/${environment.apiVersion}/courses`;

  constructor(private crud: CrudService) {}

  getAllCourses(): Observable<CourseModel[]> {
    return this.crud.getList<CourseModel[]>(this.courses);
  }

  getCourseById(id: string): Observable<CourseModel> {
    return this.crud.getById<CourseModel>(this.courses, id);
  }

  createCourse(course: CourseModel): Observable<CourseModel> {
    return this.crud.add<CourseModel>(this.courses, course);
  }

  updateCourse(id: string, course: CourseModel): Observable<CourseModel> {
    return this.crud.put<CourseModel>(`${this.courses}/${id}`, course);
  }

  deleteCourse(id: string): Observable<any> {
    return this.crud.delete(this.courses, id);
  }
}
