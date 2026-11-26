import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { GradeChangeRequest } from '../Models/GradeChangeRequest';
import { ChangeRequestViewModel, GradeChangeRequestViewModel } from '../Models/GradeChangeRequestViewModel';
import { CrudService } from 'src/app/services/crud.service';

@Injectable({
  providedIn: 'root'
})
export class GradeChangeRequestService {
  private readonly gradeChanges = `/${environment.apiVersion}/gradechangerequests`;

  constructor(private crud: CrudService) { }

  getAllPendingGradeChangeRequestForApproval(): Observable<GradeChangeRequestViewModel[]> {
    return this.crud.getList<GradeChangeRequestViewModel[]>(this.gradeChanges);
  }

  getAllPendingGradeChangeRequestForApprovalPaginated(query: string): Observable<any> {
    return this.crud.getPaginated(this.gradeChanges, query);
  }

  getGradeChangeRequestById(id: number): Observable<GradeChangeRequest> {
    return this.crud.getById<GradeChangeRequest>(this.gradeChanges, id);
  }

  getGradeChangeRequestByStaffId(staffId: string): Observable<GradeChangeRequestViewModel[]> {
    return this.crud.getList<GradeChangeRequestViewModel[]>(`${this.gradeChanges}/staff/${staffId}`);
  }

  getGradeChangeRequestByStaffIdPaginated(staffId: string, query: string): Observable<any> {
    return this.crud.getPaginated(`${this.gradeChanges}/staff/${staffId}`, query);
  }

  createGradeChange(gradeChange: GradeChangeRequest): Observable<GradeChangeRequest> {
    return this.crud.add<GradeChangeRequest>(this.gradeChanges, gradeChange);
  }

  updateGradeChange(id: number, gradeChange: GradeChangeRequest): Observable<GradeChangeRequest> {
    return this.crud.put<GradeChangeRequest>(`${this.gradeChanges}/${id}`, gradeChange);
  }

  deleteGradeChange(id: string): Observable<any> {
    return this.crud.delete(this.gradeChanges, id);
  }

  reviewGradeChangeRequest(id: number, changeRequest: ChangeRequestViewModel, gradeActionToken?: string): Observable<boolean> {
    const headers = gradeActionToken ? { 'X-Grade-Action-Token': gradeActionToken } : undefined;
    return this.crud.put<boolean>(`${this.gradeChanges}/review/${id}`, changeRequest, headers);
  }
}
