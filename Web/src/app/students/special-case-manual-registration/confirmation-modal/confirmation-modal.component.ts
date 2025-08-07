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

  get headerConfig() {
    if (this.isDeletion) {
      return {
        icon: '🗑️',
        title: 'Course Deletion Confirmation',
        subtitle: 'Review the details before proceeding with deletion'
      };
    } else {
      return {
        icon: '📚',
        title: 'Course Registration Confirmation',
        subtitle: 'Review the details before proceeding with registration'
      };
    }
  }

  onConfirm(): void {
    this.confirmed.emit();
  }

  onCancel(): void {
    this.cancelled.emit();
  }
} 