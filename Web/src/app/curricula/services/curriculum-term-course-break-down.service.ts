import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CrudService } from 'src/app/services/crud.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CurriculumTermCourseBreakDownService {
  private readonly breakdowns = `/${environment.apiVersion}/curriculumtermcoursebreakdown`;

  constructor(private crud: CrudService) {}

  create(postData: any): Observable<any> {
    return this.crud.add(this.breakdowns, postData);
  }

  update(id: number, postData: any): Observable<any> {
    return this.crud.update(this.breakdowns, id, postData);
  }

  delete(id: number): Observable<any> {
    return this.crud.delete(this.breakdowns, id);
  }

  getCurriculumCourseBreakdowns(id: string, yearNumber: number): Observable<any[]> {
    return this.crud.getList<any[]>(
      `${this.breakdowns}/getCurriculumCourseBreakdowns/${id}/${yearNumber}`
    );
  }

  getCurriculumCourseBreakdownList(): Observable<any[]> {
    return this.crud.getList<any[]>(this.breakdowns);
  }

  getCurriculumCourseBreakdownListPaginated(query: string): Observable<any> {
    return this.crud.getPaginated(this.breakdowns, query);
  }

  getListOfUnRegisteredCourse(): Observable<any[]> {
    return this.crud.getList<any[]>(`${this.breakdowns}/getUnSelectedCourse`);
  }

  getCurriculumTermBreakdownById(id: number): Observable<any> {
    return this.crud.getById(this.breakdowns, id);
  }

  getSavedCourses(curId: string, term: number, year: number): Observable<any[]> {
    return this.crud.getList<any[]>(
      `${this.breakdowns}/getCurriculumTermYearCourseBreakdowns/${curId}/${term}/${year}`
    );
  }

  getListOfUnRegisteredCourseById(curId: string, term: number, year: number): Observable<any[]> {
    return this.crud.getList<any[]>(
      `${this.breakdowns}/getListOfUnRegisteredCourse/yearBreakdown/${curId}/${term}/${year}`
    );
  }
}
