import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, map } from "rxjs";
import { environment } from "src/environments/environment";

@Injectable({
  providedIn: "root"
})
export class FileService {
  baseUrl = environment.baseUrl;
  private readonly _fileUrl: string = "/Files";
  getFileUrl() {
    return this.baseUrl + this._fileUrl;
  }
  constructor(private httpClient: HttpClient) {}
  getFileById(id: string): Observable<any> {
    const endpointUrl = `${this.getFileUrl()}/${id}`;
    return this.httpClient.get(endpointUrl).pipe(map(result => result as any));
  }
}
