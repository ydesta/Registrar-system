import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CrudService } from 'src/app/services/crud.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BankService {
  private readonly payments = `/${environment.apiVersion}/pay`;
  private readonly banks = `/${environment.apiVersion}/banks`;

  constructor(private crud: CrudService) { }

  create(postData: any): Observable<any> {
    return this.crud.add(this.payments, postData);
  }

  update(id: string, postData: any): Observable<any> {
    return this.crud.update(this.payments, id, postData);
  }

  getstudentPymentById(id: string): Observable<any> {
    return this.crud.getById(this.payments, id);
  }

  getBankList(): Observable<any> {
    return this.crud.getList(this.banks);
  }
}
