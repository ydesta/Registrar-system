import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { studentCardStatusColor, studentCardStatusLabel } from '../shared/card-status.util';

type ScanTone = 'ok' | 'warn' | 'bad';

const RESULT_COPY: Record<string, { tone: ScanTone; title: string; text: string }> = {
  Valid: { tone: 'ok', title: 'Verified student', text: '' },
  Expired: { tone: 'warn', title: 'Card expired', text: 'The card is genuine but no longer valid.' },
  Suspended: { tone: 'bad', title: 'Card not valid', text: 'This card has been suspended. Do not accept it.' },
  Lost: { tone: 'bad', title: 'Card not valid', text: 'This card was reported lost. Do not accept it.' },
  Replaced: { tone: 'bad', title: 'Card not valid', text: 'This card has been replaced by a newer card.' },
  Cancelled: { tone: 'bad', title: 'Card not valid', text: 'This card has been cancelled. Do not accept it.' },
  NotIssued: { tone: 'bad', title: 'Card not valid', text: 'This card was never activated. Do not accept it.' },
  NotGenuine: { tone: 'bad', title: 'Not a genuine card', text: 'This QR code was not issued by the college, or it has been changed.' }
};

@Component({
  selector: 'app-card-public-scan',
  templateUrl: './card-public-scan.component.html',
  styleUrls: ['./card-public-scan.component.scss']
})
export class CardPublicScanComponent implements OnInit {
  loading = true;
  result: any = null;
  error = '';
  logoUrl: string | null = null;
  photoUrl: string | null = null;
  copy = RESULT_COPY['NotGenuine'];

  private readonly fileUrl = environment.fileUrl;

  constructor(private route: ActivatedRoute, private http: HttpClient) {}

  ngOnInit(): void {
    const token = this.route.snapshot.paramMap.get('token') || '';
    if (!token) {
      this.loading = false;
      this.error = 'This QR code is missing a card token.';
      return;
    }

    const url = `${environment.baseUrl}/${environment.apiVersion}/student-cards/public/scan/${encodeURIComponent(token)}`;
    this.http.get(url).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.result = res?.data || res;
        this.copy = this.resolveCopy(this.result);
        this.logoUrl = this.toUrl(this.result?.logoPath);
        this.photoUrl = this.showHolder ? this.toUrl(this.result?.photoPath) : null;
      },
      error: () => {
        this.loading = false;
        this.error = 'Unable to verify this card.';
        this.copy = RESULT_COPY['NotGenuine'];
      }
    });
  }

  get showHolder(): boolean {
    const key = this.resultKey(this.result);
    return key === 'Valid' || key === 'Expired';
  }

  statusLabel(result: any): string {
    return result?.statusName || studentCardStatusLabel(result?.status);
  }

  statusColor(result: any): string {
    return studentCardStatusColor(result?.statusName || result?.status);
  }

  private resolveCopy(result: any): { tone: ScanTone; title: string; text: string } {
    const key = this.resultKey(result);
    return RESULT_COPY[key] || RESULT_COPY['NotGenuine'];
  }

  private resultKey(result: any): string {
    const raw = String(result?.result || '').trim();
    if (raw && RESULT_COPY[raw]) {
      return raw;
    }
    if (result?.isValid) {
      return 'Valid';
    }
    const status = studentCardStatusLabel(result?.statusName || result?.status).toLowerCase();
    if (status === 'expired' || (result?.reason || '').toLowerCase().includes('past expiry')) {
      return 'Expired';
    }
    if (status === 'suspended') return 'Suspended';
    if (status === 'lost') return 'Lost';
    if (status === 'replaced') return 'Replaced';
    if (status === 'cancelled') return 'Cancelled';
    if (status === 'draft') return 'NotIssued';
    if (!result?.cardNumber && !result?.studentNumber) {
      return 'NotGenuine';
    }
    return 'NotGenuine';
  }

  private toUrl(path: string | null | undefined): string | null {
    const value = (path || '').trim();
    if (!value) {
      return null;
    }
    if (value.startsWith('http') || value.startsWith('data:')) {
      return value;
    }
    return `${this.fileUrl}${value.startsWith('/') ? '' : '/'}${value}`;
  }
}
