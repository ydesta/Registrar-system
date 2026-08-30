import { Component, OnDestroy, OnInit } from '@angular/core';
import { GeneralInformationService } from '../../services/general-information.service';
import { ApplicantIncompleteResponse } from '../../model/applicant-acedamic-request-view-model.model';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';
import { ExcelExportService } from 'src/app/reports/services/excel-export.service';
import { PaginatorService, ServerPaginator } from 'src/app/reports/services/paginator.service';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-applicant-incomplete',
  templateUrl: './applicant-incomplete.component.html',
  styleUrls: ['./applicant-incomplete.component.scss']
})
export class ApplicantIncompleteComponent implements OnInit, OnDestroy {
  incompleteApplicants: ApplicantIncompleteResponse[] = [];
  incompleteApplicantsList: ApplicantIncompleteResponse[] = [];
  pager: ServerPaginator;

  constructor(
    private generalInformationService: GeneralInformationService,
    private _customNotificationService: CustomNotificationService,
    private _excelExportService: ExcelExportService,
    private paginator: PaginatorService
  ) {
    this.pager = this.paginator.create();
  }

  ngOnInit(): void {
    this.pager.init(() => this.getIncompleteApplicants());
    this.getIncompleteApplicants();
  }

  ngOnDestroy(): void {
    this.pager.destroy();
  }

  getIncompleteApplicants() {
    this.pager.loading = true;
    this.generalInformationService.getIncompleteApplicantsPaginated(this.pager.query())
      .subscribe({
        next: (response: any) => {
          this.incompleteApplicantsList = response.data || [];
          this.incompleteApplicants = this.incompleteApplicantsList;
          this.pager.applyResult(response);
        },
        error: () => {
          this.incompleteApplicantsList = [];
          this.incompleteApplicants = [];
          this.pager.fail();
          this._customNotificationService.notification(
            "error",
            "Error",
            "Failed to load incomplete applicants. Please try again."
          );
        }
      });
  }

  get total(): number {
    return this.pager.total;
  }

  // Method to get completion status text
  getCompletionStatusText(status: string): string {
    return status === 'Complete' ? 'Complete' : 'Incomplete';
  }

  // Method to get completion status color for tags
  getCompletionStatusColor(status: string): string {
    return status === 'Complete' ? 'green' : 'red';
  }

  // Summary statistics methods
  getCompletedCount(): number {
    if (!this.incompleteApplicants || this.incompleteApplicants.length === 0) {
      return 0;
    }
    
    let completedCount = 0;
    this.incompleteApplicants.forEach(applicant => {
      const sections = [
        applicant.educationBackground,
        applicant.personalContact,
        applicant.applicantWorkExperiences,
        applicant.academicProgramRequest,
        applicant.studentPayments,
        applicant.finalSubmit
      ];
      
      completedCount += sections.filter(section => section === 'Complete').length;
    });
    
    return completedCount;
  }

  getIncompleteCount(): number {
    if (!this.incompleteApplicants || this.incompleteApplicants.length === 0) {
      return 0;
    }
    
    let incompleteCount = 0;
    this.incompleteApplicants.forEach(applicant => {
      const sections = [
        applicant.educationBackground,
        applicant.personalContact,
        applicant.applicantWorkExperiences,
        applicant.academicProgramRequest,
        applicant.studentPayments,
        applicant.finalSubmit
      ];
      
      incompleteCount += sections.filter(section => section === 'Incomplete').length;
    });
    
    return incompleteCount;
  }

  getCompletionPercentage(): number {
    const completed = this.getCompletedCount();
    const incomplete = this.getIncompleteCount();
    const total = completed + incomplete;
    
    if (total === 0) {
      return 0;
    }
    
    return Math.round((completed / total) * 100);
  }

  exportToExcel(): void {
    // Check if data exists
    if (!this.incompleteApplicants || this.incompleteApplicants.length === 0) {
      this._customNotificationService.notification(
        "warning",
        "No Data",
        "No incomplete applicants data available for export."
      );
      return;
    }

    // Prepare data for export
    const excelData = [
      ['Incomplete Applicants Report'],
      [`Generated on: ${new Date().toLocaleDateString()}`],
      [`Total Incomplete Applications: ${this.total}`],
      [''],
      [
        'Applicant ID',
        'Full Name',
        'Mobile',
        'Request Date',
        'Education Background',
        'Personal Contact',
        'Work Experience',
        'Academic Program',
        'Student Payment',
        'Final Submit',
        'Overall Status'
      ],
      ...this.incompleteApplicants.map(applicant => [
        applicant.applicantId || 'N/A',
        applicant.fullName || 'N/A',
        applicant.mobile || 'N/A',
        applicant.requestDate || 'N/A',
        applicant.educationBackground || 'N/A',
        applicant.personalContact || 'N/A',
        applicant.applicantWorkExperiences || 'N/A',
        applicant.academicProgramRequest || 'N/A',
        applicant.studentPayments || 'N/A',
        applicant.finalSubmit || 'N/A',
        this.getOverallStatus(applicant)
      ])
    ];

    // Define merge ranges for headers
    const merges: XLSX.Range[] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 10 } }, // Title row
      { s: { r: 1, c: 0 }, e: { r: 1, c: 10 } }, // Date row
      { s: { r: 2, c: 0 }, e: { r: 2, c: 10 } }  // Total count row
    ];

    this._excelExportService.exportWithCustomLayout(
      excelData,
      'Incomplete_Applicants_Report',
      'Incomplete Applicants',
      merges
    );

    this._customNotificationService.notification(
      "success",
      "Export Successful",
      "Incomplete applicants data has been exported to Excel successfully."
    );
  }

  private getOverallStatus(applicant: ApplicantIncompleteResponse): string {
    const sections = [
      applicant.educationBackground,
      applicant.personalContact,
      applicant.applicantWorkExperiences,
      applicant.academicProgramRequest,
      applicant.studentPayments,
      applicant.finalSubmit
    ];
    
    const completedCount = sections.filter(section => section === 'Complete').length;
    const totalSections = sections.length;
    
    if (completedCount === totalSections) {
      return 'Complete';
    } else if (completedCount === 0) {
      return 'Not Started';
    } else {
      return `In Progress (${completedCount}/${totalSections})`;
    }
  }
}
