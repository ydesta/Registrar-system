import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { CrudService } from 'src/app/services/crud.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-card-verify',
  templateUrl: './card-verify.component.html',
  styleUrls: ['./card-verify.component.scss']
})
export class CardVerifyComponent {
  checking = false;
  result: any = null;
  error = '';
  form = this.fb.group({
    qrToken: ['', Validators.required]
  });
  private readonly fileUrl = environment.fileUrl;

  constructor(private fb: FormBuilder, private crud: CrudService) {}

  verify(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.checking = true;
    this.result = null;
    this.error = '';
    const token = (this.form.value.qrToken || '').trim();

    this.crud.add('/student-cards/verify', { qrToken: token }).subscribe({
      next: (res: any) => {
        this.checking = false;
        this.result = res?.data || res;
      },
      error: (err) => {
        this.checking = false;
        this.error = err?.error?.data || err?.error?.error || 'Verification failed.';
      }
    });
  }

  openPublicScan(): void {
    const token = (this.form.value.qrToken || '').trim();
    if (!token) {
      return;
    }
    window.open(`/card-scan/${encodeURIComponent(token)}`, '_blank');
  }

  statusLabel(status: number | string): string {
    const map: Record<number, string> = {
      1: 'Draft', 2: 'Active', 3: 'Suspended', 4: 'Lost', 5: 'Expired', 6: 'Cancelled', 7: 'Replaced'
    };
    if (typeof status === 'number') {
      return map[status] || String(status);
    }
    return String(status || '');
  }

  photoUrl(path: string | null | undefined): string | null {
    if (!path) {
      return null;
    }
    if (path.startsWith('http') || path.startsWith('data:')) {
      return path;
    }
    return `${this.fileUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  }
}
