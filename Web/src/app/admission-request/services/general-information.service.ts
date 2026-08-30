import { Injectable } from '@angular/core';
import { Observable, of, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, finalize, map, take } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { ApplicantAcedamicRequestViewModel, ApplicantIncompleteResponse } from '../model/applicant-acedamic-request-view-model.model';
import { CrudService } from 'src/app/services/crud.service';

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
  providedIn: 'root'
})
export class GeneralInformationService {
  private readonly applicants = `/${environment.apiVersion}/applicant`;
  private parentApplicantIdSubject = new BehaviorSubject<string | null>(null);
  private isFetching = false;
  private lastFetchTime = 0;
  private readonly FETCH_COOLDOWN = 5000;

  constructor(private crud: CrudService) { }

  createGeneralInformation(
    generalUserInformation: any
  ): Observable<ApiResponse<CreateUpdateResponse> | CreateUpdateResponse> {
    return this.crud.add<ApiResponse<CreateUpdateResponse> | CreateUpdateResponse>(
      this.applicants,
      generalUserInformation
    );
  }

  getApplicantByUserId(id: string): Observable<ApiResponse<ApplicantResponse> | ApplicantResponse> {
    return this.crud.getList<ApiResponse<ApplicantResponse> | ApplicantResponse>(
      `${this.applicants}/ByApplicantUserId/${id}`
    );
  }

  getApplicantById(id: string): Observable<ApiResponse<ApplicantResponse> | ApplicantResponse> {
    return this.crud.getById<ApiResponse<ApplicantResponse> | ApplicantResponse>(this.applicants, id);
  }

  finalSubmit(id: string, finalRequest: any): Observable<ApiResponse<CreateUpdateResponse> | CreateUpdateResponse> {
    return this.crud.update<ApiResponse<CreateUpdateResponse> | CreateUpdateResponse>(
      `${this.applicants}/RequestApplicant`,
      id,
      finalRequest
    );
  }

  updateApplicant(
    id: string,
    generalUserInformation: any
  ): Observable<ApiResponse<CreateUpdateResponse> | CreateUpdateResponse> {
    return this.crud.update<ApiResponse<CreateUpdateResponse> | CreateUpdateResponse>(
      this.applicants,
      id,
      generalUserInformation
    );
  }

  getApplicantRequestList(academicProgrammeId?: string, status?: number): Observable<ApplicantAcedamicRequestViewModel[]> {
    return this.crud.getList<ApplicantAcedamicRequestViewModel[]>(`${this.applicants}/request`, {
      academicProgrammeId,
      status
    });
  }

  getApplicantRequestListPaginated(query: string): Observable<any> {
    return this.crud.getPaginated(`${this.applicants}/request`, query);
  }

  applicantReviewerDecision(
    id: number,
    accedamicProgramRequest: any
  ): Observable<ApiResponse<ReviewerDecisionResponse> | ReviewerDecisionResponse> {
    return this.crud.update<ApiResponse<ReviewerDecisionResponse> | ReviewerDecisionResponse>(
      `${this.applicants}/ReviewerDecision`,
      id,
      accedamicProgramRequest
    );
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

    return this.crud.getList<ApiResponse<ApplicantResponse> | ApplicantResponse>(
      `${this.applicants}/ByApplicantUserId/${userId}`
    ).pipe(
      map(res => {
        const applicantData = this.extractResponseData<ApplicantResponse>(res);
        if (!applicantData?.id) {
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
    return this.crud.getList<ApplicantIncompleteResponse[]>(`${this.applicants}/getIncompleteApplicants/request`);
  }

  getIncompleteApplicantsPaginated(query: string): Observable<any> {
    return this.crud.getPaginated(`${this.applicants}/getIncompleteApplicants/request`, query);
  }
}
