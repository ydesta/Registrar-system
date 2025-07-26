import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { StaffModel } from 'src/app/Models/StaffModel';

export interface StaffResponse {
  status: string;
  data: any;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class StaffService {
  private baseUrl = environment.baseUrl;
  private staffEndpoint = '/staffs';

  constructor(private http: HttpClient) { }

  getAllStaff(): Observable<StaffResponse> {
    return this.http.get<StaffResponse>(`${this.baseUrl}${this.staffEndpoint}`);
  }

  getStaffById(id: string): Observable<StaffResponse> {
    return this.http.get<StaffResponse>(`${this.baseUrl}${this.staffEndpoint}/${id}`);
  }

  createStaff(staffData: StaffModel): Observable<StaffResponse> {
    return this.http.post<StaffResponse>(`${this.baseUrl}${this.staffEndpoint}`, staffData);
  }

  updateStaff(id: string, staffData: StaffModel): Observable<StaffResponse> {
    return this.http.patch<StaffResponse>(`${this.baseUrl}${this.staffEndpoint}/${id}`, staffData);
  }

  deleteStaff(id: string): Observable<StaffResponse> {
    return this.http.delete<StaffResponse>(`${this.baseUrl}${this.staffEndpoint}/${id}`);
  }

  searchStaff(criteria: any): Observable<StaffResponse> {
    return this.http.post<StaffResponse>(`${this.baseUrl}${this.staffEndpoint}/search`, criteria);
  }

  getStaffByUserId(userId: string): Observable<StaffResponse> {
    return this.http.get<StaffResponse>(`${this.baseUrl}${this.staffEndpoint}/getStaffByUserId/${userId}`);
  }

 
  exportStaffData(format: 'csv' | 'excel' | 'pdf' = 'csv'): Observable<Blob> {
    return this.http.get(`${this.baseUrl}${this.staffEndpoint}/export/${format}`, {
      responseType: 'blob'
    });
  }

} 