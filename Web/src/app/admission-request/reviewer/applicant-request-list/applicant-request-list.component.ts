import { Component, OnDestroy, OnInit } from "@angular/core";
import { ApplicantAcedamicRequestViewModel } from "../../model/applicant-acedamic-request-view-model.model";
import { GeneralInformationService } from "../../services/general-information.service";
import { Router } from "@angular/router";
import { AcadamicProgramme } from "../../model/acadamic-programme.model";
import { FormBuilder, FormGroup } from "@angular/forms";
import { CustomNotificationService } from "src/app/services/custom-notification.service";
import { AcademicProgramRequestService } from "../../services/academic-program-request.service";
import { REQUEST_STATUS, ACADEMIC_STUDENT_STATUS_DESCRIPTIONS } from "src/app/common/constant";
import { ExcelExportService } from "src/app/reports/services/excel-export.service";
import { PaginatorService, ServerPaginator } from "src/app/reports/services/paginator.service";
import * as XLSX from 'xlsx';

@Component({
  selector: "app-applicant-request-list",
  templateUrl: "./applicant-request-list.component.html",
  styleUrls: ["./applicant-request-list.component.scss"]
})
export class ApplicantRequestListComponent implements OnInit, OnDestroy {
  applicantsList: ApplicantAcedamicRequestViewModel[] = [];
  acadamicProgrammes: AcadamicProgramme[] = [];
  pager: ServerPaginator;
  academicProgramRequestForm: FormGroup;
  // Search form properties
  isFormCollapsed = false;
  hasSearched = false;
  requestStatusOptions = Object.keys(REQUEST_STATUS)
    .filter(key => !isNaN(Number(key)))
    .map(key => ({
      value: Number(key),
      label: ACADEMIC_STUDENT_STATUS_DESCRIPTIONS[Number(key) as REQUEST_STATUS]
    }));
  constructor(
    private generalInformationService: GeneralInformationService,
    private router: Router,
    private _fb: FormBuilder,
    private _academicProgramRequestService: AcademicProgramRequestService,
    private _customNotificationService: CustomNotificationService,
    private _excelExportService: ExcelExportService,
    private paginator: PaginatorService
  ) {
    this.pager = this.paginator.create();
    this.createProgramRequest();
  }

  ngOnInit(): void {
    this.pager.init(() => this.getApplicantRequestList());
    this.getAcademicProgramList();
    this.getApplicantRequestList();
  }

  ngOnDestroy(): void {
    this.pager.destroy();
  }

  getApplicantRequestList() {
    const academicProgrammeId = this.academicProgramRequestForm.get('acadamicProgrammeId')?.value;
    const status = this.academicProgramRequestForm.get('approvalStatus')?.value;
    this.pager.loading = true;
    this.generalInformationService.getApplicantRequestListPaginated(this.pager.query({
      academicProgrammeId,
      status
    })).subscribe({
      next: (res: any) => {
        this.applicantsList = res.data || [];
        this.pager.applyResult(res);
      },
      error: () => {
        this.applicantsList = [];
        this.pager.fail();
      }
    });
  }
  createProgramRequest() {
    this.academicProgramRequestForm = this._fb.group({
      approvalStatus: [REQUEST_STATUS.Submitted, []], // Default to Submitted status
      acadamicProgrammeId: [null, []]
    });
  }
  getAcademicProgramList() {
    this._academicProgramRequestService
      .getAacadamicPrgramtList()
      .subscribe({
        next: (res) => {
          if (res && res.data) {
            this.acadamicProgrammes = res.data;
          } else {
            this.acadamicProgrammes = [];
          }
        },
        error: (error) => {
          this._customNotificationService.notification(
            "error",
            "Error",
            "Failed to load academic programs. Please try again."
          );
          this.acadamicProgrammes = [];
        }
      });
  }
  hasResults(): boolean {
    return this.pager.total > 0;
  }

  getApplicantRequestDetail(applicantId: string, requestId: number) {
    this.router.navigateByUrl(
      `/student-application/applicant-request-detail?id=${applicantId}&&request-id=${requestId}`
    );
  }

  exportApplicants() {
    const academicProgrammeId = this.academicProgramRequestForm.get('acadamicProgrammeId')?.value;
    const status = this.academicProgramRequestForm.get('approvalStatus')?.value;
    this.generalInformationService.getApplicantRequestList(academicProgrammeId, status).subscribe(rows => {
      if (!rows || rows.length === 0) {
        this._customNotificationService.notification(
          "warning",
          "No Data",
          "No applicant data available for export."
        );
        return;
      }
      this.writeApplicantExport(rows);
    });
  }

  private writeApplicantExport(rows: ApplicantAcedamicRequestViewModel[]) {
    const excelData = [
      ['Applicant Requests Report'],
      [`Generated on: ${new Date().toLocaleDateString()}`],
      [`Total Applicants: ${rows.length}`],
      [''],
      [
        'S/N',
        'Applied Date',
        'Academic Programme',
        'Applicant ID',
        'Full Name',
        'Gender',
        'Mobile',
        'Email',
        'Nationality',
        'Status'
      ],
      ...rows.map((applicant, index) => [
        index + 1,
        applicant.appliedDate || 'N/A',
        applicant.academicProgramme || 'N/A',
        applicant.applicantId || 'N/A',
        applicant.fullName || 'N/A',
        applicant.gender || 'N/A',
        applicant.mobile || 'N/A',
        applicant.email || 'N/A',
        applicant.nationality || 'N/A',
        this.getStatusDescription(applicant.approvalStatus)
      ])
    ];

    // Define merge ranges for headers
    const merges: XLSX.Range[] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } }, // Title row
      { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } }, // Date row
      { s: { r: 2, c: 0 }, e: { r: 2, c: 8 } }  // Total count row
    ];

    this._excelExportService.exportWithCustomLayout(
      excelData,
      'Applicant_Requests_Report',
      'Applicant Requests',
      merges
    );

    this._customNotificationService.notification(
      "success",
      "Export Successful",
      "Applicant data has been exported to Excel successfully."
    );
  }

  // Helper method to get academic program name by ID
  getAcademicProgramNameById(id: string): string {
    const program = this.acadamicProgrammes.find(p => p.id === id);
    return program ? program.acadamicProgrammeTitle : '';
  }

  onSearch() {
    this.hasSearched = true;
    this.isFormCollapsed = true;
    this.pager.resetPage();
  }

  onReset() {
    this.academicProgramRequestForm.reset({
      approvalStatus: REQUEST_STATUS.Submitted,
      acadamicProgrammeId: null
    });
    this.pager.searchKey = '';
    this.hasSearched = false;
    this.isFormCollapsed = false;
    this.pager.resetPage();
  }

  // Method to get status description
  getStatusDescription(status: number): string {
    return ACADEMIC_STUDENT_STATUS_DESCRIPTIONS[status as REQUEST_STATUS] || 'Unknown';
  }

  // Method to get status color for tags
  getStatusColor(status: number): string {
    switch (status) {
      case REQUEST_STATUS.Requesting:
        return 'orange';
      case REQUEST_STATUS.Submitted:
        return 'blue';
      case REQUEST_STATUS.Pending:
        return 'yellow';
      case REQUEST_STATUS.Approved:
        return 'green';
      case REQUEST_STATUS.Rejected:
        return 'red';
      default:
        return 'default';
    }
  }
}
