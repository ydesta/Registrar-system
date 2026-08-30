import { HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ApplicantFeeViewModel } from '../model/applicant-fee-view-model.model';
import { CrudService } from 'src/app/services/crud.service';

@Injectable({
  providedIn: 'root'
})
export class AcademicProgramRequestService {
  private readonly requests = `/${environment.apiVersion}/academicprogramrequest`;
  private readonly programmes = `/${environment.apiVersion}/program`;

  constructor(private crud: CrudService) {}

  getApplicantacadamicPrgramtId(id: string): Observable<any> {
    return this.crud.getList(`${this.requests}/applicant/${id}`);
  }

  create(experience: any): Observable<any> {
    return this.crud.addResponse(this.requests, experience).pipe(
      map(response => this.unwrap(response)),
      catchError(error => this.asSuccess(error))
    );
  }

  getAacadamicPrgramtList(): Observable<any> {
    return this.crud.getList(this.programmes);
  }

  update(id: number, educationBackground: any): Observable<any> {
    return this.crud.updateResponse(this.requests, id, educationBackground).pipe(
      map(response => this.unwrap(response)),
      catchError(error => this.asSuccess(error))
    );
  }

  delete(id: number): Observable<any> {
    return this.crud.deleteResponse(this.requests, id).pipe(
      map(response => this.unwrap(response)),
      catchError(error => this.asSuccess(error))
    );
  }

  getApplicationFee(id: string): Observable<ApplicantFeeViewModel> {
    return this.crud.getList<ApplicantFeeViewModel>(`${this.requests}/getApplicationFee/applicant/${id}`);
  }

  private unwrap(response: HttpResponse<any>): any {
    if (response.body) {
      return response.body;
    }
    if (response.status === 200) {
      return 'success';
    }
    return response;
  }

  private asSuccess(error: any): Observable<any> {
    if (error.status === 200) {
      return of('success');
    }
    throw error;
  }
}
