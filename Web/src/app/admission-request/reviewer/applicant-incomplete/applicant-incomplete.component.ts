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
          this.incompleteApplicantsList = (response.data || []).filter(
            (a: ApplicantIncompleteResponse) => a.finalSubmit !== 'Complete'
          );
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
    if (status === 'Complete') {
      return 'Complete';
    }
    if (status === 'N/A') {
      return 'N/A';
    }
    return 'Incomplete';
  }

  // Method to get completion status color for tags
  getCompletionStatusColor(status: string): string {
    if (status === 'Complete') {
      return 'green';
    }
    if (status === 'N/A') {
      return 'default';
    }
    return 'red';
  }

  /** Applicants on this page still missing a required section (excludes optional Work Exp). */
  getMissingRequiredCount(): number {
    return (this.incompleteApplicants || []).filter(a => this.hasMissingRequiredSection(a)).length;
  }

  /** Applicants on this page with all required sections done, waiting on Final Submit. */
  getReadyToSubmitCount(): number {
    return (this.incompleteApplicants || []).filter(a =>
      !this.hasMissingRequiredSection(a) && a.finalSubmit !== 'Complete'
    ).length;
  }

  getReadyToSubmitPercentage(): number {
    const pageCount = this.incompleteApplicants?.length || 0;
    if (pageCount === 0) {
      return 0;
    }
    return Math.round((this.getReadyToSubmitCount() / pageCount) * 100);
  }

  private hasMissingRequiredSection(applicant: ApplicantIncompleteResponse): boolean {
    const required = [
      applicant.educationBackground,
      applicant.personalContact,
      applicant.academicProgramRequest,
      applicant.studentPayments
    ];
    return required.some(section => section !== 'Complete');
  }

  exportToExcel(): void {
    // Export must fetch the full incomplete list — table data is only the current page.
    this.generalInformationService.getIncompleteApplicants().subscribe({
      next: (res: any) => {
        let rows: ApplicantIncompleteResponse[] = Array.isArray(res)
          ? res
          : (res?.data || []);

        // Never export submitted applications.
        rows = rows.filter(a => a.finalSubmit !== 'Complete');

        const search = (this.pager.searchKey || '').trim().toLowerCase();
        if (search) {
          rows = rows.filter(a =>
            (a.applicantId || '').toLowerCase().includes(search) ||
            (a.fullName || '').toLowerCase().includes(search) ||
            (a.mobile || '').toLowerCase().includes(search)
          );
        }

        if (!rows.length) {
          this._customNotificationService.notification(
            "warning",
            "No Data",
            "No incomplete applicants data available for export."
          );
          return;
        }

        const excelData = [
          ['Incomplete Applicants Report'],
          [`Generated on: ${new Date().toLocaleDateString()}`],
          [`Total Incomplete Applications: ${rows.length}`],
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
          ...rows.map(applicant => [
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

        const merges: XLSX.Range[] = [
          { s: { r: 0, c: 0 }, e: { r: 0, c: 10 } },
          { s: { r: 1, c: 0 }, e: { r: 1, c: 10 } },
          { s: { r: 2, c: 0 }, e: { r: 2, c: 10 } }
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
          `Exported ${rows.length} incomplete applicants to Excel successfully.`
        );
      },
      error: () => {
        this._customNotificationService.notification(
          "error",
          "Error",
          "Failed to load incomplete applicants for export. Please try again."
        );
      }
    });
  }

  private getOverallStatus(applicant: ApplicantIncompleteResponse): string {
    if (applicant.finalSubmit === 'Complete') {
      return 'Submitted';
    }
    if (this.hasMissingRequiredSection(applicant)) {
      return 'Incomplete';
    }
    return 'Ready to Submit';
  }
}
