import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { StudentGradeViewModel } from 'src/app/Models/StudentGradeViewModel';
import { BaseModel } from 'src/app/Models/BaseMode';
import { environment } from 'src/environments/environment';
import { StudentInformationView } from '../models/student-information-view .model';

@Injectable({
  providedIn: 'root'
})
export class StudentGradeService {
  private apiUrl = environment.baseUrl;

  constructor(private http: HttpClient) { }

 
  getStudentGrades(userId: string): Observable<StudentGradeViewModel[]> {
    return this.http.get<BaseModel<StudentGradeViewModel[]>>(`${this.apiUrl}/StudentGrades/getStudentGrades/${userId}`)
      .pipe(
        map(response => response.data || [])
      );
  }

 
  getStudentGradesByQuery(queryParams: any): Observable<StudentGradeViewModel[]> {
    return this.http.post<BaseModel<StudentGradeViewModel[]>>(`${this.apiUrl}/StudentGrades/report`, queryParams)
      .pipe(
        map(response => response.data || [])
      );
  }

  
  uploadGrades(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/StudentGrades/uploadGrade`, formData);
  }
  getStudentInformationWithInstructor(userId: string,studentId:string): Observable<StudentInformationView> {
    const endpointUrl = `${this.apiUrl}/getStudentInformationWithInstructor/${userId}/${studentId}`;
    return this.http.get<StudentInformationView>(endpointUrl).pipe(
      catchError((error) => {
        console.error('Error occurred while fetching student information with instructor:', error);
        return throwError(() => new Error(error.message || 'Error fetching student information with instructor'));
      })
    );
  }
}
