import { Component, OnInit } from "@angular/core";
import { ApplicantAcedamicRequestViewModel } from "../../model/applicant-acedamic-request-view-model.model";
import { GeneralInformationService } from "../../services/general-information.service";
import { Router } from "@angular/router";

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
  
  // Pagination
  pageIndex = 1;
  pageSize = 10;
  pageSizeOption = [5, 10, 15, 25, 50, 100];
  total = 0;
  
  constructor(
    private generalInformationService: GeneralInformationService,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    this.getApplicantRequestList();
  }

  getApplicantRequestList() {
    this.generalInformationService.getApplicantRequestList().subscribe(res => {
      console.log("Applicant Request List:   ", res);
      this.originalApplicants = res;
      this.applyFiltersAndPagination();
      this.tableLoading = false;
    });
  }
  
  onSearchTextChanged() {
    this.pageIndex = 1; // Reset to first page when searching
    this.applyFiltersAndPagination();
  }
  
  applyFiltersAndPagination() {
    // First apply search filter
    if (!this.searchText) {
      this.filteredApplicants = [...this.originalApplicants];
    } else {
      const searchTextLower = this.searchText.toLowerCase();
      this.filteredApplicants = this.originalApplicants.filter(
        applicant =>
          applicant.fullName.toLowerCase().includes(searchTextLower) ||
          applicant.gender.toLowerCase().includes(searchTextLower) ||
          applicant.applicantId.toLowerCase().includes(searchTextLower) ||
          applicant.email.toLowerCase().includes(searchTextLower) ||
          applicant.academicProgramme.toLowerCase().includes(searchTextLower)
      );
    }
    
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
}
