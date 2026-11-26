import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CrudService } from 'src/app/services/crud.service';
import { environment } from 'src/environments/environment';
import { TermViewModel } from '../model/term-view-model';

@Injectable({
  providedIn: 'root'
})
export class BatchTermService {
  private readonly batchTerms = `/${environment.apiVersion}/batchterms`;
  private readonly terms = `/${environment.apiVersion}/term`;

  constructor(private crud: CrudService) { }

  getNextAcademicTerm(): Observable<any> {
    return this.crud.getList(this.batchTerms);
  }

  GetAcademicTermList(): Observable<TermViewModel[]> {
    return this.crud.getList<TermViewModel[]>(`${this.batchTerms}/academicterm/activity`);
  }

  getCurrentAcademicTerm(): Observable<any> {
    return this.crud.getList(`${this.batchTerms}/current-term`);
  }

  getCourseRegistrationVisibility(academicTermId: number): Observable<any> {
    return this.crud.getList(`${this.terms}/${academicTermId}/registration-visibility`);
  }

  getCourseBreakDownList(
    curriculumId: string,
    seasonTerm: number,
    batchId: string,
    isUpdate: boolean
  ): Observable<any> {
    return this.crud.getList(`${this.batchTerms}/${curriculumId}/${seasonTerm}/${batchId}/${isUpdate}`);
  }

  getAllCourseByBatchId(
    curriculumId: string,
    batchId: string,
    isUpdate: boolean,
    academicTermId: number
  ): Observable<any> {
    return this.crud.getList(
      `${this.batchTerms}/${curriculumId}/${batchId}/${isUpdate}/${academicTermId}/getAllCourseByBatchId`
    );
  }

  getBatchTermsByBatchId(batchId: string): Observable<any> {
    return this.crud.getList(`${this.batchTerms}/by-batch/${batchId}`);
  }

  updateBatchTerm(id: number, body: {
    academicTermId: number;
    academicYear: number;
    academicTerm: number;
  }): Observable<any> {
    return this.crud.update(this.batchTerms, id, body);
  }
}
