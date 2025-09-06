import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { InstructorSectionService } from '../../services/instructor-section.service';
import { InstructorSectionAssignmentViewModel } from '../../Models/InstructorSectionModel';
import { CustomNotificationService } from '../../services/custom-notification.service';
import { NzModalService } from 'ng-zorro-antd/modal';

@Component({
  selector: 'app-instructor-sections',
  templateUrl: './instructor-sections.component.html',
  styleUrls: ['./instructor-sections.component.scss']
})
export class InstructorSectionsComponent implements OnInit {
  loading = false;

  constructor(
    private instructorSectionService: InstructorSectionService,
    private notificationService: CustomNotificationService,
    private modal: NzModalService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // No need to load data here as the child component handles it
  }

  navigateToForm(editData?: InstructorSectionAssignmentViewModel): void {
    if (editData) {
      this.router.navigate(['/student-section/instructor-section-form', editData.id]);
    } else {
      this.router.navigate(['/student-section/instructor-section-form']);
    }
  }

  deleteInstructorSection(id: number): void {
    this.modal.confirm({
      nzTitle: 'Are you sure you want to delete this instructor section?',
      nzContent: 'This action cannot be undone.',
      nzOkText: 'Yes',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        this.instructorSectionService.deleteInstructorSection(id).subscribe({
          next: (response) => {
            if (response.status === 'success') {
              this.notificationService.showSuccess('Instructor section deleted successfully');
              // Refresh the data in the child component by triggering a search
              // This will be handled by the child component's search functionality
            } else {
              this.notificationService.showError('Failed to delete instructor section');
            }
          },
          error: (error) => {
            console.error('Error deleting instructor section:', error);
            this.notificationService.showError('Error deleting instructor section');
          }
        });
      }
    });
  }

  onDataRefreshed(): void {
    // This method is called when the child component needs to refresh data
    // The child component handles its own data refresh through the service
    console.log('Data refresh requested from child component');
  }
}
