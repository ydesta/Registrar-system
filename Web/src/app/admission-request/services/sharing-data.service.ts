import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

@Injectable({
  providedIn: "root"
})
export class SharingDataService {
  messageSource: BehaviorSubject<number> = new BehaviorSubject(0);
  currentMessage = this.messageSource.asObservable();

  otherMessageSource: BehaviorSubject<number> = new BehaviorSubject(0);
  otherCurrentMessage = this.otherMessageSource.asObservable();

  programMessageSource: BehaviorSubject<number> = new BehaviorSubject(0);
  programCurrentMessage = this.programMessageSource.asObservable();

  numberOfRequestMessageSource: BehaviorSubject<number> = new BehaviorSubject(
    0
  );
  numberOfRequestCurrentMessage = this.numberOfRequestMessageSource.asObservable();

  constructor() {}
  updateMessage(message: number) {
    this.messageSource.next(message);
  }

  otherUpdateMessage(message: number) {
    this.otherMessageSource.next(message);
  }
  programUpdateMessage(message: number) {
    this.programMessageSource.next(message);
  }

  numberOfRequestUpdateMessage(message: number) {
    this.numberOfRequestMessageSource.next(message);
  }
   // Boolean observable with proper localStorage handling
   private applicantProfileSource = new BehaviorSubject<boolean>(
    this.getInitialProfileStatus()
  );
  currentApplicantProfile = this.applicantProfileSource.asObservable();

  private getInitialProfileStatus(): boolean {
    if (typeof localStorage !== 'undefined') {
      const storedValue = localStorage.getItem('isApplicantProfile');
      return storedValue ? JSON.parse(storedValue) : false;
    }
    return false;
  }

  // ... existing number methods ...

  // Updated boolean method
  updateApplicantProfileStatus(status: boolean) {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('isApplicantProfile', JSON.stringify(status));
    }
    this.applicantProfileSource.next(status);
  }
}
