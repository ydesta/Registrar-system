import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SharedDataService {
  authorizationInfo!: any;
  public content = new BehaviorSubject<any>(this.authorizationInfo);
  public share = this.content.asObservable();
  constructor() {}
  getLatestValue(data) {
    this.content.next(data);
  }
}
