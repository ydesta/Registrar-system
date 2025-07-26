import { Component, OnInit, OnDestroy } from '@angular/core';
import { SessionManagementService } from '../../services/session-management.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-session-warning',
  templateUrl: './session-warning.component.html',
  styleUrls: ['./session-warning.component.scss']
})
export class SessionWarningComponent implements OnInit, OnDestroy {
  isVisible = false;
  timeRemaining = 0;
  isWarning = false;
  private subscription: Subscription = new Subscription();

  constructor(private sessionManagementService: SessionManagementService) {}

  ngOnInit(): void {
    this.subscription.add(
      this.sessionManagementService.sessionState$.subscribe(state => {
        this.isVisible = state.isActive && state.isWarning;
        this.timeRemaining = state.timeRemaining;
        this.isWarning = state.isWarning;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  extendSession(): void {
    this.sessionManagementService.refreshSession();
  }

  logout(): void {
    this.sessionManagementService.destroy();
  }

  formatTimeRemaining(): string {
    const minutes = Math.floor(this.timeRemaining / 60000);
    const seconds = Math.floor((this.timeRemaining % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
} 