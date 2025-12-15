import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, map, of, shareReplay, catchError, throwError, BehaviorSubject, finalize, filter, take } from "rxjs";
import { environment } from "src/environments/environment";
import { ApplicationRequest } from "../model/application-request.model";
import { ApplicantAcedamicRequestViewModel, ApplicantIncompleteResponse } from "../model/applicant-acedamic-request-view-model.model";

// Add interfaces for API responses
// Most API responses in this system follow a consistent pattern with data, message, success, and status fields
interface ApiResponse<T> {
  data: T;
  message?: string;
  success?: boolean;
  status?: string;
}

interface ApplicantResponse {
  id: string;
  [key: string]: any;
}

interface CreateUpdateResponse {
  id: string;
  message?: string;
  success?: boolean;
  status?: string;
  [key: string]: any;
}

interface ReviewerDecisionResponse extends CreateUpdateResponse {
  status: string;
  data: {
    applicantUserId: string;
    emailAddress: string;
    [key: string]: any;
  };
}

@Injectable({
  providedIn: "root"
})
export class GeneralInformationService {
  baseUrl = environment.baseUrl;
  private readonly _generalUserInformation: string = `/${environment.apiVersion}/applicant`;
  private parentApplicantIdSubject = new BehaviorSubject<string | null>(null);
  private isFetching = false;
  private lastFetchTime = 0;
  private readonly FETCH_COOLDOWN = 5000;

  getApplicantUrl() {
    return this.baseUrl + this._generalUserInformation;
  }

  constructor(private httpClient: HttpClient) { }

  createGeneralInformation(generalUserInformation: any): Observable<ApiResponse<CreateUpdateResponse> | CreateUpdateResponse> {
    const endPointUrl = `${this.getApplicantUrl()}`;
    return this.httpClient.post<ApiResponse<CreateUpdateResponse> | CreateUpdateResponse>(endPointUrl, generalUserInformation);
  }
  getApplicantByUserId(id: string): Observable<ApiResponse<ApplicantResponse> | ApplicantResponse> {
    const endpointUrl = `${this.getApplicantUrl()}/ByApplicantUserId/${id}`;
    return this.httpClient.get<ApiResponse<ApplicantResponse> | ApplicantResponse>(endpointUrl);
  }

  getApplicantById(id: string): Observable<ApiResponse<ApplicantResponse> | ApplicantResponse> {
    const endpointUrl = `${this.getApplicantUrl()}/${id}`;
    return this.httpClient.get<ApiResponse<ApplicantResponse> | ApplicantResponse>(endpointUrl);
  }
  finalSubmit(id: string, finalRequest: any): Observable<ApiResponse<CreateUpdateResponse> | CreateUpdateResponse> {
    const endPointUrl = `${this.getApplicantUrl()}/RequestApplicant/${id}`;
    return this.httpClient.patch<ApiResponse<CreateUpdateResponse> | CreateUpdateResponse>(endPointUrl, finalRequest);
  }
  updateApplicant(id: string, generalUserInformation: any): Observable<ApiResponse<CreateUpdateResponse> | CreateUpdateResponse> {
    const endPointUrl = `${this.getApplicantUrl()}/${id}`;
    return this.httpClient.patch<ApiResponse<CreateUpdateResponse> | CreateUpdateResponse>(endPointUrl, generalUserInformation);
  }
  getApplicantRequestList(academicProgrammeId?: string, status?: number): Observable<ApplicantAcedamicRequestViewModel[]> {
    let endpointUrl = `${this.getApplicantUrl()}/request`;
    const queryParams = new URLSearchParams();
    if (academicProgrammeId) {
      queryParams.append('academicProgrammeId', academicProgrammeId);
    }
    if (status !== null && status !== undefined) {
      queryParams.append('status', status.toString());
    }
    const queryString = queryParams.toString();
    if (queryString) {
      endpointUrl += `?${queryString}`;
    }
    return this.httpClient
      .get(endpointUrl)
      .pipe(map(result => result as ApplicantAcedamicRequestViewModel[]));
  }

  applicantReviewerDecision(
    id: number,
    accedamicProgramRequest: any
  ): Observable<ApiResponse<ReviewerDecisionResponse> | ReviewerDecisionResponse> {
    const endPointUrl = `${this.getApplicantUrl()}/ReviewerDecision/${id}`;
    return this.httpClient.patch<ApiResponse<ReviewerDecisionResponse> | ReviewerDecisionResponse>(endPointUrl, accedamicProgramRequest);
  }

  getOrStoreParentApplicantId(userId: string): Observable<string | null> {
    if (!userId) {
      return throwError(() => new Error('User ID is required'));
    }
    const storedId = localStorage.getItem('parent_applicant_id');
    if (storedId) {
      this.parentApplicantIdSubject.next(storedId);
      return of(storedId);
    }
    const now = Date.now();
    if (now - this.lastFetchTime < this.FETCH_COOLDOWN) {
      const cachedValue = this.parentApplicantIdSubject.value;
      if (cachedValue) {
        return of(cachedValue);
      }
      if (this.isFetching) {
        return this.parentApplicantIdSubject.asObservable().pipe(
          filter((val): val is string => !!val),
          take(1)
        );
      }
    }
    if (this.isFetching) {
      return this.parentApplicantIdSubject.asObservable().pipe(
        filter((val): val is string => !!val),
        take(1)
      );
    }

    this.isFetching = true;
    this.lastFetchTime = now;

    const endpointUrl = `${this.getApplicantUrl()}/ByApplicantUserId/${userId}`;

    return this.httpClient
      .get<ApiResponse<ApplicantResponse> | ApplicantResponse>(endpointUrl)
      .pipe(
        map(res => {
          const applicantData = this.extractResponseData<ApplicantResponse>(res);
          if (!applicantData?.id) {
            // Don't throw an error for "no data found" - this is a valid state
            // Instead, return a special value that components can handle
            this.parentApplicantIdSubject.next(null);
            return null;
          }
          const applicantId = applicantData.id;
          localStorage.setItem('parent_applicant_id', applicantId);
          this.parentApplicantIdSubject.next(applicantId);
          return applicantId;
        }),
        catchError(error => {
          this.clearParentApplicantIdCache();
          
          let errorMessage = 'Unable to load applicant data. ';
          if (error.status === 404) {
            errorMessage += 'No applicant found for this user.';
          } else if (error.status === 0) {
            errorMessage += 'Network error: Unable to connect to the server.';
          } else if (error.status >= 500) {
            errorMessage += 'Server error: Please try again later.';
          } else if (error.status === 401) {
            errorMessage += 'Authentication failed: Please login again.';
          } else if (error.status === 403) {
            errorMessage += 'Access denied: You do not have permission to access this resource.';
          } else {
            errorMessage += error.message || 'Unknown error occurred.';
          }
          
          return throwError(() => new Error(errorMessage));
        }),
        finalize(() => {
          this.isFetching = false;
        })
      );
  }

  clearParentApplicantIdCache() {
    this.parentApplicantIdSubject.next(null);
    this.isFetching = false;
    localStorage.removeItem('parent_applicant_id');
  }

  clearCacheOnAuthChange(): void {
    this.clearParentApplicantIdCache();
  }

  isCacheValid(): boolean {
    const storedId = localStorage.getItem('parent_applicant_id');
    return !!storedId && !this.isFetching;
  }

  public clearCooldown(): void {
    this.lastFetchTime = 0;
    this.isFetching = false;
  }

  private extractResponseData<T>(res: any): T | null {
    if (res && typeof res === 'object') {
      if ('data' in res && res.data) return res.data;
      if ('id' in res) return res;
    }
    return null;
  }
  getIncompleteApplicants(): Observable<ApplicantIncompleteResponse[]> {
    let endpointUrl = `${this.getApplicantUrl()}/getIncompleteApplicants/request`;
    return this.httpClient
      .get(endpointUrl)
      .pipe(map(result => result as ApplicantIncompleteResponse[]));
  }
}
