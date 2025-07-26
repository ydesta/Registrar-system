import { Injectable } from '@angular/core';
import { NzNotificationService } from 'ng-zorro-antd/notification';

@Injectable({
  providedIn: 'root'
})
export class CustomNotificationService {

  constructor( private _notification: NzNotificationService,) { }

notification(type: string, title: string, messege: string) {
this._notification.create(type, title, messege);
}
}
