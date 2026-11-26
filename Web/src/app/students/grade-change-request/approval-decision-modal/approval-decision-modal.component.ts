import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { GradeChangeRequestViewModel, ChangeRequestViewModel } from '../../../Models/GradeChangeRequestViewModel';
import { CustomNotificationService } from '../../../services/custom-notification.service';
import { GradeChangeRequestService } from '../../../services/grade-change-request.service';

@Component({
  selector: 'app-approval-decision-modal',
  templateUrl: './approval-decision-modal.component.html',
  styleUrls: ['./approval-decision-modal.component.scss']
})
export class ApprovalDecisionModalComponent implements OnInit {
  @Input() isVisible = false;
  @Input() request: GradeChangeRequestViewModel | null = null;
  @Output() isVisibleChange = new EventEmitter<boolean>();
  @Output() decisionMade = new EventEmitter<void>();

  decisionForm: FormGroup;
  loading = false;
  otpVisible = false;

  constructor(
    private fb: FormBuilder,
    private gradeChangeRequestService: GradeChangeRequestService,
    private notificationService: CustomNotificationService
  ) {
    this.createForm();
  }

  ngOnInit(): void {
    if (this.request) {
      this.populateForm();
    }
  }

  createForm(): void {
    this.decisionForm = this.fb.group({
      status: [null, [Validators.required]],
      reviewComments: ['', [Validators.required, Validators.minLength(10)]],
      lastModifiedBy: ['Administrator', [Validators.required]]
    });
  }

  populateForm(): void {
    if (this.request) {
      this.decisionForm.patchValue({
        status: null,
        reviewComments: '',
        lastModifiedBy: 'Administrator'
      });
    }
  }

  handleOk(): void {
    if (this.decisionForm.valid && this.request) {
      this.otpVisible = true;
    } else {
      this.notificationService.notification('error', 'Error', 'Please fill in all required fields');
    }
  }

  onGradeCodeConfirmed(token: string): void {
    this.submitDecision(token);
  }

  handleCancel(): void {
    this.closeModal();
  }

  closeModal(): void {
    this.isVisible = false;
    this.isVisibleChange.emit(false);
    this.decisionForm.reset();
    this.loading = false;
  }

  submitDecision(gradeActionToken: string): void {
    if (!this.request) {
      this.notificationService.notification('error', 'Error', 'No request selected');
      return;
    }

    this.loading = true;
    const formData = this.decisionForm.value;

    const changeRequest: ChangeRequestViewModel = {
      status: formData.status,
      reviewComments: formData.reviewComments,
      lastModifiedBy: formData.lastModifiedBy
    };

    this.gradeChangeRequestService.reviewGradeChangeRequest(this.request.id, changeRequest, gradeActionToken)
      .subscribe({
        next: (success) => {
          if (success) {
            const statusText = formData.status === 3 ? 'approved' : 'rejected';
            this.notificationService.notification('success', 'Success', `Grade change request ${statusText} successfully`);
            this.decisionMade.emit();
            this.closeModal();
          } else {
            this.notificationService.notification(
              'error',
              'Error',
              'Failed to process decision. The one-time code was already used. Request a new code and try again.'
            );
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error processing decision:', error);
          this.notificationService.notification(
            'error',
            'Error',
            (error?.error?.error || error?.message || 'Failed to process decision.') +
              ' The one-time code was already used. Request a new code and try again.'
          );
          this.loading = false;
        }
      });
  }

  getStatusText(status: number): string {
    return status === 3 ? 'Approve' : 'Reject';
  }

  getStatusColor(status: number): string {
    return status === 3 ? 'green' : 'red';
  }

  getStatusIcon(status: number): string {
    return status === 3 ? 'check-circle' : 'close-circle';
  }
} 