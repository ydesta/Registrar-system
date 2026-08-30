import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { InstructorSectionRequest } from '../Models/InstructorSectionModel';
import { ResponseDtos } from '../admission-request/model/response-dtos.model';
import { StaffTeachingDataViewModel } from '../Models/StaffTeachingDataViewModel';
import { CrudService } from 'src/app/services/crud.service';

@Injectable({
  providedIn: 'root'
})
export class InstructorSectionService {
  private readonly sections = `/${environment.apiVersion}/instructorsections`;

  constructor(private crud: CrudService) {}

  getInstructorSections(): Observable<any> {
    return this.crud.getList(this.sections);
  }

  getInstructorSectionsByCriteria(academicTerm: number, year: number, batchId: string): Observable<ResponseDtos> {
    return this.crud.getList<ResponseDtos>(`${this.sections}/${academicTerm}/${year}/${batchId}`);
  }

  getInstructorSectionsByCriteriaPaginated(
    academicTerm: number,
    year: number,
    batchId: string,
    query: string
  ): Observable<any> {
    return this.crud.getPaginated(`${this.sections}/${academicTerm}/${year}/${batchId}`, query);
  }

  getInstructorSectionById(id: number): Observable<any> {
    return this.crud.getById(this.sections, id);
  }

  createInstructorSection(instructorSection: InstructorSectionRequest): Observable<any> {
    return this.crud.add(this.sections, instructorSection);
  }

  updateInstructorSection(id: number, instructorSection: InstructorSectionRequest): Observable<any> {
    return this.crud.update(this.sections, id, instructorSection);
  }

  deleteInstructorSection(id: number): Observable<any> {
    return this.crud.delete(this.sections, id);
  }

  getStaffTeachingDataAsync(
    staffId: string,
    academicTerm: number,
    year: number,
    sectionType: number
  ): Observable<StaffTeachingDataViewModel> {
    return this.crud.getList<StaffTeachingDataViewModel>(
      `${this.sections}/${staffId}/${academicTerm}/${year}/${sectionType}`
    );
  }

  getInstructorSectionAssignmentsByStaff(
    staffId: string,
    academicTerm: number,
    year: number,
    sectionType: number
  ): Observable<ResponseDtos> {
    return this.crud.getList<ResponseDtos>(
      `${this.sections}/staff/${staffId}/${academicTerm}/${year}/${sectionType}/assignments`
    );
  }
}
