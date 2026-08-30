import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CrudService } from 'src/app/services/crud.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AcademicProgrammeService {
  private readonly programmes = `/${environment.apiVersion}/program`;

  constructor(private crud: CrudService) {}

  getAcademicProgrammeList(): Observable<any> {
    return this.crud.getList(this.programmes);
  }
}
