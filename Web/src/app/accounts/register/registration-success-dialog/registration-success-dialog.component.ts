import { Component, Input, OnInit } from '@angular/core';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { Router } from '@angular/router';

@Component({
  selector: 'app-registration-success-dialog',
  templateUrl: './registration-success-dialog.component.html',
  styleUrls: ['./registration-success-dialog.component.scss']
})
export class RegistrationSuccessDialogComponent implements OnInit {
  @Input() userEmail: string = '';
  @Input() autoDownloadInstruction = true;

  readonly instructionPdfUrl = 'assets/pdf/admission-instrcution.pdf';
  isDownloading = false;

  constructor(
    private modalRef: NzModalRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (this.autoDownloadInstruction) {
      this.downloadInstruction();
    }
  }

  downloadInstruction(): void {
    if (this.isDownloading) {
      return;
    }
    this.isDownloading = true;
    fetch(this.instructionPdfUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to download instruction PDF');
        }
        return response.blob();
      })
      .then((blob) => {
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = 'admission-instruction.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      })
      .catch(() => {
        const link = document.createElement('a');
        link.href = this.instructionPdfUrl;
        link.download = 'admission-instruction.pdf';
        link.target = '_blank';
        link.rel = 'noopener';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      })
      .finally(() => {
        this.isDownloading = false;
      });
  }

  goToSignIn(): void {
    this.modalRef.close();
    this.router.navigate(['/accounts/login']);
  }

  closeDialog(): void {
    this.modalRef.close();
  }
}
