import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CrudService } from 'src/app/services/crud.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EducationBackgroundService {
  private readonly education = `/${environment.apiVersion}/applicanteducationbackgrounds`;

  constructor(private crud: CrudService) {}

  getApplicantEducationByApplicantId(id: string): Observable<any> {
    return this.crud.getList(`${this.education}/applicantId/${id}`);
  }

  createEducation(educationBackground: any): Observable<any> {
    return this.crud.add(this.education, educationBackground);
  }

  update(id: string, educationBackground: any): Observable<any> {
    return this.crud.update(this.education, id, educationBackground);
  }

  delete(id: string): Observable<any> {
    return this.crud.delete(this.education, id);
  }
}
