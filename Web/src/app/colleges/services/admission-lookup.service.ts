import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AdmissionLookupModel } from 'src/app/Models/AdmissionLookupModel';
import { CrudService } from 'src/app/services/crud.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AdmissionLookupService {
  private readonly lookups = `/${environment.apiVersion}/admissionlookups`;

  constructor(private crud: CrudService) {}

  create(postData: AdmissionLookupModel): Observable<any> {
    return this.crud.add(this.lookups, postData);
  }

  update(id: string, postData: AdmissionLookupModel): Observable<any> {
    return this.crud.update(this.lookups, id, postData);
  }

  delete(id: string): Observable<any> {
    return this.crud.delete(this.lookups, id);
  }

  getList(): Observable<any> {
    return this.crud.getList(this.lookups);
  }

  getListPaginated(query: string): Observable<any> {
    return this.crud.getPaginated(this.lookups, query);
  }

  getById(id: string): Observable<any> {
    return this.crud.getById(this.lookups, id);
  }

  getApplicantYears(programmeId: string, division: number): Observable<any> {
    return this.crud.getList(`${this.lookups}/applicant-years`, {
      programmeId,
      division
    });
  }
}
