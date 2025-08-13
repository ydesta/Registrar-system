import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "src/environments/environment";

@Injectable({
  providedIn: "root"
})
export class FilesService {
  baseUrl = environment.baseUrl;
  constructor(private _http: HttpClient) {}
  public uploadFile = (event: any, category: string) => {
    let fileList = <FileList>event.target.files;
    let formData = new FormData();
    formData.append("category", category);
    Array.from(fileList).forEach(file3 => {
      formData.append("data", file3);
    });
    // let headers = new HttpHeaders()
    //   .set('Content-Type', 'multipart/form-data;boundary=xxBOUNDARYxx;')
    //   .set('encType' , "multipart/form-data");
    return this._http.post(this.baseUrl + "/Files", formData);
  };
  public getOneFile(id: any) {
    return this._http.get("/Files/" + id);
  }
}
