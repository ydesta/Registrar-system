import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CrudService } from 'src/app/services/crud.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DataMigrationService {
  private readonly settings = `/${environment.apiVersion}/migrate/setting`;
  private readonly batches = `/${environment.apiVersion}/migrate/batch`;
  private readonly offerings = `/${environment.apiVersion}/migrate/offering`;
  private readonly registrations = `/${environment.apiVersion}/migrate/registration`;
  private readonly students = `/${environment.apiVersion}/migrate/student`;

  constructor(private crud: CrudService) { }

  importCurriculumFileAsync(postData: any): Observable<any> {
    return this.crud.add(this.settings, postData);
  }

  getImportProgramFileAsync(postData: any): Observable<any> {
    return this.crud.add(`${this.settings}/getImportProgramFileAsync`, postData);
  }

  getImportQuadrantFileAsync(postData: any): Observable<any> {
    return this.crud.add(`${this.settings}/getImportQuadrantFileAsync/quadrant`, postData);
  }

  getImportCourseBreakdownFileAsync(postData: any): Observable<any> {
    return this.crud.add(`${this.settings}/getImportCourseBreakdownFileAsync/quadrant/breakDown`, postData);
  }

  getImportStaffFileAsync(postData: any): Observable<any> {
    return this.crud.add(`${this.settings}/getImportStaffFileAsync/quadrant/load/staff`, postData);
  }

  getImportBatchCodeFile(postData: any): Observable<any> {
    return this.crud.add(this.batches, postData);
  }

  getImportTermCourseOfferingFile(postData: any): Observable<any> {
    return this.crud.add(this.offerings, postData);
  }

  getImportStudentCourseRegistrationFile(postData: any): Observable<any> {
    return this.crud.add(this.registrations, postData);
  }

  getStudentGradeFileAsync(postData: any): Observable<any> {
    return this.crud.add(`${this.registrations}/getStudentGradeFileAsync`, postData);
  }

  getCourseFileAsync(postData: any): Observable<any> {
    return this.crud.add(`${this.registrations}/getCourseFileAsync/dataMigration`, postData);
  }

  getStudentDataMigration(postData: any): Observable<any> {
    return this.crud.add(this.students, postData);
  }
}
