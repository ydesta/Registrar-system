import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { CrudService } from 'src/app/services/crud.service';

@Injectable({
  providedIn: 'root'
})
export class FilesService {
  private readonly files = `/${environment.apiVersion}/file`;

  constructor(private crud: CrudService) {}

  public uploadFile = (event: any, category: string) => {
    const fileList = event.target.files as FileList;
    const formData = new FormData();
    formData.append('category', category);
    Array.from(fileList).forEach(file => {
      formData.append('data', file);
    });
    return this.crud.add(this.files, formData);
  };

  public getOneFile(id: any) {
    return this.crud.getById(this.files, id);
  }
}
