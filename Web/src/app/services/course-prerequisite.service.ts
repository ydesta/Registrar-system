import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CrudService } from 'src/app/services/crud.service';

@Injectable({
  providedIn: 'root'
})
export class CoursePrerequisiteService {
  private readonly prerequisites = `/${environment.apiVersion}/courseprerequisites`;

  constructor(private crud: CrudService) {}

  getAllCoursePrerequisites(): Observable<any> {
    return this.crud.getList(this.prerequisites);
  }

  getCoursePrerequisiteById(id: string): Observable<any> {
    return this.crud.getById(this.prerequisites, id);
  }

  createCoursePrerequisite(prerequisite: any): Observable<any> {
    return this.crud.add(this.prerequisites, prerequisite);
  }

  updateCoursePrerequisite(id: string, prerequisite: any): Observable<any> {
    return this.crud.update(this.prerequisites, id, prerequisite);
  }

  deleteCoursePrerequisite(id: string): Observable<any> {
    return this.crud.delete(this.prerequisites, id);
  }
}
