import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, TrackByFunction } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-course-enrollment-details',
  templateUrl: './course-enrollment-details.component.html',
  styleUrls: ['./course-enrollment-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CourseEnrollmentDetailsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  readonly tabs = [
    { key: 'registered', title: 'Registered Courses', icon: 'book', ariaLabel: 'Currently registered courses' },
    { key: 'adddrop', title: 'Add-Drop Courses', icon: 'swap', ariaLabel: 'Add and drop course requests' },
    { key: 'transferred', title: 'Transferred Courses', icon: 'export', ariaLabel: 'Transferred course information' },
    { key: 'withdrawal', title: 'Withdrawal', icon: 'close-circle', ariaLabel: 'Course withdrawal information' }
  ];

  currentTab = 'registered';
  selectedIndex = 0;

  constructor() {}

  ngOnInit(): void {
    this.initializeComponent();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeComponent(): void {
    // Initialize component data
    console.log('Course Enrollment Details Component initialized');
  }

  onTabChange(index: number): void {
    if (index >= 0 && index < this.tabs.length) {
      this.selectedIndex = index;
      this.currentTab = this.tabs[index].key;
      console.log('Tab changed to:', this.currentTab);
    }
  }

  // TrackBy functions for better performance
  trackByTabKey: TrackByFunction<any> = (index: number, tab: any) => tab.key;
  trackByIndex: TrackByFunction<any> = (index: number) => index;
}
