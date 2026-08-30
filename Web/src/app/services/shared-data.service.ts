import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SharedDataService {
  private readonly content = new BehaviorSubject<any>(null);
  readonly share = this.content.asObservable();

  getLatestValue(data: any): void {
    this.content.next(data);
  }
}
