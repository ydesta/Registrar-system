import { Component, OnInit, OnDestroy, TemplateRef, ViewChild, ChangeDetectionStrategy, TrackByFunction } from '@angular/core';
import { SharingDataService } from '../services/sharing-data.service';
import { Subscription, Subject } from 'rxjs';
import { Router } from '@angular/router';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-applicant-profile',
  templateUrl: './applicant-profile.component.html',
  styleUrls: ['./applicant-profile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ApplicantProfileComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private subscription: Subscription = new Subscription();
  
  @ViewChild('tabTitle', { static: true }) tabTitleTpl!: TemplateRef<any>;
  isApplicantProfile: boolean = false;

  readonly tabs = [
    { key: 'address', title: 'Address', icon: 'home', ariaLabel: 'Address information' },
    { key: 'education', title: 'Education Background', icon: 'book', ariaLabel: 'Education background information' },
    { key: 'work', title: 'Work Experience', icon: 'project', ariaLabel: 'Work experience information' },
    { key: 'emergency', title: 'Emergency Contact', icon: 'phone', ariaLabel: 'Emergency contact information' },
    { key: 'program', title: 'Program Request', icon: 'form', ariaLabel: 'Program request information' }
  ];

  currentTab = 'address';
  selectedIndex = 0;

  constructor(
    private sharingData: SharingDataService,
    private router: Router,
  ) {
    this.sharingData.updateApplicantProfileStatus(true);
  }

  ngOnInit(): void {
    this.initializeComponent();
  }

  private initializeComponent(): void {
    // Subscribe to any data changes if needed
    this.subscription.add(
      this.sharingData.currentApplicantProfile
        .pipe(takeUntil(this.destroy$))
        .subscribe(status => {
          this.isApplicantProfile = status;
        })
    );
  }

  onTabChange(index: number): void {
    if (index >= 0 && index < this.tabs.length) {
      this.selectedIndex = index;
      this.currentTab = this.tabs[index].key;
    }
  }

  // Method to get tab title with icon (if needed for custom templates)
  getTabTitle(tab: any): string {
    return tab.title;
  }

  editProfile(): void {
    this.sharingData.updateApplicantProfileStatus(false);  
    this.router.navigateByUrl('/student-application/admission-request');
  }

  // TrackBy functions for better performance
  trackByTabKey: TrackByFunction<any> = (index: number, tab: any) => tab?.key || index;
  trackByIndex: TrackByFunction<any> = (index: number) => index;

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.subscription.unsubscribe();
  }
}
