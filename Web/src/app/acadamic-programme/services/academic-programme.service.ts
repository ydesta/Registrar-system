import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, map } from "rxjs";
import { environment } from "src/environments/environment";

@Injectable({
  providedIn: "root"
})
export class AcademicProgrammeService {
  baseUrl = environment.baseUrl;
  private readonly _academicProgramm: string = "/AcadamicProgramme";
  getAcademicProgrammeUrl() {
    return this.baseUrl + this._academicProgramm;
  }
  constructor(private httpClient: HttpClient) {}

  getAcademicProgrammeList(): Observable<any> {
    const endpointUrl = `${this.getAcademicProgrammeUrl()}`;
    return this.httpClient
      .get(endpointUrl)
      .pipe(map(result => result as any[]));
  }
}
