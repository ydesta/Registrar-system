import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CourseBreakDownOffering } from '../../models/course-break-down-offering.model';
import { StudentViewModel } from '../../models/student-view-model.model';

export interface ConfirmationModalData {
  type: 'deletion' | 'registration';
  student: StudentViewModel;
  selectedCourses: CourseBreakDownOffering[];
  academicTerm?: string;
  academicYear?: number;
}

@Component({
  selector: 'app-confirmation-modal',
  templateUrl: './confirmation-modal.component.html',
  styleUrls: ['./confirmation-modal.component.scss']
})
export class ConfirmationModalComponent {
  @Input() isVisible = false;
  @Input() modalData: ConfirmationModalData;
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  get totalCreditHours(): number {
    return this.modalData?.selectedCourses?.reduce((sum, course) => sum + (course.creditHours || 0), 0) || 0;
  }

  get totalAmount(): number {
    return this.modalData?.selectedCourses?.reduce((sum, course) => sum + (course.totalAmount || 0), 0) || 0;
  }

  get isDeletion(): boolean {
    return this.modalData?.type === 'deletion';
  }

  get isRegistration(): boolean {
    return this.modalData?.type === 'registration';
  }

  get courseCountLabel(): string {
    const count = this.modalData?.selectedCourses?.length || 0;
    return `${count} course${count === 1 ? '' : 's'}`;
  }

  get headerConfig() {
    if (this.isDeletion) {
      return {
        icon: 'delete',
        title: 'Confirm Course Removal',
        subtitle: 'Please verify the student and course details before removing these registrations.'
      };
    }

    return {
      icon: 'form',
      title: 'Confirm Manual Registration',
      subtitle: 'Please verify the student, term, and selected courses before completing registration.'
    };
  }

  get noticeTitle(): string {
    return this.isDeletion ? 'Important Notice' : 'Please Confirm';
  }

  get noticeMessage(): string {
    if (this.isDeletion) {
      return 'The selected courses will be removed from this student’s registration record. Ensure this action is intentional before continuing.';
    }

    return 'The selected courses will be registered for this student under the chosen academic term and year. Please confirm that all details are correct before continuing.';
  }

  get confirmButtonLabel(): string {
    return this.isDeletion ? 'Confirm Removal' : 'Confirm Registration';
  }

  onConfirm(): void {
    this.confirmed.emit();
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
