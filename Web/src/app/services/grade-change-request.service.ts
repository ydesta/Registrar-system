import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { GradeChangeRequest } from '../Models/GradeChangeRequest';
import { Observable } from 'rxjs';
import { ChangeRequestViewModel, GradeChangeRequestViewModel } from '../Models/GradeChangeRequestViewModel';

@Injectable({
  providedIn: 'root'
})
export class GradeChangeRequestService {
  private apiUrl = `${environment.baseUrl}/GradeChangeRequests`;

  constructor(private http: HttpClient) { }

  getAllPendingGradeChangeRequestForApproval(): Observable<GradeChangeRequestViewModel[]> {
    return this.http.get<GradeChangeRequestViewModel[]>(this.apiUrl);
  }

  getGradeChangeRequestById(id: number): Observable<GradeChangeRequest> {
    return this.http.get<GradeChangeRequest>(`${this.apiUrl}/${id}`);
  }
  getGradeChangeRequestByStaffId(staffId: string): Observable<GradeChangeRequestViewModel[]> {
    return this.http.get<GradeChangeRequestViewModel[]>(`${this.apiUrl}/staff/${staffId}`);
  }

  createGradeChange(gradeChange: GradeChangeRequest): Observable<GradeChangeRequest> {
    return this.http.post<GradeChangeRequest>(this.apiUrl, gradeChange);
  }

  updateGradeChange(id: number, gradeChange: GradeChangeRequest): Observable<GradeChangeRequest> {
    return this.http.put<GradeChangeRequest>(`${this.apiUrl}/${id}`, gradeChange);
  }

  deleteGradeChange(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
  reviewGradeChangeRequest(id: number, changeRequest: ChangeRequestViewModel): Observable<boolean> {
    return this.http.put<boolean>(
      `${this.apiUrl}/review/${id}`,
      changeRequest
    );
  }


}
