import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CrudService } from 'src/app/services/crud.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CurriculumService {
  private readonly curricula = `/${environment.apiVersion}/curriculum`;

  constructor(private crud: CrudService) {}

  create(postData: any): Observable<any> {
    return this.crud.add(this.curricula, postData);
  }

  update(id: string, postData: any): Observable<any> {
    return this.crud.update(this.curricula, id, postData);
  }

  delete(id: string): Observable<any> {
    return this.crud.delete(this.curricula, id);
  }

  getCurriculumList(): Observable<any> {
    return this.crud.getList(this.curricula);
  }

  getCurriculumStatusTrackingByCurriculumId(curriculumId: string): Observable<any> {
    return this.crud.getList(`${this.curricula}/getCurriculumStatusTracking/${curriculumId}`);
  }

  getCurriculumById(id: string): Observable<any> {
    return this.crud.getById(this.curricula, id);
  }
}
