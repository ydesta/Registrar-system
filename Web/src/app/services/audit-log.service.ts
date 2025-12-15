import { HttpClient, HttpParams } from '@angular/common/http';
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

@Injectable({
  providedIn: 'root'
})
export class AuditLogService {
  baseUrl = environment.baseUrl;
  private readonly _auditLogUrl: string = `/${environment.apiVersion}/audit`;

  getAuditLogUrl(): string {
    return this.baseUrl + this._auditLogUrl;
  }

  constructor(private httpClient: HttpClient) { }

  /**
   * Get suspicious activity by IP address
   */
  getSuspiciousActivityByIp(ipAddress: string, startDate?: Date, endDate?: Date): Observable<BaseModel<SuspiciousActivityViewModel[]>> {
    const endpointUrl = `${this.getAuditLogUrl()}/suspicious/by-ip/${ipAddress}`;
    let params = new HttpParams();
    
    if (startDate) {
      params = params.append('startDate', startDate.toISOString());
    }
    if (endDate) {
      params = params.append('endDate', endDate.toISOString());
    }
    
    return this.httpClient.get<BaseModel<SuspiciousActivityViewModel[]>>(endpointUrl, { params });
  }

  /**
   * Get suspicious activity by user ID
   */
  getSuspiciousActivityByUser(userId: string, startDate?: Date, endDate?: Date): Observable<BaseModel<SuspiciousActivityViewModel[]>> {
    const endpointUrl = `${this.getAuditLogUrl()}/suspicious/by-user/${userId}`;
    let params = new HttpParams();
    
    if (startDate) {
      params = params.append('startDate', startDate.toISOString());
    }
    if (endDate) {
      params = params.append('endDate', endDate.toISOString());
    }
    
    return this.httpClient.get<BaseModel<SuspiciousActivityViewModel[]>>(endpointUrl, { params });
  }

  /**
   * Get suspicious activity details with filtering
   */
  getSuspiciousActivityDetails(filterParams: SuspiciousActivityFilterParams): Observable<BaseModel<SuspiciousActivityDetailViewModel[]>> {
    const endpointUrl = `${this.getAuditLogUrl()}/suspicious/details`;
    let params = new HttpParams();
    
    if (filterParams.ipAddress) {
      params = params.append('ipAddress', filterParams.ipAddress);
    }
    if (filterParams.userId) {
      params = params.append('userId', filterParams.userId);
    }
    if (filterParams.startDate) {
      params = params.append('startDate', filterParams.startDate.toISOString());
    }
    if (filterParams.endDate) {
      params = params.append('endDate', filterParams.endDate.toISOString());
    }
    if (filterParams.pageIndex !== undefined) {
      params = params.append('pageIndex', filterParams.pageIndex.toString());
    }
    if (filterParams.pageSize !== undefined) {
      params = params.append('pageSize', filterParams.pageSize.toString());
    }
    
    return this.httpClient.get<BaseModel<SuspiciousActivityDetailViewModel[]>>(endpointUrl, { params });
  }

  /**
   * Get suspicious activity statistics
   */
  getSuspiciousActivityStatistics(startDate?: Date, endDate?: Date): Observable<BaseModel<SuspiciousActivityStatisticsViewModel>> {
    const endpointUrl = `${this.getAuditLogUrl()}/suspicious/statistics`;
    let params = new HttpParams();
    
    if (startDate) {
      params = params.append('startDate', startDate.toISOString());
    }
    if (endDate) {
      params = params.append('endDate', endDate.toISOString());
    }
    
    return this.httpClient.get<BaseModel<SuspiciousActivityStatisticsViewModel>>(endpointUrl, { params });
  }

  /**
   * Get IP risk assessment
   */
  getIpRiskAssessment(ipAddress: string, startDate?: Date, endDate?: Date): Observable<BaseModel<IpRiskAssessmentViewModel>> {
    const endpointUrl = `${this.getAuditLogUrl()}/risk-assessment/ip/${ipAddress}`;
    let params = new HttpParams();
    
    if (startDate) {
      params = params.append('startDate', startDate.toISOString());
    }
    if (endDate) {
      params = params.append('endDate', endDate.toISOString());
    }
    
    return this.httpClient.get<BaseModel<IpRiskAssessmentViewModel>>(endpointUrl, { params });
  }

  /**
   * Get user risk assessment
   */
  getUserRiskAssessment(userId: string, startDate?: Date, endDate?: Date): Observable<BaseModel<UserRiskAssessmentViewModel>> {
    const endpointUrl = `${this.getAuditLogUrl()}/risk-assessment/user/${userId}`;
    let params = new HttpParams();
    
    if (startDate) {
      params = params.append('startDate', startDate.toISOString());
    }
    if (endDate) {
      params = params.append('endDate', endDate.toISOString());
    }
    
    return this.httpClient.get<BaseModel<UserRiskAssessmentViewModel>>(endpointUrl, { params });
  }

  /**
   * Get top risky IPs
   */
  getTopRiskyIPs(topCount: number = 10, startDate?: Date, endDate?: Date): Observable<BaseModel<IpRiskAssessmentViewModel[]>> {
    const endpointUrl = `${this.getAuditLogUrl()}/risk-assessment/top-ips/${topCount}`;
    let params = new HttpParams();
    
    if (startDate) {
      params = params.append('startDate', startDate.toISOString());
    }
    if (endDate) {
      params = params.append('endDate', endDate.toISOString());
    }
    
    return this.httpClient.get<BaseModel<IpRiskAssessmentViewModel[]>>(endpointUrl, { params });
  }

  /**
   * Get top risky users
   */
  getTopRiskyUsers(topCount: number = 10, startDate?: Date, endDate?: Date): Observable<BaseModel<UserRiskAssessmentViewModel[]>> {
    const endpointUrl = `${this.getAuditLogUrl()}/risk-assessment/top-users/${topCount}`;
    let params = new HttpParams();
    
    if (startDate) {
      params = params.append('startDate', startDate.toISOString());
    }
    if (endDate) {
      params = params.append('endDate', endDate.toISOString());
    }
    
    return this.httpClient.get<BaseModel<UserRiskAssessmentViewModel[]>>(endpointUrl, { params });
  }

  /**
   * Get IPs with repeated failures
   */
  getIpsWithRepeatedFailures(minFailures: number = 5, startDate?: Date, endDate?: Date): Observable<BaseModel<string[]>> {
    const endpointUrl = `${this.getAuditLogUrl()}/suspicious/ips-repeated-failures`;
    let params = new HttpParams().append('minFailures', minFailures.toString());
    
    if (startDate) {
      params = params.append('startDate', startDate.toISOString());
    }
    if (endDate) {
      params = params.append('endDate', endDate.toISOString());
    }
    
    return this.httpClient.get<BaseModel<string[]>>(endpointUrl, { params });
  }

  /**
   * Get users with repeated failures
   */
  getUsersWithRepeatedFailures(minFailures: number = 5, startDate?: Date, endDate?: Date): Observable<BaseModel<string[]>> {
    const endpointUrl = `${this.getAuditLogUrl()}/suspicious/users-repeated-failures`;
    let params = new HttpParams().append('minFailures', minFailures.toString());
    
    if (startDate) {
      params = params.append('startDate', startDate.toISOString());
    }
    if (endDate) {
      params = params.append('endDate', endDate.toISOString());
    }
    
    return this.httpClient.get<BaseModel<string[]>>(endpointUrl, { params });
  }

  /**
   * Get IPs with high request rate
   */
  getIpsWithHighRequestRate(minRequestsPerMinute: number = 30, startDate?: Date, endDate?: Date): Observable<BaseModel<string[]>> {
    const endpointUrl = `${this.getAuditLogUrl()}/suspicious/ips-high-rate`;
    let params = new HttpParams().append('minRequestsPerMinute', minRequestsPerMinute.toString());
    
    if (startDate) {
      params = params.append('startDate', startDate.toISOString());
    }
    if (endDate) {
      params = params.append('endDate', endDate.toISOString());
    }
    
    return this.httpClient.get<BaseModel<string[]>>(endpointUrl, { params });
  }
}