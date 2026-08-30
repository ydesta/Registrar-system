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

  uploadGrades(formData: FormData): Observable<any> {
    return this.crud.add(`${this.grades}/uploadGrade`, formData);
  }

  getStudentInformationWithInstructor(userId: string, studentId: string): Observable<StudentInformationView> {
    return this.crud.getList<StudentInformationView>(
      `${this.grades}/getStudentInformationWithInstructor/${userId}/${studentId}`
    );
  }
}
