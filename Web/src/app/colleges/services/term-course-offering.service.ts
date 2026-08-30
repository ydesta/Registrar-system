import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { TermCourseOfferingRequest } from '../model/term-course-offering-request.model';
import { CrudService } from 'src/app/services/crud.service';

@Injectable({
  providedIn: 'root'
})
export class TermCourseOfferingService {
  private readonly entries = `/${environment.apiVersion}/entrys`;
  private readonly terms = `/${environment.apiVersion}/term`;
  private readonly staff = `/${environment.apiVersion}/staff`;
  private readonly offerings = `/${environment.apiVersion}/offering`;
  private readonly batches = `/${environment.apiVersion}/batch`;
  pageindex = 1;
  totalRecord = 0;
  pageSize = 10;
  pageSizeOption = [5, 10, 15, 25, 50, 100];
  sortOrder = '';
  searchKey = '';
  sortColumn = '';

  constructor(private crud: CrudService) { }

  create(postData: TermCourseOfferingRequest): Observable<any> {
    return this.crud.add(this.offerings, postData);
  }

  update(id: string, postData: TermCourseOfferingRequest): Observable<any> {
    return this.crud.update(this.offerings, id, postData);
  }

  deactivate(id: string): Observable<any> {
    return this.crud.put(`${this.offerings}/${id}`, {});
  }

  deactivateCourseOfering(id: number): Observable<any> {
    return this.crud.put(`${this.offerings}/activate/${id}`, {});
  }

  activateCourseOffering(id: number): Observable<any> {
    return this.crud.put(`${this.offerings}/activate/${id}`, {});
  }

  delete(id: string): Observable<any> {
    return this.crud.delete(this.offerings, id);
  }

  getEntryList(): Observable<any> {
    return this.crud.getList(this.entries);
  }

  getAcademicTermList(): Observable<any> {
    return this.crud.getList(this.terms);
  }

  getStaffList(): Observable<any> {
    return this.crud.getList(this.staff);
  }

  getBatchList(): Observable<any> {
    return this.crud.getList(this.batches);
  }

  getCourseBreakDownList(curriculumId: string, seasonTerm: number, termYear: number): Observable<any> {
    return this.crud.getList(`${this.offerings}/${curriculumId}/${seasonTerm}/${termYear}`);
  }

  getListOfBatchCodeByAcademicTerm(academicTerm: number, year: number): Observable<any> {
    return this.crud.getList(`${this.offerings}/${academicTerm}/${year}/getListOfBatchCodeByAcademicTerm`);
  }

  getTermCourseOfferingById(id: string): Observable<any> {
    return this.crud.getById(this.offerings, id);
  }

  getTermCourseOfferingList(): Observable<any> {
    return this.crud.getPaginated(this.offerings, {
      searchKey: this.searchKey,
      pageindex: this.pageindex - 1,
      pageSize: this.pageSize,
      sortColumn: this.sortColumn,
      sortOrder: this.sortOrder
    });
  }

  getListOfCourseByAcademicTerm(termId: number, termYear: number): Observable<any> {
    return this.crud.getList(`${this.offerings}/${termId}/${termYear}`);
  }

  getListOfCourseByAcademicTermAndBatch(termId: number, termYear: number, batchCode: string): Observable<any> {
    return this.crud.getList(
      `${this.offerings}/getListOfCourseByAcademicTermAndBatch/${termId}/${termYear}/${batchCode}`
    );
  }
}
