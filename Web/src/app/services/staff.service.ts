import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { StaffModel } from 'src/app/Models/StaffModel';
import { CrudService } from 'src/app/services/crud.service';

export interface StaffResponse {
  status: string;
  data: any;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class StaffService {
  private readonly staff = `/${environment.apiVersion}/staff`;

  constructor(private crud: CrudService) { }

  getAllStaff(): Observable<StaffResponse> {
    return this.crud.getList<StaffResponse>(this.staff);
  }

  getStaffsPaginated(query: string): Observable<any> {
    return this.crud.getPaginated(this.staff, query);
  }

  getStaffById(id: string): Observable<StaffResponse> {
    return this.crud.getById<StaffResponse>(this.staff, id);
  }

  createStaff(staffData: StaffModel): Observable<StaffResponse> {
    return this.crud.add<StaffResponse>(this.staff, staffData);
  }

  updateStaff(id: string, staffData: StaffModel): Observable<StaffResponse> {
    return this.crud.update<StaffResponse>(this.staff, id, staffData);
  }

  deleteStaff(id: string): Observable<StaffResponse> {
    return this.crud.delete<StaffResponse>(this.staff, id);
  }

  searchStaff(criteria: any): Observable<StaffResponse> {
    return this.crud.add<StaffResponse>(`${this.staff}/search`, criteria);
  }

  getStaffByUserId(userId: string): Observable<StaffResponse> {
    return this.crud.getList<StaffResponse>(`${this.staff}/getStaffByUserId/${userId}`);
  }

  exportStaffData(format: 'csv' | 'excel' | 'pdf' = 'csv'): Observable<Blob> {
    return this.crud.getBlob(`${this.staff}/export/${format}`);
  }
}
