import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CurriculumBreakdown
} from 'src/app/curricula/models/curriculum-breakdown.model';
import { CrudService } from 'src/app/services/crud.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CurriculumQuadrantBreakdownService {
  private readonly breakdowns = `/${environment.apiVersion}/curriculumquadrantbreakdowns`;
  private readonly quadrants = `/${environment.apiVersion}/quadrants`;
  private readonly courses = `/${environment.apiVersion}/courses`;
  private readonly curriculum = `/${environment.apiVersion}/curriculum`;

  constructor(private crud: CrudService) {}

  getCurriculumQuadrantBreakdownId(id: number): Observable<any> {
    return this.crud.getById(this.breakdowns, id);
  }

  create(postData: any): Observable<any> {
    return this.crud.add(this.breakdowns, postData);
  }

  createCurriculumBreakdown(postData: any): Observable<any> {
    return this.crud.add(this.breakdowns, postData);
  }

  getCurriculumQuadrantBreakdownByCurriculumId(id: string): Observable<CurriculumBreakdown[]> {
    return this.crud.getList<CurriculumBreakdown[]>(`${this.breakdowns}/breakdown/${id}`);
  }

  getCurriculumQuadrantBreakdownList(): Observable<any> {
    return this.crud.getList(this.breakdowns);
  }

  getCurriculumQuadrantBreakdownListPaginated(query: string): Observable<any> {
    return this.crud.getPaginated(this.breakdowns, query);
  }

  update(id: number, postData: any): Observable<any> {
    return this.crud.update(this.breakdowns, id, postData);
  }

  delete(id: number): Observable<any> {
    return this.crud.delete(this.breakdowns, id);
  }

  getCourseList(): Observable<any> {
    return this.crud.getList(this.courses);
  }

  getQuadratList(): Observable<any> {
    return this.crud.getList(this.quadrants);
  }

  getQuadratListByCurriculumCode(curriculumCode: string): Observable<any> {
    return this.crud.getList(`${this.quadrants}/by-curriculum/${encodeURIComponent(curriculumCode)}`);
  }

  getCurriculumList(): Observable<any> {
    return this.crud.getList(this.curriculum);
  }

  getListOfUnRegisteredCourseById(id: string, quadrantId: string): Observable<any[]> {
    return this.crud.getList<any[]>(
      `${this.breakdowns}/getListOfUnRegisteredCourseById/${id}/${quadrantId}`
    );
  }

  getListOfCurriculumByProgramId(id: string): Observable<any[]> {
    return this.crud.getList<any[]>(`${this.breakdowns}/getListOfCurriculumByProgramId/${id}`);
  }

  getSavedCourses(curId: string, quadrantId: string): Observable<any[]> {
    return this.crud.getList<any[]>(
      `${this.breakdowns}/getCurriculumQuadrantCourseBreakdowns/${curId}/${quadrantId}`
    );
  }
}
