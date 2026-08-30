import { Injectable } from '@angular/core';
import { CrudService } from './crud.service';

@Injectable({
  providedIn: 'root',
})
export class RepositoryService {
  constructor(private crud: CrudService) {}

  public getData = (route: string) => {
    return this.crud.getList(route);
  };
}
