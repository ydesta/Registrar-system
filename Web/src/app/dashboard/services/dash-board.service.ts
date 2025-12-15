import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable, catchError, throwError, timer } from 'rxjs';
import { mergeMap, retryWhen, take } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { KpiCard } from '../models/KpiCard';
import { GPATrend } from '../models/GPATrend';

@Injectable({
  providedIn: 'root'
})
export class DashBoardService {
  baseUrl = environment.baseUrl;
  private readonly _dashboardUrl: string = `/${environment.apiVersion}/dash`;
  getDashBoardUrl() {
    return this.baseUrl + this._dashboardUrl;
  }
  constructor(private httpClient: HttpClient) { }

  getListOfKpiCards(applicantUserId: string): Observable<KpiCard[]> {
    const endpointUrl = `${this.getDashBoardUrl()}/${applicantUserId}`;
    return this.httpClient
      .get<KpiCard[]>(endpointUrl)
      .pipe(
        map(result => result),
        this.handleRetryLogic()
      );
  }
  
  getListOfGPATrend(applicantUserId: string): Observable<GPATrend[]> {
    const endpointUrl = `${this.getDashBoardUrl()}/${applicantUserId}/getListOfGPATrend`;
    return this.httpClient
      .get<GPATrend[]>(endpointUrl)
      .pipe(
        map(result => result),
        this.handleRetryLogic()
      );
  }

  private handleRetryLogic() {
    return (source: Observable<any>) => source.pipe(
      // retryWhen(errors => 
      //   errors.pipe(
      //     mergeMap((err: HttpErrorResponse) => {
      //       if (err.status === 429) {
      //         // Exponential backoff for rate limiting
      //         const retryAttempt = parseInt(err.headers.get('X-Retry-After') || '1');
      //         const delay = Math.min(1000 * Math.pow(2, retryAttempt), 5000); // Max 5 seconds
      //         console.log(`Dashboard API rate limited, retrying in ${delay}ms`);
      //         return timer(delay);
      //       }
      //       return throwError(() => err);
      //     }),
      //     take(2) // Max 2 retries for dashboard calls
      //   )
      // ),
      catchError((err: HttpErrorResponse) => {
        return throwError(() => err);
      })
    );
  }

}
