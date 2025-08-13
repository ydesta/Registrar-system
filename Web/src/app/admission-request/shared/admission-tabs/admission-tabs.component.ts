import { Component, Input, Output, EventEmitter, AfterContentInit, ContentChildren, QueryList, ElementRef } from '@angular/core';

@Component({
  selector: 'app-admission-tabs',
  templateUrl: './admission-tabs.component.html',
  styleUrls: ['./admission-tabs.component.scss']
})
export class AdmissionTabsComponent implements AfterContentInit {
  @Input() selectedTabIndex = 0;
  @Input() isTabDisabled: boolean[] = [false, true, true, true, true, true, true, true];
  @Input() showSubmit = false;
  @Input() showSave = false;
  @Input() submitDisabled = false;
  @Input() saveDisabled = false;
  @Input() saveLoading = false;
  @Input() isLastTab = false;
  @Input() nextDisabled = false;
  @Input() flexibleNavigation = false;
  @Input() tabOrder: 'default' | 'reviewer' = 'default'; // New input for tab order configuration
  @Input() academicProgramValid: boolean = false; // New input for Academic Program validation

  @Output() selectedTabIndexChange = new EventEmitter<number>();
  @Output() nextTabClicked = new EventEmitter<void>();
  @Output() previousTabClicked = new EventEmitter<void>();
  @Output() submitClicked = new EventEmitter<void>();
  @Output() saveClicked = new EventEmitter<void>();

  @ContentChildren('[tabContent]') tabContents!: QueryList<ElementRef>;

  // Property to control instruction tab visibility
  showInstructionTab: boolean = true;
  // Property to control files tab visibility
  showFilesTab: boolean = true;

  constructor() {
    this.checkUserRole();
  }

  ngAfterContentInit() {
    // Ensure all tab contents are properly initialized
    this.tabContents.forEach((content: ElementRef) => {
      if (content.nativeElement) {
        content.nativeElement.style.display = 'block';
      }
    });
  }

  /**
   * Check if the current user is a reviewer
   * @returns boolean indicating if user is a reviewer
   */
  public isUserReviewer(): boolean {
    const role = localStorage.getItem('role');
    const userType = localStorage.getItem('userType');
    
    // Check if role contains "Reviewer"
    if (role) {
      try {
        const roles = JSON.parse(role);
        if (Array.isArray(roles)) {
          return roles.includes('Reviewer');
        } else {
          return role === 'Reviewer';
        }
      } catch {
        return role === 'Reviewer';
      }
    }
    
    // Check userType
    return userType === 'Reviewer';
  }

  /**
   * Check user role and set tab visibility
   */
  private checkUserRole(): void {
    const isReviewer = this.isUserReviewer();
    this.showInstructionTab = !isReviewer;
    // Hide files tab for reviewers
    this.showFilesTab = !isReviewer;
    // If user is reviewer and instruction tab is selected, move to next tab
    if (!this.showInstructionTab && this.selectedTabIndex === 0) {
      this.selectedTabIndex = 1;
      this.selectedTabIndexChange.emit(this.selectedTabIndex);
    }
    // If user is reviewer and files tab is selected, move to previous tab
    const filesTabIndex = this.tabOrder === 'reviewer' ? 7 : 7; // Both orders have files at index 7
    if (!this.showFilesTab && this.selectedTabIndex === filesTabIndex) {
      const previousTabIndex = this.tabOrder === 'reviewer' ? 6 : 6; // Both orders have previous tab at index 6
      this.selectedTabIndex = previousTabIndex;
      this.selectedTabIndexChange.emit(this.selectedTabIndex);
    }
  }

  /**
   * Check if the current tab is the last tab
   * @returns boolean indicating if current tab is the last tab
   */
  public isLastTabForCurrentUser(): boolean {
    const isReviewer = this.isUserReviewer();
    
    // Both tab orders have files tab at index 7
    return this.selectedTabIndex === 7;
  }

  /**
   * Check if the Next button should be disabled based on current tab and validation
   * @returns boolean indicating if Next button should be disabled
   */
  public isNextButtonDisabled(): boolean {
    // For ApplicationRequestDetail (reviewer tab order) with flexible navigation: Always allow navigation
    if (this.tabOrder === 'reviewer' && this.flexibleNavigation) {
      return false; // Always enabled for flexible navigation
    }

    // If nextDisabled is explicitly set, respect it
    if (this.nextDisabled) {
      return true;
    }

    // For General Information (default tab order): Check Academic Program validation on Academic Program tab
    if (this.tabOrder === 'default' && this.selectedTabIndex === 5) {
      return !this.academicProgramValid; // Disable if not valid
    }

    // For ApplicationRequestDetail (reviewer tab order): Check Academic Program validation on Academic Program tab (index 6)
    if (this.tabOrder === 'reviewer' && this.selectedTabIndex === 6) {
      return !this.academicProgramValid; // Disable if not valid
    }

    // For other cases, use the default nextDisabled behavior
    return false;
  }

  onTabIndexChange(index: number) {
    this.selectedTabIndex = index;
    this.selectedTabIndexChange.emit(index);
  }

  nextTab() {
    this.nextTabClicked.emit();
  }

  previousTab() {
    this.previousTabClicked.emit();
  }

  onSubmit() {
    this.submitClicked.emit();
  }

  onSave() {
    this.saveClicked.emit();
  }
} 