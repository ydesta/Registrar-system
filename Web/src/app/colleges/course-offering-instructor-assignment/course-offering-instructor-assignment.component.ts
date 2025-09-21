import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, ViewChild } from "@angular/core";
import { TermCourseOfferingService } from "../services/term-course-offering.service";
import { NzTableComponent } from "ng-zorro-antd/table";
import { CourseOfferingInstructorAssignment } from "../model/course-offering-instructor-assignment.model";
import { CourseOfferingInstructorAssignmentService } from "../services/course-offering-instructor-assignment.service";
import { CustomNotificationService } from "src/app/services/custom-notification.service";
import { NzModalRef } from "ng-zorro-antd/modal";

@Component({
  selector: "app-course-offering-instructor-assignment",
  templateUrl: "./course-offering-instructor-assignment.component.html",
  styleUrls: ["./course-offering-instructor-assignment.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseOfferingInstructorAssignmentComponent implements OnInit {
  staffList: any;
  checked = false;
  setOfCheckedId = new Set<string>();
  listOfCurrentPageData: readonly any[] = [];
  indeterminate = false;
  loading = false;
  @Input() courseId: string;
  @Input() courseOfferingId: string;
  searchText = '';
  @ViewChild('basicTable', { static: false }) basicTable!: NzTableComponent<any>;
  searchValue = '';
  visible = false;
  originalStaffList: any[];
  existingStaffList: any[] = []
  @Output() dataUpdated = new EventEmitter<void>();
  constructor(private termCourseOfferingService: TermCourseOfferingService,
    private courseOfferingInstructorAssignmentService: CourseOfferingInstructorAssignmentService,
    private _customNotificationService: CustomNotificationService,
    private modalRef: NzModalRef,
    private cdr: ChangeDetectorRef) { }
  ngOnInit(): void {
    this.getCourseOfferingInstructorAssigned();
    this.getStaffList();
    this.clearSearch();
  }
  ngAfterViewInit(): void {
    this.getStaffList();
  }

  clearSearch(): void {
    this.searchText = '';
    this.searchValue = '';
  }

  getStaffList() {
    this.loading = true;
    this.termCourseOfferingService.getStaffList().subscribe({
      next: (res) => {
        if (res && res.data) {
          this.staffList = res.data;
          this.originalStaffList = [...this.staffList];
          this.listOfCurrentPageData = [...this.staffList];
          console.log('Staff list loaded:', this.staffList);
          console.log('Original staff list initialized:', this.originalStaffList.length);
        } else {
          console.error('No data received from staff service');
          this.staffList = [];
          this.originalStaffList = [];
        }
        this.refreshCheckedStatus();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading staff list:', error);
        this.staffList = [];
        this.originalStaffList = [];
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }
  onCurrentPageDataChange(listOfCurrentPageData: readonly any[]): void {
    this.listOfCurrentPageData = listOfCurrentPageData;
    this.setOfCheckedId.clear();
   // Check items based on courseId array
    this.existingStaffList.forEach(staff => {
      const matchingItem = listOfCurrentPageData.find(item => item.id == staff.instructorId);
      if (matchingItem) {
        this.setOfCheckedId.add(matchingItem.id);
      }
    });
    this.refreshCheckedStatus();
  }
  refreshCheckedStatus(): void {
    const listOfEnabledData = this.listOfCurrentPageData.filter(({ disabled }) => !disabled);
    this.checked = listOfEnabledData.every(({ id }) => this.setOfCheckedId.has(id));
    this.indeterminate = listOfEnabledData.some(({ id }) => this.setOfCheckedId.has(id)) && !this.checked;
  }

  onItemChecked(id: string, checked: boolean): void {
    this.updateCheckedSet(id, checked);
    this.refreshCheckedStatus();
  }

  onAllChecked(checked: boolean): void {
    this.listOfCurrentPageData
      .filter(({ disabled }) => !disabled)
      .forEach(({ id }) => this.updateCheckedSet(id, checked));
    this.refreshCheckedStatus();
  }

  updateCheckedSet(id: string, checked: boolean): void {
    if (checked) {
      this.setOfCheckedId.add(id);
    } else {
      this.setOfCheckedId.delete(id);
    }
  }
  onSearch(): void {
    console.log('Search text:', this.searchText);
    console.log('Original staff list length:', this.originalStaffList?.length);
    
    // Check if originalStaffList exists
    if (!this.originalStaffList || this.originalStaffList.length === 0) {
      console.log('No original staff list available');
      return;
    }
    
    // Check if there's any search text
    if (this.searchText.trim() === '') {
      // If the search text is empty, reset the staffList to its original state
      this.staffList = [...this.originalStaffList];
      console.log('Reset to original list, length:', this.staffList.length);
    } else {
      // Filter the original list based on search criteria
      this.staffList = this.originalStaffList.filter(item => {
        if (!item) return false;
        
        const staffCode = item.staffCode ? item.staffCode.toLowerCase() : '';
        const firstName = item.firstName ? item.firstName.toLowerCase() : '';
        const lastName = item.lastName ? item.lastName.toLowerCase() : '';
        const searchTerm = this.searchText.toLowerCase();
        
        return staffCode.includes(searchTerm) || 
               firstName.includes(searchTerm) || 
               lastName.includes(searchTerm);
      });
      console.log('Filtered list length:', this.staffList.length);
    }

    // Refresh the checked status after filtering
    this.refreshCheckedStatus();
  }

  onSubmit() {
    if (this.setOfCheckedId.size === 0) {
      this._customNotificationService.notification(
        "warning",
        "No Selection",
        "Please select at least one instructor to assign."
      );
      return;
    }

    const selectedStaffs = this.staffList
      .filter(data => this.setOfCheckedId.has(data.id))
      .map(data => data.id);

    const assignment = new CourseOfferingInstructorAssignment();
    assignment.courseId = this.courseId;
    assignment.courseOfferingId = this.courseOfferingId;
    assignment.staffId = selectedStaffs;
    
    this.loading = true;
    this.courseOfferingInstructorAssignmentService.create(assignment).subscribe({
      next: (res) => {
        if (res) {
          this._customNotificationService.notification(
            "success",
            "Success",
            `Successfully assigned ${selectedStaffs.length} instructor(s) to the course offering.`
          );
          // Emit the event when data is successfully saved
          this.dataUpdated.emit();
          // Close the modal here if needed
          this.modalRef.close();
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error assigning instructors:', error);
        this._customNotificationService.notification(
          "error",
          "Error",
          "Failed to assign instructors. Please try again."
        );
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }
  reset(): void {
    this.clearSearch();
    this.search();
  }

  search(): void {
    this.visible = false;
    
    // Check if originalStaffList exists
    if (!this.originalStaffList || this.originalStaffList.length === 0) {
      console.log('No original staff list available for dropdown search');
      return;
    }
    
    // Check if there's any search value
    if (this.searchValue.trim() === '') {
      // If the search value is empty, reset the staffList to its original state
      this.staffList = [...this.originalStaffList];
      console.log('Dropdown search reset to original list, length:', this.staffList.length);
    } else {
      // Filter the original list based on search criteria
      this.staffList = this.originalStaffList.filter((item: any) => {
        if (!item) return false;
        
        const firstName = item.firstName ? item.firstName.toLowerCase() : '';
        const lastName = item.lastName ? item.lastName.toLowerCase() : '';
        const searchTerm = this.searchValue.toLowerCase();
        
        return firstName.includes(searchTerm) || lastName.includes(searchTerm);
      });
      console.log('Dropdown search filtered list length:', this.staffList.length);
    }
    
    // Refresh the checked status after filtering
    this.refreshCheckedStatus();
  }
  getCourseOfferingInstructorAssigned() {
    this.courseOfferingInstructorAssignmentService
      .getCourseOfferingInstructorAssigned(this.courseId, this.courseOfferingId)
      .subscribe(res => {
        this.existingStaffList = res;
      })
  }

  closeModal(): void {
    this.modalRef.close();
  }

}
