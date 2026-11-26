import { Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, Output, QueryList, SimpleChanges, ViewChildren, ViewEncapsulation } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-grade-action-otp',
  templateUrl: './grade-action-otp.component.html',
  styleUrls: ['./grade-action-otp.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class GradeActionOtpComponent implements OnChanges, OnDestroy {
  @Input() visible = false;
  @Input() purpose = '';
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() confirmed = new EventEmitter<string>();
  @ViewChildren('digitInput') digitInputs!: QueryList<ElementRef<HTMLInputElement>>;

  digits = ['', '', '', '', '', ''];
  error = '';
  sending = false;
  verifying = false;
  remainingSeconds = 0;
  resendCooldownSeconds = 0;
  emailHint = '';
  codeIssued = false;
  private timer: ReturnType<typeof setInterval> | null = null;
  private resendTimer: ReturnType<typeof setInterval> | null = null;
  private readonly resendCooldownTotal = 60;

  constructor(private authService: AuthService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']?.currentValue === true) {
      this.resetDigits();
      this.error = '';
      this.codeIssued = false;
      this.remainingSeconds = 0;
      this.emailHint = this.maskEmail(localStorage.getItem('email') || '');
      this.send();
    }
    if (changes['visible']?.currentValue === false) {
      this.stopTimer();
      this.stopResendCooldown();
    }
  }

  ngOnDestroy(): void {
    this.stopTimer();
    this.stopResendCooldown();
  }

  get code(): string {
    return this.digits.join('');
  }

  get timerLabel(): string {
    const minutes = Math.floor(this.remainingSeconds / 60);
    const seconds = this.remainingSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  get timerUrgent(): boolean {
    return this.remainingSeconds > 0 && this.remainingSeconds <= 60;
  }

  get expired(): boolean {
    return this.codeIssued && this.remainingSeconds <= 0 && !this.sending;
  }

  get canResend(): boolean {
    return !this.sending && !this.verifying && this.resendCooldownSeconds <= 0;
  }

  get purposeLabel(): string {
    if (this.purpose === 'GradeChangeApproval') return 'grade change';
    if (this.purpose === 'GradeRecordCorrection') return 'grade correction';
    return 'grade import';
  }

  send(): void {
    if (!this.purpose || this.sending || (!this.canResend && this.codeIssued)) return;
    this.sending = true;
    this.error = '';
    this.authService.sendGradeActionOtp(this.purpose).subscribe({
      next: (res) => {
        this.sending = false;
        this.codeIssued = true;
        this.resetDigits();
        if (res?.emailHint) {
          this.emailHint = res.emailHint;
        }
        this.startTimer(Number(res?.expiresInSeconds) || 300);
        this.startResendCooldown();
        setTimeout(() => this.focusDigit(0));
      },
      error: (err) => {
        this.sending = false;
        this.stopTimer();
        this.remainingSeconds = 0;
        this.codeIssued = false;
        this.error = err?.error?.message || err?.message || 'The code could not be sent.';
      }
    });
  }

  trackDigit(_index: number, _digit: string): number {
    return _index;
  }

  onDigitInput(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const raw = input.value.replace(/\D/g, '');

    // SMS autofill / IME may insert multiple digits into one box
    if (raw.length > 1) {
      const chars = raw.slice(0, 6 - index).split('');
      chars.forEach((ch, offset) => {
        this.digits[index + offset] = ch;
      });
      this.error = '';
      this.syncDigitInputs();
      this.focusDigit(Math.min(index + chars.length, 5));
      return;
    }

    const value = raw.slice(-1);
    // Keyboard digits are handled in keydown with preventDefault.
    // Only advance focus here for mobile/soft-keyboard input events.
    if (this.digits[index] === value && input.value === value) {
      return;
    }
    this.digits[index] = value;
    input.value = value;
    this.error = '';
    if (value && index < 5) {
      setTimeout(() => this.focusDigit(index + 1), 0);
    }
  }

  onDigitKeydown(index: number, event: KeyboardEvent): void {
    if (event.key === 'Backspace') {
      event.preventDefault();
      if (this.digits[index]) {
        this.digits[index] = '';
        const input = event.target as HTMLInputElement;
        input.value = '';
      } else if (index > 0) {
        this.digits[index - 1] = '';
        this.focusDigit(index - 1);
      }
      return;
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      this.focusDigit(index - 1);
      return;
    }

    if (event.key === 'ArrowRight' && index < 5) {
      event.preventDefault();
      this.focusDigit(index + 1);
      return;
    }

    if (event.key === 'Enter') {
      this.confirm();
      return;
    }

    // Prevent the typed digit from also landing in the next focused box
    if (/^\d$/.test(event.key)) {
      event.preventDefault();
      this.digits[index] = event.key;
      const input = event.target as HTMLInputElement;
      input.value = event.key;
      this.error = '';
      if (index < 5) this.focusDigit(index + 1);
      return;
    }

    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
    }
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pasted = (event.clipboardData?.getData('text') || '').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    this.digits = Array.from({ length: 6 }, (_, index) => pasted[index] || '');
    this.error = '';
    setTimeout(() => {
      this.syncDigitInputs();
      this.focusDigit(Math.min(pasted.length, 5));
    });
  }

  confirm(): void {
    if (this.verifying || this.sending) return;
    if (this.expired) {
      this.error = 'This code has expired. Send a new code.';
      return;
    }
    if (this.code.length !== 6) {
      this.error = 'Enter all 6 digits.';
      return;
    }
    this.verifying = true;
    this.error = '';
    this.authService.verifyGradeActionOtp(this.purpose, this.code).subscribe({
      next: (res) => {
        this.verifying = false;
        if (!res?.token) {
          this.error = res?.message || 'The one-time code was not accepted.';
          return;
        }
        this.stopTimer();
        this.stopResendCooldown();
        this.visible = false;
        this.visibleChange.emit(false);
        this.confirmed.emit(res.token);
      },
      error: (err) => {
        this.verifying = false;
        this.error = err?.error?.message || err?.message || 'The one-time code is invalid or expired.';
        this.resetDigits();
        this.focusDigit(0);
      }
    });
  }

  close(): void {
    this.stopTimer();
    this.stopResendCooldown();
    this.visible = false;
    this.visibleChange.emit(false);
  }

  private startTimer(seconds: number): void {
    this.stopTimer();
    this.error = '';
    this.remainingSeconds = seconds;
    this.timer = setInterval(() => {
      this.remainingSeconds = Math.max(0, this.remainingSeconds - 1);
      if (this.remainingSeconds === 0) {
        this.stopTimer();
        this.error = 'This code has expired. Send a new code.';
      }
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private startResendCooldown(): void {
    this.stopResendCooldown();
    this.resendCooldownSeconds = this.resendCooldownTotal;
    this.resendTimer = setInterval(() => {
      this.resendCooldownSeconds = Math.max(0, this.resendCooldownSeconds - 1);
      if (this.resendCooldownSeconds === 0) {
        this.stopResendCooldown();
      }
    }, 1000);
  }

  private stopResendCooldown(): void {
    if (this.resendTimer) {
      clearInterval(this.resendTimer);
      this.resendTimer = null;
    }
    this.resendCooldownSeconds = 0;
  }

  private resetDigits(): void {
    this.digits = ['', '', '', '', '', ''];
    setTimeout(() => this.syncDigitInputs());
  }

  private syncDigitInputs(): void {
    this.digitInputs?.forEach((ref, index) => {
      ref.nativeElement.value = this.digits[index] || '';
    });
  }

  private focusDigit(index: number): void {
    const input = this.digitInputs?.get(index)?.nativeElement;
    input?.focus();
    input?.select();
  }

  private maskEmail(email: string): string {
    const [name, domain] = email.split('@');
    if (!name || !domain) return 'your email';
    const visible = name.slice(0, 1);
    return `${visible}${'*'.repeat(Math.max(name.length - 1, 2))}@${domain}`;
  }
}
