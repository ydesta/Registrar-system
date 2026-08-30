import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { BaseModel } from '../Models/BaseMode';
import { CourseExemptionModel } from '../Models/CourseExemptionModel';
import { CrudService } from 'src/app/services/crud.service';

@Injectable({
  providedIn: 'root'
})
export class CourseExemptionService {
  private readonly exemptions = `/${environment.apiVersion}/courseexemptions`;

  constructor(private crud: CrudService) { }

  getCourseExemptions(): Observable<BaseModel<CourseExemptionModel[]>> {
    return this.crud.getList<BaseModel<CourseExemptionModel[]>>(this.exemptions);
  }

  getCourseExemptionsPaginated(query: string): Observable<any> {
    return this.crud.getPaginated(this.exemptions, query);
  }

  getCourseExemptionById(id: number): Observable<BaseModel<CourseExemptionModel>> {
    return this.crud.getById<BaseModel<CourseExemptionModel>>(this.exemptions, id);
  }

  getCourseExemptionsByStudentId(studentId: string): Observable<BaseModel<CourseExemptionModel[]>> {
    return this.crud.getList<BaseModel<CourseExemptionModel[]>>(`${this.exemptions}/student/${studentId}`);
  }

  addCourseExemption(courseExemption: CourseExemptionModel): Observable<BaseModel<any>> {
    return this.crud.add<BaseModel<any>>(this.exemptions, courseExemption);
  }

  updateCourseExemption(id: number, courseExemption: CourseExemptionModel): Observable<BaseModel<any>> {
    return this.crud.update<BaseModel<any>>(this.exemptions, id, courseExemption);
  }

  deleteCourseExemption(id: number): Observable<BaseModel<any>> {
    return this.crud.delete<BaseModel<any>>(this.exemptions, id);
  }
}
