import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CgpaCreditHourLimitModel } from 'src/app/Models/CgpaCreditHourLimitModel';
import { CrudService } from 'src/app/services/crud.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CgpaCreditHourLimitService {
  private readonly base = `/${environment.apiVersion}/cgpa-credit-hour-limits`;

  constructor(private crud: CrudService) {}

  create(postData: CgpaCreditHourLimitModel): Observable<any> {
    return this.crud.add(this.base, postData);
  }

  update(id: string, postData: CgpaCreditHourLimitModel): Observable<any> {
    return this.crud.update(this.base, id, postData);
  }

  delete(id: string): Observable<any> {
    return this.crud.delete(this.base, id);
  }

  getList(): Observable<any> {
    return this.crud.getList(this.base);
  }

  getListPaginated(query: string): Observable<any> {
    return this.crud.getPaginated(this.base, query);
  }

  getById(id: string): Observable<any> {
    return this.crud.getById(this.base, id);
  }

  getConfig(academicTerm?: number, year?: number, batchCode?: string, studentId?: string): Observable<any> {
    return this.crud.getList(`${this.base}/config`, {
      ...(academicTerm != null ? { academicTerm } : {}),
      ...(year != null ? { year } : {}),
      ...(batchCode ? { batchCode } : {}),
      ...(studentId ? { studentId } : {})
    });
  }

  getSetting(academicTerm: number, year: number): Observable<any> {
    return this.crud.getList(`${this.base}/setting`, { academicTerm, year });
  }

  updateSetting(academicTerm: number, year: number, isEnabled: boolean): Observable<any> {
    return this.crud.patch(`${this.base}/setting`, {
      academicTerm,
      year,
      isEnabled,
      createdBy: '-',
      lastModifiedBy: '-'
    });
  }
}
