import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { CrudService } from 'src/app/services/crud.service';
import {
  ApplyGradeRecordCorrectionRequest,
  GradeRecordCorrectionSheet
} from '../models/grade-record-correction.model';

@Injectable({ providedIn: 'root' })
export class GradeRecordCorrectionService {
  private readonly base = `/${environment.apiVersion}/graderecordcorrections`;

  constructor(private crud: CrudService) {}

  getSheet(studentCode: string): Observable<GradeRecordCorrectionSheet> {
    return this.crud.getList(`${this.base}/student/${encodeURIComponent(studentCode)}`);
  }

  apply(request: ApplyGradeRecordCorrectionRequest, gradeActionToken?: string): Observable<any> {
    const headers = gradeActionToken ? { 'X-Grade-Action-Token': gradeActionToken } : undefined;
    return this.crud.add(this.base, request, undefined, headers);
  }
}
