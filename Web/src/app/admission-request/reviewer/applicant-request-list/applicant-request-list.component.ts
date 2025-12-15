import { Component, OnInit } from "@angular/core";
import { ApplicantAcedamicRequestViewModel } from "../../model/applicant-acedamic-request-view-model.model";
import { GeneralInformationService } from "../../services/general-information.service";
import { Router } from "@angular/router";
import { AcadamicProgramme } from "../../model/acadamic-programme.model";
import { Form, FormBuilder, FormGroup, Validators } from "@angular/forms";
import { CustomNotificationService } from "src/app/services/custom-notification.service";
import { AcademicProgramRequestService } from "../../services/academic-program-request.service";
import { REQUEST_STATUS, ACADEMIC_STUDENT_STATUS_DESCRIPTIONS } from "src/app/common/constant";
import { ExcelExportService } from "src/app/reports/services/excel-export.service";
import * as XLSX from 'xlsx';

@Component({
  selector: "app-applicant-request-list",
  templateUrl: "./applicant-request-list.component.html",
  styleUrls: ["./applicant-request-list.component.scss"]
})
export class ApplicantRequestListComponent implements OnInit {
  applicantsList: ApplicantAcedamicRequestViewModel[] = [];
  originalApplicants?: ApplicantAcedamicRequestViewModel[] = [];
  filteredApplicants: ApplicantAcedamicRequestViewModel[] = [];
  searchText: string = "";
  tableLoading = true;
  acadamicProgrammes: AcadamicProgramme[] = [];
  // Pagination
  pageIndex = 1;
  pageSize = 10;
  pageSizeOption = [5, 10, 15, 25, 50, 100];
  total = 0;
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
    private _excelExportService: ExcelExportService
  ) { 

    this.createProgramRequest();
  }

  ngOnInit(): void {
    
    this.getAcademicProgramList();
    this.getApplicantRequestList();
  }

  getApplicantRequestList() {
    // Get server-side filter parameters only
    const academicProgrammeId = this.academicProgramRequestForm.get('acadamicProgrammeId')?.value;
    const status = this.academicProgramRequestForm.get('approvalStatus')?.value;

    this.generalInformationService.getApplicantRequestList(academicProgrammeId, status).subscribe(res => {
      this.originalApplicants = res;
      this.applyFiltersAndPagination();
      this.tableLoading = false;
    });
  }
  createProgramRequest() {
    this.academicProgramRequestForm = this._fb.group({
      approvalStatus: [REQUEST_STATUS.Submitted, []], // Default to Submitted status
      acadamicProgrammeId: [null, []]
    });
  }
  onSearchTextChanged() {
    this.pageIndex = 1; // Reset to first page when searching
    this.applyFiltersAndPagination();
  }

  applyFiltersAndPagination() {
    let filtered = [...this.originalApplicants];

    // Apply client-side text search filter
    if (this.searchText) {
      const searchTextLower = this.searchText.toLowerCase();
      filtered = filtered.filter(
        applicant =>
          applicant.fullName.toLowerCase().includes(searchTextLower) ||
          applicant.gender.toLowerCase().includes(searchTextLower) ||
          applicant.applicantId.toLowerCase().includes(searchTextLower) ||
          applicant.email.toLowerCase().includes(searchTextLower) ||
          applicant.academicProgramme.toLowerCase().includes(searchTextLower)
      );
    }

    this.filteredApplicants = filtered;

    // Update total count
    this.total = this.filteredApplicants.length;

    // Ensure page index is valid
    const maxPage = Math.ceil(this.total / this.pageSize);
    if (this.pageIndex > maxPage && maxPage > 0) {
      this.pageIndex = maxPage;
    }

    // Apply pagination
    this.updatePaginatedData();
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
  updatePaginatedData() {
    const startIndex = (this.pageIndex - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.applicantsList = this.filteredApplicants.slice(startIndex, endIndex);
  }

  onPageIndexChange(page: number): void {
    this.pageIndex = page;
    this.updatePaginatedData();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.pageIndex = 1; // Reset to first page when changing page size
    this.updatePaginatedData();
  }

  getCurrentPageInfo(): { start: number; end: number; total: number } {
    const start = (this.pageIndex - 1) * this.pageSize + 1;
    const end = Math.min(this.pageIndex * this.pageSize, this.total);
    return { start, end, total: this.total };
  }

  hasResults(): boolean {
    return this.total > 0;
  }

  getApplicantRequestDetail(applicantId: string, requestId: number) {
    this.router.navigateByUrl(
      `/student-application/applicant-request-detail?id=${applicantId}&&request-id=${requestId}`
    );
  }

  exportApplicants() {
    // Check if data exists
    if (!this.filteredApplicants || this.filteredApplicants.length === 0) {
      this._customNotificationService.notification(
        "warning",
        "No Data",
        "No applicant data available for export."
      );
      return;
    }

    // Prepare data for export
    const excelData = [
      ['Applicant Requests Report'],
      [`Generated on: ${new Date().toLocaleDateString()}`],
      [`Total Applicants: ${this.total}`],
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
      ...this.filteredApplicants.map((applicant, index) => [
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

  // Search method for form-based search
  onSearch() {
    this.pageIndex = 1; // Reset to first page when searching
    this.hasSearched = true;
    this.isFormCollapsed = true;
    this.getApplicantRequestList();
  }

  // Reset search form
  onReset() {
    this.academicProgramRequestForm.reset({
      approvalStatus: REQUEST_STATUS.Submitted, // Reset to default Submitted status
      acadamicProgrammeId: null
    });
    this.searchText = '';
    this.pageIndex = 1;
    this.hasSearched = false;
    this.isFormCollapsed = false;
    this.getApplicantRequestList();
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
