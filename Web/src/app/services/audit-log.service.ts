import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { BaseModel } from '../Models/BaseMode';
import {
  SuspiciousActivityViewModel,
  SuspiciousActivityDetailViewModel,
  SuspiciousActivityStatisticsViewModel,
  IpRiskAssessmentViewModel,
  UserRiskAssessmentViewModel,
  SuspiciousActivityFilterParams
} from '../Models/SuspiciousActivityModels';
import { CrudService, QueryValue } from 'src/app/services/crud.service';

@Injectable({
  providedIn: 'root'
})
export class AuditLogService {
  private readonly audit = `/${environment.apiVersion}/audit`;

  constructor(private crud: CrudService) { }

  getSuspiciousActivityByIp(
    ipAddress: string,
    startDate?: Date,
    endDate?: Date
  ): Observable<BaseModel<SuspiciousActivityViewModel[]>> {
    return this.crud.getList<BaseModel<SuspiciousActivityViewModel[]>>(
      `${this.audit}/suspicious/by-ip/${ipAddress}`,
      this.dateQuery(startDate, endDate)
    );
  }

  getSuspiciousActivityByUser(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Observable<BaseModel<SuspiciousActivityViewModel[]>> {
    return this.crud.getList<BaseModel<SuspiciousActivityViewModel[]>>(
      `${this.audit}/suspicious/by-user/${userId}`,
      this.dateQuery(startDate, endDate)
    );
  }

  getSuspiciousActivityDetails(
    filterParams: SuspiciousActivityFilterParams
  ): Observable<BaseModel<SuspiciousActivityDetailViewModel[]>> {
    return this.crud.getList<BaseModel<SuspiciousActivityDetailViewModel[]>>(
      `${this.audit}/suspicious/details`,
      this.dateQuery(filterParams.startDate, filterParams.endDate, {
        ipAddress: filterParams.ipAddress,
        userId: filterParams.userId,
        pageIndex: filterParams.pageIndex,
        pageSize: filterParams.pageSize
      })
    );
  }

  getSuspiciousActivityDetailsPaginated(query: string): Observable<any> {
    return this.crud.getList(`${this.audit}/suspicious/details`, query);
  }

  getSuspiciousActivityStatistics(
    startDate?: Date,
    endDate?: Date
  ): Observable<BaseModel<SuspiciousActivityStatisticsViewModel>> {
    return this.crud.getList<BaseModel<SuspiciousActivityStatisticsViewModel>>(
      `${this.audit}/suspicious/statistics`,
      this.dateQuery(startDate, endDate)
    );
  }

  getIpRiskAssessment(
    ipAddress: string,
    startDate?: Date,
    endDate?: Date
  ): Observable<BaseModel<IpRiskAssessmentViewModel>> {
    return this.crud.getList<BaseModel<IpRiskAssessmentViewModel>>(
      `${this.audit}/risk-assessment/ip/${ipAddress}`,
      this.dateQuery(startDate, endDate)
    );
  }

  getUserRiskAssessment(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Observable<BaseModel<UserRiskAssessmentViewModel>> {
    return this.crud.getList<BaseModel<UserRiskAssessmentViewModel>>(
      `${this.audit}/risk-assessment/user/${userId}`,
      this.dateQuery(startDate, endDate)
    );
  }

  getTopRiskyIPs(
    topCount: number = 10,
    startDate?: Date,
    endDate?: Date
  ): Observable<BaseModel<IpRiskAssessmentViewModel[]>> {
    return this.crud.getList<BaseModel<IpRiskAssessmentViewModel[]>>(
      `${this.audit}/risk-assessment/top-ips/${topCount}`,
      this.dateQuery(startDate, endDate)
    );
  }

  getTopRiskyUsers(
    topCount: number = 10,
    startDate?: Date,
    endDate?: Date
  ): Observable<BaseModel<UserRiskAssessmentViewModel[]>> {
    return this.crud.getList<BaseModel<UserRiskAssessmentViewModel[]>>(
      `${this.audit}/risk-assessment/top-users/${topCount}`,
      this.dateQuery(startDate, endDate)
    );
  }

  getIpsWithRepeatedFailures(
    minFailures: number = 5,
    startDate?: Date,
    endDate?: Date
  ): Observable<BaseModel<string[]>> {
    return this.crud.getList<BaseModel<string[]>>(
      `${this.audit}/suspicious/ips-repeated-failures`,
      this.dateQuery(startDate, endDate, { minFailures })
    );
  }

  getUsersWithRepeatedFailures(
    minFailures: number = 5,
    startDate?: Date,
    endDate?: Date
  ): Observable<BaseModel<string[]>> {
    return this.crud.getList<BaseModel<string[]>>(
      `${this.audit}/suspicious/users-repeated-failures`,
      this.dateQuery(startDate, endDate, { minFailures })
    );
  }

  getIpsWithHighRequestRate(
    minRequestsPerMinute: number = 30,
    startDate?: Date,
    endDate?: Date
  ): Observable<BaseModel<string[]>> {
    return this.crud.getList<BaseModel<string[]>>(
      `${this.audit}/suspicious/ips-high-rate`,
      this.dateQuery(startDate, endDate, { minRequestsPerMinute })
    );
  }

  private dateQuery(
    startDate?: Date,
    endDate?: Date,
    extra?: Record<string, QueryValue>
  ): Record<string, QueryValue> {
    return {
      ...extra,
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString()
    };
  }
}
