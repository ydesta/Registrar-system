import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CrudService } from 'src/app/services/crud.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApplicantContactPersonService {
  private readonly contacts = `/${environment.apiVersion}/applicantcontactpersons`;

  constructor(private crud: CrudService) {}

  getApplicantContactPersonId(id: string): Observable<any> {
    return this.crud.getList(`${this.contacts}/applicant/${id}`);
  }

  create(educationBackground: any): Observable<any> {
    return this.crud.add(this.contacts, educationBackground);
  }

  updateContact(id: string, applicantContact: any): Observable<any> {
    return this.crud.update(this.contacts, id, applicantContact);
  }

  delete(id: string): Observable<any> {
    return this.crud.delete(this.contacts, id);
  }
}
