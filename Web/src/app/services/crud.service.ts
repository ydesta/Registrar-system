import { SearchQueryParams } from './../reports/SearchParam/search-query-params';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { BaseModel } from '../Models/BaseMode';

@Injectable({
  providedIn: 'root',
})
export class CrudService {
  baseUrl = environment.baseUrl;
  fileUrl = environment.fileUrl;

  constructor(private _http: HttpClient) {}

  getList(appendUrl: string): Observable<BaseModel<any>> {
    return this._http.get<BaseModel<any>>(this.baseUrl + appendUrl);
  }

  add(appendUrl: string, data: any) {
    return this._http.post(this.baseUrl + appendUrl, data);
  }

  delete(appendUrl: any, id: any) {
    return this._http.delete(this.baseUrl + appendUrl + '/' + id);
  }

  update(appendUrl: string, id: any, data: any) {
    return this._http.patch(this.baseUrl + appendUrl + '/' + id, data);
  }

  expoerExcel(appendUrl: string) {
    const httpOptions = { responseType: 'blob' as 'json' };
    return this._http.get(this.fileUrl + appendUrl, httpOptions);
  }
  getRegisteredStud(searchParms: SearchQueryParams): Observable<any[]> {
    const appendUrl = '/StudentRegistrations/RegisteredStudent/';
    const endpointUrl = this.baseUrl + appendUrl;
    const saParams = new HttpParams()
      .append('AcademicTerm', searchParms.AcademicTerm.toString())
      .append('Course', searchParms.Course.toString())
      .append('Status', searchParms.Status.toString());
    return this._http.get<any[]>(endpointUrl, { params: saParams });
  }
}
