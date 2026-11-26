import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { StudentGradeViewModel } from 'src/app/Models/StudentGradeViewModel';
import { BaseModel } from 'src/app/Models/BaseMode';
import { environment } from 'src/environments/environment';
import { StudentInformationView } from '../models/student-information-view .model';
import { CrudService } from 'src/app/services/crud.service';

@Injectable({
  providedIn: 'root'
})
export class StudentGradeService {
  private readonly grades = `/${environment.apiVersion}/grade`;

  constructor(private crud: CrudService) { }

  getStudentGrades(userId: string): Observable<StudentGradeViewModel[]> {
    return this.crud.getList<BaseModel<StudentGradeViewModel[]>>(`${this.grades}/getStudentGrades/${userId}`)
      .pipe(map(response => response.data || []));
  }

  getStudentGradesPaginated(userId: string, query: string): Observable<any> {
    return this.crud.getPaginated(`${this.grades}/getStudentGrades/${userId}`, query);
  }

  getStudentGradesByQuery(queryParams: any): Observable<StudentGradeViewModel[]> {
    return this.crud.add<BaseModel<StudentGradeViewModel[]>>(`${this.grades}/report`, queryParams)
      .pipe(map(response => response.data || []));
  }

  uploadGrades(formData: FormData, gradeActionToken?: string): Observable<any> {
    const headers = gradeActionToken ? { 'X-Grade-Action-Token': gradeActionToken } : undefined;
    return this.crud.add(`${this.grades}/uploadGrade`, formData, undefined, headers);
  }

  addGrade(payload: any, gradeActionToken?: string): Observable<any> {
    const headers = gradeActionToken ? { 'X-Grade-Action-Token': gradeActionToken } : undefined;
    return this.crud.add(this.grades, payload, undefined, headers);
  }

  updateGrade(id: string, payload: any, gradeActionToken?: string): Observable<any> {
    const headers = gradeActionToken ? { 'X-Grade-Action-Token': gradeActionToken } : undefined;
    return this.crud.update(this.grades, id, payload, headers);
  }

  deleteGrade(id: string, gradeActionToken?: string): Observable<any> {
    const headers = gradeActionToken ? { 'X-Grade-Action-Token': gradeActionToken } : undefined;
    return this.crud.delete(this.grades, id, headers);
  }

  getStudentInformationWithInstructor(userId: string, studentId: string): Observable<StudentInformationView> {
    return this.crud.getList<StudentInformationView>(
      `${this.grades}/getStudentInformationWithInstructor/${userId}/${studentId}`
    );
  }

  backfillProtectedGradeFields(
    batchSize = 500,
    untilDone = false
  ): Observable<{ updated: number; message?: string }> {
    return this.crud.add<{ updated: number; message?: string }>(
      `${this.grades}/encryption/backfill`,
      {},
      { batchSize, untilDone }
    );
  }

  getGradeSubmissions(query?: {
    batchCode?: string;
    courseId?: string;
    academicTermId?: number | null;
    staffId?: string;
    year?: number | null;
  }): Observable<any[]> {
    return this.crud.getList<any[]>(`${this.grades}/submissions`, query || {});
  }

  getGradeSubmissionDetail(query: {
    courseId: string;
    academicTermId: number;
    staffId: string;
    batchCode?: string;
  }): Observable<any> {
    return this.crud.getList<any>(`${this.grades}/submissions/detail`, query);
  }
}
