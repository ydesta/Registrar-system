import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CrudService } from 'src/app/services/crud.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WorkExperienceService {
  private readonly experiences = `/${environment.apiVersion}/applicantworkexperiences`;

  constructor(private crud: CrudService) {}

  getApplicantExperienceByApplicantId(id: string): Observable<any> {
    return this.crud.getList(`${this.experiences}/applicant/${id}`);
  }

  createExperience(experience: any): Observable<any> {
    return this.crud.add(this.experiences, experience);
  }

  update(id: string, experience: any): Observable<any> {
    return this.crud.update(this.experiences, id, experience);
  }

  delete(id: string): Observable<any> {
    return this.crud.delete(this.experiences, id);
  }
}
