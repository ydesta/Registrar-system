import { Component, Input } from '@angular/core';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { Router } from '@angular/router';

@Component({
  selector: 'app-registration-success-dialog',
  templateUrl: './registration-success-dialog.component.html',
  styleUrls: ['./registration-success-dialog.component.scss']
})
export class RegistrationSuccessDialogComponent {
  @Input() userEmail: string = '';

  constructor(
    private modalRef: NzModalRef,
    private router: Router
  ) {}

  goToSignIn(): void {
    this.modalRef.close();
    this.router.navigate(['/accounts/login']);
  }

  closeDialog(): void {
    this.modalRef.close();
  }
} 