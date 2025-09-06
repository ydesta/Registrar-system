import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, map, of, shareReplay, catchError, throwError, BehaviorSubject, finalize, filter, take } from "rxjs";
import { environment } from "src/environments/environment";
import { ApplicationRequest } from "../model/application-request.model";
import { ApplicantAcedamicRequestViewModel } from "../model/applicant-acedamic-request-view-model.model";

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
  private readonly _generalUserInformation: string = "/Applicants";
  private parentApplicantIdSubject = new BehaviorSubject<string | null>(null);
  private isFetching = false;
  private lastFetchTime = 0;
  private readonly FETCH_COOLDOWN = 5000; // 5 seconds cooldown between attempts

  getApplicantUrl() {
    return this.baseUrl + this._generalUserInformation;
  }

  constructor(private httpClient: HttpClient) {}

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
  getApplicantRequestList(): Observable<ApplicantAcedamicRequestViewModel[]> {
    const endpointUrl = `${this.getApplicantUrl()}/request`;
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

  getOrStoreParentApplicantId(userId: string): Observable<string> {
  if (!userId) {
    console.error('No userId provided to getOrStoreParentApplicantId');
    return throwError(() => new Error('User ID is required'));
  }

  // ✅ Use cached/localStorage value if available
  const storedId = localStorage.getItem('parent_applicant_id');
  if (storedId) {
    console.log('Using stored applicant ID from localStorage:', storedId);
    this.parentApplicantIdSubject.next(storedId);
    return of(storedId);
  }

  // ✅ Respect cooldown
  const now = Date.now();
  if (now - this.lastFetchTime < this.FETCH_COOLDOWN) {
    console.log('Fetch cooldown active, returning cached value or error');
    const cachedValue = this.parentApplicantIdSubject.value;
    if (cachedValue) {
      console.log('Returning cached applicant ID:', cachedValue);
      return of(cachedValue);
    }
    // If no cached value and still in cooldown, wait for the ongoing fetch
    if (this.isFetching) {
      console.log('Already fetching, returning subject observable');
      return this.parentApplicantIdSubject.asObservable().pipe(
        filter((val): val is string => !!val),
        take(1)
      );
    }
    // If no cached value and not fetching, allow the fetch to proceed
    console.log('No cached value, allowing fetch to proceed despite cooldown');
  }

  // ✅ If already fetching, subscribe to subject
  if (this.isFetching) {
    console.log('Already fetching applicant ID, returning subject observable');
    return this.parentApplicantIdSubject.asObservable().pipe(
      filter((val): val is string => !!val), // ignore null emissions
      take(1) // only take the first successful value
    );
  }

  // ✅ Start API fetch
  console.log('Fetching applicant ID from API...');
  this.isFetching = true;
  this.lastFetchTime = now;

  const endpointUrl = `${this.getApplicantUrl()}/ByApplicantUserId/${userId}`;
  console.log('API endpoint:', endpointUrl);

  return this.httpClient
    .get<ApiResponse<ApplicantResponse> | ApplicantResponse>(endpointUrl)
    .pipe(
      map(res => {
        const applicantData = this.extractResponseData<ApplicantResponse>(res);

        if (!applicantData?.id) {
          console.error('Invalid or missing applicant data:', res);
        //  throw new Error('Applicant not found or invalid response structure');
        }

        const applicantId = applicantData.id;
        console.log('Applicant ID found:', applicantId);

        // ✅ Save in cache + subject
        localStorage.setItem('parent_applicant_id', applicantId);
        this.parentApplicantIdSubject.next(applicantId);
        return applicantId;
      }),
      catchError(error => {
        console.error('Error fetching applicant ID:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          url: endpointUrl
        });

        this.clearParentApplicantIdCache();

        // ✅ Centralized error mapping
        if (error.status === 404) {
        //  return throwError(() => new Error('Applicant not found'));
        }
        if (error.status === 0) {
         // return throwError(() => new Error('Network error'));
        }
        if (error.status >= 500) {
        //  return throwError(() => new Error('Server error'));
        }
        return throwError(() => new Error(error.message || 'Unknown error'));
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

// Add method to clear cache on authentication changes
clearCacheOnAuthChange(): void {
  console.log('Clearing applicant ID cache due to authentication change');
  this.clearParentApplicantIdCache();
}

// Add method to check if cache is valid
isCacheValid(): boolean {
  const storedId = localStorage.getItem('parent_applicant_id');
  return !!storedId && !this.isFetching;
}

// Method to clear cooldown (useful for testing or manual refresh)
public clearCooldown(): void {
  this.lastFetchTime = 0;
  this.isFetching = false;
  console.log('Cooldown cleared');
}

// ✅ Helper remains unchanged
private extractResponseData<T>(res: any): T | null {
  if (res && typeof res === 'object') {
    if ('data' in res && res.data) return res.data;
    if ('id' in res) return res;
  }
  return null;
}

}
