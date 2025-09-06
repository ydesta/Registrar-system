import { Injectable } from '@angular/core';
import { NzNotificationService } from 'ng-zorro-antd/notification';

@Injectable({
  providedIn: 'root'
})
export class CustomNotificationService {

  constructor(private _notification: NzNotificationService) { }

  notification(type: string, title: string, message: string) {
    this._notification.create(type, title, message);
  }

  showSuccess(message: string, title: string = 'Success') {
    this._notification.create('success', title, message);
  }

  showError(message: string, title: string = 'Error') {
    this._notification.create('error', title, message);
  }

  showWarning(message: string, title: string = 'Warning') {
    this._notification.create('warning', title, message);
  }

  showInfo(message: string, title: string = 'Info') {
    this._notification.create('info', title, message);
  }
}
