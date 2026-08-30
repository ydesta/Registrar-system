import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CrudService } from 'src/app/services/crud.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FileService {
  private readonly files = `/${environment.apiVersion}/file`;

  constructor(private crud: CrudService) {}

  getFileById(id: string): Observable<any> {
    return this.crud.getById(this.files, id);
  }
}
