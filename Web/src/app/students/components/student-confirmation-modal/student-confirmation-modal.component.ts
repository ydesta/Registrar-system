import { Component, Input, Output, EventEmitter } from '@angular/core';
import { StudentProfileViewModel } from '../../models/student-profile-view-model.model';

export interface ConfirmationModalData {
  student: StudentProfileViewModel;
  type: 'activate' | 'deactivate';
  title: string;
  okText: string;
  cancelText: string;
}

@Component({
  selector: 'app-student-confirmation-modal',
  templateUrl: './student-confirmation-modal.component.html',
  styleUrls: ['./student-confirmation-modal.component.scss']
})
export class StudentConfirmationModalComponent {
  @Input() isVisible = false;
  @Input() modalData!: ConfirmationModalData;
  @Output() confirmed = new EventEmitter<StudentProfileViewModel>();
  @Output() cancelled = new EventEmitter<void>();

  get studentName(): string {
    return this.modalData?.student?.fullName || 'Student';
  }

  get studentInfo(): string {
    return this.modalData?.student?.studentCode ? `(${this.modalData.student.studentCode})` : '';
  }

  get displayName(): string {
    const studentName = this.studentName;
    const studentInfo = this.studentInfo;
    return studentName ? `${studentName} ${studentInfo}` : `Student ${studentInfo}`;
  }

  get isActivation(): boolean {
    return this.modalData?.type === 'activate';
  }

  get isDeactivation(): boolean {
    return this.modalData?.type === 'deactivate';
  }

  onOk(): void {
    this.confirmed.emit(this.modalData.student);
  }

  onCancel(): void {
    this.cancelled.emit();
  }
} 