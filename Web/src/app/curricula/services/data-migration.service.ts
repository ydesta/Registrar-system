import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DataMigrationService {
 //  idp = "https://localhost:5001/api/StudentDataMigrations"
 // idp = "https://hilcoe.edu.et:5001/api/StudentDataMigrations"
  baseUrl = environment.baseUrl;
  idp = `${environment.baseUrl}/StudentDataMigrations`;
  private readonly _settingDataLoads: string = "/SettingDataLoads";
  private readonly _batchCodeDataMigrations: string = "/BatchCodeDataMigrations";
  private readonly _termCourseOfferingDataMigrations: string = "/TermCourseOfferingDataMigrations";
  private readonly _studentCourseRegistrationDatas: string = "/StudentCourseRegistrationDatas";
  private readonly _studentDataMigrations: string = "/StudentDataMigrations";
  getSettingDataLoadsUrl() {
    return this.baseUrl + this._settingDataLoads;
  }
  getBatchCodeDataMigrationsUrl() {
    return this.baseUrl + this._batchCodeDataMigrations;
  }
  getTermCourseOfferingDataMigrationsUrl() {
    return this.baseUrl + this._termCourseOfferingDataMigrations;
  }
  getStudentCourseRegistrationDatasUrl() {
    return this.baseUrl + this._studentCourseRegistrationDatas;
  }

  constructor(private httpClient: HttpClient) { }
  importCurriculumFileAsync(postData: any): Observable<any> {
    const endpointUrl = `${this.getSettingDataLoadsUrl()}`;
    return this.httpClient.post<any>(endpointUrl, postData).pipe(
      map((data) => {
        return data;
      })
    );
  }
  getImportProgramFileAsync(postData: any): Observable<any> {
    const endpointUrl = `${this.getSettingDataLoadsUrl()}/getImportProgramFileAsync`;
    return this.httpClient.post<any>(endpointUrl, postData).pipe(
      map((data) => {
        return data;
      })
    );
  }
  getImportQuadrantFileAsync(postData: any): Observable<any> {
    const endpointUrl = `${this.getSettingDataLoadsUrl()}/getImportQuadrantFileAsync/quadrant`;
    return this.httpClient.post<any>(endpointUrl, postData).pipe(
      map((data) => {
        return data;
      })
    );
  }
  getImportCourseBreakdownFileAsync(postData: any): Observable<any> {
    const endpointUrl = `${this.getSettingDataLoadsUrl()}/getImportCourseBreakdownFileAsync/quadrant/breakDown`;
    return this.httpClient.post<any>(endpointUrl, postData).pipe(
      map((data) => {
        return data;
      })
    );
  }

  getImportStaffFileAsync(postData: any): Observable<any> {
    const endpointUrl = `${this.getSettingDataLoadsUrl()}/getImportStaffFileAsync/quadrant/load/staff`;
    return this.httpClient.post<any>(endpointUrl, postData).pipe(
      map((data) => {
        return data;
      })
    );
  }

  getImportBatchCodeFile(postData: any): Observable<any> {
    const endpointUrl = `${this.getBatchCodeDataMigrationsUrl()}`;
    return this.httpClient.post<any>(endpointUrl, postData).pipe(
      map((data) => {
        return data;
      })
    );
  }

  getImportTermCourseOfferingFile(postData: any): Observable<any> {
    const endpointUrl = `${this.getTermCourseOfferingDataMigrationsUrl()}`;
    return this.httpClient.post<any>(endpointUrl, postData).pipe(
      map((data) => {
        return data;
      })
    );
  }

  getImportStudentCourseRegistrationFile(postData: any): Observable<any> {
    const endpointUrl = `${this.getStudentCourseRegistrationDatasUrl()}`;
    return this.httpClient.post<any>(endpointUrl, postData).pipe(
      map((data) => {
        return data;
      })
    );
  }

  getStudentGradeFileAsync(postData: any): Observable<any> {
    const endpointUrl = `${this.getStudentCourseRegistrationDatasUrl()}/getStudentGradeFileAsync`;
    return this.httpClient.post<any>(endpointUrl, postData).pipe(
      map((data) => {
        return data;
      })
    );
  }

  getCourseFileAsync(postData: any): Observable<any> {
    const endpointUrl = `${this.getStudentCourseRegistrationDatasUrl()}/getCourseFileAsync/dataMigration`;
    return this.httpClient.post<any>(endpointUrl, postData).pipe(
      map((data) => {
        return data;
      })
    );
  }

  getStudentDataMigration(postData: any): Observable<any> {
    const endpointUrl = `${this.idp}`;
    return this.httpClient.post<any>(endpointUrl, postData).pipe(
      map((data) => {
        return data;
      })
    );
  }

}
