import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { TransferChange, TransferItem, TransferSelectChange, TransferDirection } from 'ng-zorro-antd/transfer';
import { StaticData } from 'src/app/admission-request/model/StaticData';
import { TermCourseOfferingService } from 'src/app/colleges/services/term-course-offering.service';
import { ACADEMIC_TERM_STATUS } from 'src/app/common/constant';
import { SectionViewModel } from 'src/app/Models/SectionViewModel';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';
import { StudentSectionAssignmentService } from 'src/app/services/student-section-assignment.service';

// Interface for section assigned student information
export interface SectionAssignedStudentInfo {
  studentCode: string;
  batchCode: string;
  fullName: string;
  section: string;
  courseCode: string;
  courseTitle: string;
  courseId: string;
}

@Component({
  selector: 'app-reassign-student-section',
  templateUrl: './reassign-student-section.component.html',
  styleUrls: ['./reassign-student-section.component.scss']
})
export class ReassignStudentSectionComponent implements OnInit {
  searchForm: FormGroup;
  availableSections: SectionViewModel[] = [];
  loading = false;
  loadingSections = false;
  loadingCourses = false;
  errorMessage = '';
  successMessage = '';
  listOfTermNumber: StaticData[] = [];
  yearList: number[] = [];
  listOfBatch: any[] = [];
  listOfSections: SectionViewModel[] = [];

  // Transfer component properties
  list: TransferItem[] = [];
  leftList: TransferItem[] = [];
  rightList: TransferItem[] = [];

  // Search collapse state
  isSearchCollapsed = false;

  // Student data properties
  sectionAssignedStudents: SectionAssignedStudentInfo[] = [];
  listOfData: SectionAssignedStudentInfo[] = [];
  listOfDisplayData: SectionAssignedStudentInfo[] = [];

  disabled = false;
  showSearch = true;

  constructor(
    private fb: FormBuilder,
    private studentSectionAssignmentService: StudentSectionAssignmentService,
    private notificationService: CustomNotificationService,
    private courseTermOfferingService: TermCourseOfferingService
  ) {
    const currentYear = new Date().getFullYear();
    this.yearList = this.getYearRange(currentYear);
    this.getListOfAcademicTermStatus();
    this.createSearchForm();
  }

  ngOnInit(): void {
    this.academicTerm.valueChanges.subscribe(res => {
      if (res && this.year.value) {
        this.getListOfBatch(res, this.year.value);
      }
    });

    this.year.valueChanges.subscribe(year => {
      if (year && this.academicTerm.value) {
        this.getListOfBatch(this.academicTerm.value, year);
      }
    });

    // Subscribe to batchCode changes to load available sections
    this.batchCode.valueChanges.subscribe(batchCode => {
      if (batchCode && this.academicTerm.value && this.year.value) {
        this.loadAvailableSections();
      }
    });
  }

  private createSearchForm() {
    this.searchForm = this.fb.group({
      academicTerm: [null, Validators.required],
      year: [null, Validators.required],
      batchCode: [null, Validators.required],
      sectionIdR: [null, [Validators.required, this.sectionValidator.bind(this)]],
      sectionIdL: [null, [Validators.required, this.sectionValidator.bind(this)]]
    });
  }

  // Custom validator to ensure source and target sections are different
  private sectionValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.parent) {
      return null;
    }

    const sourceSection = control.parent.get('sectionIdL')?.value;
    const targetSection = control.parent.get('sectionIdR')?.value;

    if (sourceSection && targetSection && sourceSection === targetSection) {
      return { sameSection: true };
    }

    return null;
  }

  get academicTerm() {
    return this.searchForm.get("academicTerm");
  }

  get year() {
    return this.searchForm.get("year");
  }

  get batchCode() {
    return this.searchForm.get("batchCode");
  }

  get sectionIdL() {
    return this.searchForm.get("sectionIdL");
  }

  get sectionIdR() {
    return this.searchForm.get("sectionIdR");
  }

  getYearRange(currentYear: number): number[] {
    const startYear = currentYear - 6;
    const yearList = [];
    for (let year = startYear; year <= currentYear; year++) {
      yearList.push(year);
    }
    return yearList.reverse();
  }

  getListOfAcademicTermStatus() {
    let division: StaticData = new StaticData();
    ACADEMIC_TERM_STATUS.forEach(pair => {
      division = {
        Id: pair.Id,
        Description: pair.Description
      };
      this.listOfTermNumber.push(division);
    });
  }

  getListOfBatch(termId: number = 0, termYear: number = 0) {
    this.courseTermOfferingService.getListOfBatchCodeByAcademicTerm(termId, termYear).subscribe(res => {
      this.listOfBatch = res;
    });
  }

  loadAvailableSections(): void {
    if (!this.batchCode.value || !this.academicTerm.value || !this.year.value) {
      return;
    }

    this.loadingSections = true;
    this.availableSections = [];
    this.listOfSections = [];

    this.studentSectionAssignmentService
      .getListOfSectionBasedOnBatch(this.batchCode.value, this.academicTerm.value, this.year.value)
      .subscribe({
        next: (sections: any) => {
          this.loadingSections = false;
          this.availableSections = sections.data || [];
          this.listOfSections = sections.data;
        },
        error: (error) => {
          this.loadingSections = false;
          this.notificationService.notification('error', 'Error', 'Failed to load available sections');
          console.error('Error loading sections:', error);
        }
      });
  }

  searchSectionAssignedStudents(): void {
    if (this.searchForm.valid) {
      // Check if source and target sections are different
      const { batchCode, academicTerm, year, sectionIdR, sectionIdL } = this.searchForm.value;

      if (sectionIdL === sectionIdR) {
        this.notificationService.notification('error', 'Validation Error', 'Source section and target section cannot be the same. Please select different sections.');
        return;
      }

      this.loading = true;
      this.errorMessage = '';
      this.successMessage = '';

      // Load students for both sections
      this.loadStudentsForSection(batchCode, academicTerm, year, sectionIdL, 'left');
      this.loadStudentsForSection(batchCode, academicTerm, year, sectionIdR, 'right');

      // Collapse the search form after successful search
      this.isSearchCollapsed = true;
    } else {
      this.notificationService.notification('error', 'Validation Error', 'Please fill in all required fields.');
    }
  }

  private loadStudentsForSection(batchCode: string, academicTerm: number, year: number, sectionId: number, side: 'left' | 'right'): void {
    this.studentSectionAssignmentService
      .getListOfSectionAssignedStudentsBySectionId(batchCode, academicTerm, year, sectionId)
      .subscribe({
        next: (response) => {
          console.log("&&&         ", response);
          if (response.status === 'success' && response.data) {
            const students = response.data.map((student: any, index: number) => ({
              key: `${side}_${student.studentCode || student.id || index}`,
              title: student.fullName || student.name || `Student ${index + 1}`,
              description: student.studentCode || student.studentId || `Code: ${index}`,
              disabled: false,
              tag: 'Active',
              checked: false,
              direction: (side === 'left' ? 'left' : 'right') as TransferDirection,
              studentInfo: student
            }));

            if (side === 'left') {
              this.leftList = students;
            } else {
              this.rightList = students;
            }

            // Update the main list
            this.updateTransferList();

            // Set loading to false after successful load
            this.loading = false;
          } else {
            // Set loading to false if no data
            this.loading = false;
          }
        },
        error: (error) => {
          console.error(`Error loading students for ${side} section:`, error);
          this.notificationService.notification('error', 'Error', `Failed to load students for ${side} section`);
          // Set loading to false on error
          this.loading = false;
        }
      });
  }

  private updateTransferList(): void {
    this.list = [...this.leftList, ...this.rightList];
  }

  resetSearch(): void {
    this.searchForm.reset();
    this.leftList = [];
    this.rightList = [];
    this.list = [];
    this.sectionAssignedStudents = [];
    this.listOfData = [];
    this.listOfDisplayData = [];
    this.errorMessage = '';
    this.successMessage = '';
  }

  select(ret: TransferSelectChange): void {
    console.log('nzSelectChange', ret);
  }

  change(ret: TransferChange): void {
    console.log('nzChange', ret);
    const listKeys = ret.list.map(l => l['key']);
    const hasOwnKey = (e: TransferItem): boolean => e.hasOwnProperty('key');

    // Update the main list with new directions
    this.list = this.list.map(e => {
      if (listKeys.includes(e['key']) && hasOwnKey(e)) {
        if (ret.to === 'left') {
          delete e.hide;
          e.direction = 'left' as TransferDirection;
          e.checked = false; // Reset selection when moved
        } else if (ret.to === 'right') {
          e.hide = false;
          e.direction = 'right' as TransferDirection;
          e.checked = false; // Reset selection when moved
        }
      }
      return e;
    });

    // Update the separate lists based on new directions
    this.leftList = this.list.filter(item => item.direction === 'left' || !item.direction);
    this.rightList = this.list.filter(item => item.direction === 'right');

    // Log the updated lists for debugging
    console.log('Updated Source Section (Left):', this.leftList.length, 'students');
    console.log('Updated Target Section (Right):', this.rightList.length, 'students');

    // Show notification about the transfer
    const movedStudents = ret.list.length;
    const direction = ret.to === 'left' ? 'Source Section' : 'Target Section';
    this.notificationService.notification(
      'success',
      'Students Moved',
      `${movedStudents} student(s) moved to ${direction}`
    );
  }

  // Helper method for the transfer component
  $asTransferItems(items: TransferItem[]): TransferItem[] {
    return items;
  }

  // Helper method to get tag color based on status
  getTagColor(status: string): string {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'green';
      case 'inactive':
        return 'red';
      case 'pending':
        return 'orange';
      default:
        return 'blue';
    }
  }

  // Helper method to get section name for display
  getSectionName(side: 'left' | 'right'): string {
    if (side === 'left') {
      const sectionId = this.searchForm.get('sectionIdL')?.value;
      const section = this.listOfSections.find(s => s.id === sectionId);
      return section ? section.sectionName : 'Source Section';
    } else {
      const sectionId = this.searchForm.get('sectionIdR')?.value;
      const section = this.listOfSections.find(s => s.id === sectionId);
      return section ? section.sectionName : 'Target Section';
    }
  }

  // TrackBy function for ngFor performance optimization
  trackByKey(index: number, item: TransferItem): string {
    return item['key'] || index.toString();
  }

  // Filter function for transfer component search
  filterOption(inputValue: string, item: TransferItem): boolean {
    if (!inputValue) return true;

    const searchTerm = inputValue.toLowerCase();
    const studentCode = (item['description'] || '').toLowerCase();
    const fullName = (item['title'] || '').toLowerCase();

    return studentCode.includes(searchTerm) || fullName.includes(searchTerm);
  }

  // Method to handle bulk student transfer between sections
  transferStudentsBetweenSections(fromSection: 'left' | 'right', toSection: 'left' | 'right'): void {
    const fromList = fromSection === 'left' ? this.leftList : this.rightList;
    const selectedStudents = fromList.filter(student => student['checked']);

    if (selectedStudents.length === 0) {
      this.notificationService.notification('warning', 'No Students Selected', 'Please select students to transfer.');
      return;
    }

    // Update student directions
    selectedStudents.forEach(student => {
      student.direction = toSection as TransferDirection;
      student.checked = false; // Reset selection after transfer
    });

    // Update the main list
    this.updateTransferList();

    // Update separate lists
    this.leftList = this.list.filter(item => item.direction === 'left' || !item.direction);
    this.rightList = this.list.filter(item => item.direction === 'right');

    // Show success notification
    this.notificationService.notification(
      'success',
      'Transfer Complete',
      `${selectedStudents.length} student(s) transferred from ${fromSection === 'left' ? 'Source' : 'Target'} to ${toSection === 'left' ? 'Source' : 'Target'} Section`
    );

    console.log('Transfer completed:', {
      fromSection,
      toSection,
      studentsMoved: selectedStudents.length,
      sourceCount: this.leftList.length,
      targetCount: this.rightList.length
    });
  }

  
  getSelectedCount(section: 'left' | 'right'): number {
    const list = section === 'left' ? this.leftList : this.rightList;
    return list.filter(student => student['checked']).length;
  }

  modifySectionAssignments(): void {
    if (!this.searchForm.valid) {
      this.notificationService.notification('error', 'Validation Error', 'Please ensure all search criteria are selected.');
      return;
    }

    const { academicTerm, year, batchCode, sectionIdL, sectionIdR } = this.searchForm.value;


    const sourceStudents = this.leftList
      .map(student => student['studentInfo']?.id || student['key']);

    const targetStudents = this.rightList
      .map(student => student['studentInfo']?.id || student['key']);

    console.log('Extracted student IDs:', {
      sourceStudents,
      targetStudents,
      sourceCount: sourceStudents.length,
      targetCount: targetStudents.length
    });

    if (sourceStudents.length === 0 && targetStudents.length === 0) {
      this.notificationService.notification('warning', 'No Students Available', 'No students found in either section.');
      return;
    }

    // Prepare API payload
    const payload = {
      sourceSection: {
        academicTerm: academicTerm,
        year: year,
        batchCode: batchCode,
        sectionId: sectionIdL,
        studentIds: sourceStudents
      },
      targetSection: {
        academicTerm: academicTerm,
        year: year,
        batchCode: batchCode,
        sectionId: sectionIdR,
        studentIds: targetStudents
      }
    };

    this.loading = true;

    this.studentSectionAssignmentService
      .modifySectionAssignments(payload)
      .subscribe({
        next: (response) => {
          this.loading = false;
          if (response) {
            this.notificationService.notification('success', 'Success', 'Section assignments modified successfully!');
            this.searchSectionAssignedStudents();
          } else {
            this.notificationService.notification('error', 'Error', 'Failed to modify section assignments.');
          }
        },
        error: (error) => {
          this.loading = false;
          console.error('Error modifying section assignments:', error);
          this.notificationService.notification('error', 'Error', 'Failed to modify section assignments. Please try again.');
        }
      });

  }
}
