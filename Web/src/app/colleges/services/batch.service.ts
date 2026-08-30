import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BatchModel } from 'src/app/Models/BatchModel';
import { CrudService } from 'src/app/services/crud.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BatchService {
  private readonly batches = `/${environment.apiVersion}/batch`;

  constructor(private crud: CrudService) {}

  create(postData: BatchModel): Observable<any> {
    return this.crud.add(this.batches, postData);
  }

  update(id: string, postData: BatchModel): Observable<any> {
    return this.crud.update(this.batches, id, postData);
  }

  delete(id: string): Observable<any> {
    return this.crud.delete(this.batches, id);
  }

  getBatchList(): Observable<any> {
    return this.crud.getList(this.batches);
  }

  getBatchById(id: string): Observable<any> {
    return this.crud.getById(this.batches, id);
  }
}
