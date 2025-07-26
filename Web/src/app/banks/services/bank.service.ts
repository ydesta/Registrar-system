import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { PendingStudentPaymentModel } from '../models/pending-sudent-payment.model';

@Injectable({
  providedIn: 'root'
})
export class BankService {
  baseUrl = environment.baseUrl;
  private readonly _studentPayment: string = "/StudentPayments";
  private readonly _banks: string = "/Banks";
  getStudentPaymentUrl() {
    return this.baseUrl + this._studentPayment;
  }
  getBankUrl() {
    return this.baseUrl + this._banks;
  }
  constructor(private httpClient: HttpClient) { }
  create(postData: any): Observable<any> {
    const endPointUrl = `${this.getStudentPaymentUrl()}`;
    return this.httpClient.post<any>(endPointUrl, postData).pipe(
      map(data => {
        return data;
      })
    );
  }
  update(id: string, postData: any): Observable<any> {
    const endPointUrl = `${this.getStudentPaymentUrl()}/${id}`;
    return this.httpClient.patch<any>(endPointUrl, postData).pipe(
      map(data => {
        return data;
      })
    );
  }
  getstudentPymentById(id: string): Observable<any> {
    const endpointUrl = `${this.getStudentPaymentUrl()}/${id}`;
    return this.httpClient
      .get(endpointUrl)
      .pipe(map(result => result as any[]));
  }
  getBankList(): Observable<any> {
    const endpointUrl = `${this.getBankUrl()}`;
    return this.httpClient
      .get(endpointUrl)
      .pipe(map(result => result as any[]));
  }

}
