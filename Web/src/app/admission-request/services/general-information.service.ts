import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, map, of, shareReplay, catchError, throwError, BehaviorSubject } from "rxjs";
import { environment } from "src/environments/environment";
import { ApplicationRequest } from "../model/application-request.model";
import { ApplicantAcedamicRequestViewModel } from "../model/applicant-acedamic-request-view-model.model";

@Injectable({
  providedIn: "root"
})
export class GeneralInformationService {
  baseUrl = environment.baseUrl;
  private readonly _generalUserInformation: string = "/Applicants";
  private parentApplicantIdSubject = new BehaviorSubject<string | null>(null);
  private isFetching = false;

  getApplicantUrl() {
    return this.baseUrl + this._generalUserInformation;
  }

  constructor(private httpClient: HttpClient) {}

  createGeneralInformation(generalUserInformation: any): Observable<any> {
    const endPointUrl = `${this.getApplicantUrl()}`;
    return this.httpClient.post<any>(endPointUrl, generalUserInformation).pipe(
      map(data => {
        return data;
      })
    );
  }
  getApplicantByUserId(id: string): Observable<any> {
    const endpointUrl = `${this.getApplicantUrl()}/ByApplicantUserId/${id}`;
    return this.httpClient.get(endpointUrl).pipe(map(result => result as any));
  }
  getApplicantById(id: string): Observable<any> {
    const endpointUrl = `${this.getApplicantUrl()}/${id}`;
    return this.httpClient.get(endpointUrl).pipe(map(result => result as any));
  }
  finalSubmit(id: string, finalRequest: any): Observable<any> {
    const endPointUrl = `${this.getApplicantUrl()}/RequestApplicant/${id}`;
    return this.httpClient.patch<any>(endPointUrl, finalRequest).pipe(
      map(data => {
        return data;
      })
    );
  }
  updateApplicant(id: string, generalUserInformation: any): Observable<any> {
    const endPointUrl = `${this.getApplicantUrl()}/${id}`;
    return this.httpClient.patch<any>(endPointUrl, generalUserInformation).pipe(
      map(data => {
        return data;
      })
    );
  }
  getApplicantRequestList(): Observable<ApplicantAcedamicRequestViewModel[]> {
    const endpointUrl = `${this.getApplicantUrl()}/request`;
    return this.httpClient
      .get(endpointUrl)
      .pipe(map(result => result as ApplicantAcedamicRequestViewModel[]));
  }

  applicantReviewerDecision(
    id: number,
    accedamicProgramRequest: any
  ): Observable<any> {
    const endPointUrl = `${this.getApplicantUrl()}/ReviewerDecision/${id}`;
    return this.httpClient
      .patch<any>(endPointUrl, accedamicProgramRequest)
      .pipe(
        map(data => {
          return data;
        })
      );
  }

  getOrStoreParentApplicantId(userId: string): Observable<string> {
    // Check if we already have a cached value
    const cachedValue = this.parentApplicantIdSubject.value;
    if (cachedValue) {
      return of(cachedValue);
    }

    // Check localStorage first
    const storedId = localStorage.getItem('parent_applicant_id');
    if (storedId) {
      this.parentApplicantIdSubject.next(storedId);
      return of(storedId);
    }

    // If already fetching, return the current observable
    if (this.isFetching) {
      return this.parentApplicantIdSubject.asObservable().pipe(
        map(value => {
          if (value === null) {
            throw new Error('Failed to fetch applicant ID');
          }
          return value;
        })
      );
    }

    // Start fetching
    this.isFetching = true;
    
    return this.getApplicantByUserId(userId).pipe(
      map(res => {
        this.isFetching = false;
        if (res.data && res.data.id) {
          const applicantId = res.data.id;
          localStorage.setItem('parent_applicant_id', applicantId);
          this.parentApplicantIdSubject.next(applicantId);
          return applicantId;
        }
        throw new Error('Applicant not found');
      }),
      catchError(error => {
        this.isFetching = false;
        console.error('Error fetching applicant ID:', error);
        return throwError(() => error);
      })
    );
  }

  clearParentApplicantIdCache() {
    this.parentApplicantIdSubject.next(null);
    this.isFetching = false;
    localStorage.removeItem('parent_applicant_id');
  }
}
