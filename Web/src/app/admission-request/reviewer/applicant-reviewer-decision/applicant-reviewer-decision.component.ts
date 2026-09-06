import { Component, OnInit, Input, Output, EventEmitter } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { GeneralInformationService } from "../../services/general-information.service";
import { AcademicProgramRequest } from "../../model/academic-program-request.model";
import { AcadamicProgramme } from "../../model/acadamic-programme.model";
import { AcademicProgramRequestService } from "../../services/academic-program-request.service";
import { ActivatedRoute, Router } from "@angular/router";
import { CustomNotificationService } from "src/app/services/custom-notification.service";
import { UserManagementService } from 'src/app/services/user-management.service';
import { NzModalRef } from "ng-zorro-antd/modal";
import { AdmissionLookupService } from "src/app/colleges/services/admission-lookup.service";
import { APPLICANT_TYPE_STATUS, Division_Status } from "src/app/common/constant";

@Component({
  selector: "app-applicant-reviewer-decision",
  templateUrl: "./applicant-reviewer-decision.component.html",
  styleUrls: ["./applicant-reviewer-decision.component.scss"]
})
export class ApplicantReviewerDecisionComponent implements OnInit {
  @Input() academicProgramRequest: AcademicProgramRequest;
  @Input() applicantId: string;
  @Input() academicProgramId: string;
  @Output() decisionSubmitted = new EventEmitter<AcademicProgramRequest>();

  reviewerForm: FormGroup;
  id: number;
  isSubmitting = false;
  isResolvingBatch = false;
  lookupBatchCodes: string[] = [];
  batchLookupError: string | null = null;
  acadamicProgrammes: AcadamicProgramme[] = [];

  constructor(
    private fb: FormBuilder,
    private _generalInformationService: GeneralInformationService,
    private route: ActivatedRoute,
    private router: Router,
    private _customNotificationService: CustomNotificationService,
    private userManagementService: UserManagementService,
    private modalRef: NzModalRef,
    private admissionLookupService: AdmissionLookupService,
    private academicProgramRequestService: AcademicProgramRequestService
  ) {
    this.createReviewerForm();
    route.queryParams.subscribe(p => {
      this.id = p["request-id"];
    });
  }

  ngOnInit(): void {
    this.loadAcademicProgrammes();
    this.admissionDecision.valueChanges.subscribe(value => {
      const remarkControl = this.reviewerForm.get("remark");
      const batchControl = this.reviewerForm.get("batchCode");

      if (value === "4" || value === "2") {
        remarkControl.setValidators([Validators.required, Validators.maxLength(250)]);
      } else {
        remarkControl.setValidators([Validators.maxLength(250)]);
      }
      remarkControl.updateValueAndValidity();

      if (value === "3") {
        batchControl.setValidators(Validators.required);
        this.resolveBatchFromAdmissionLookup();
      } else {
        batchControl.clearValidators();
        batchControl.setValue(null);
        this.lookupBatchCodes = [];
        this.batchLookupError = null;
      }
      batchControl.updateValueAndValidity();
    });
  }

  loadAcademicProgrammes(): void {
    this.academicProgramRequestService.getAacadamicPrgramtList().subscribe({
      next: (res: any) => {
        this.acadamicProgrammes = res?.data || [];
      }
    });
  }

  get programmeLabel(): string {
    const programmeId =
      this.academicProgramId ||
      this.academicProgramRequest?.acadamicProgrammeId;
    if (!programmeId) {
      return 'N/A';
    }
    const program = this.acadamicProgrammes.find(
      item => String(item.id) === String(programmeId)
    );
    return program?.acadamicProgrammeTitle || 'N/A';
  }

  get applicationTypeLabel(): string {
    const year = this.academicProgramRequest?.applicantYear;
    return APPLICANT_TYPE_STATUS.find(x => x.Id === year)?.Description || 'N/A';
  }

  get divisionLabel(): string {
    const division = this.academicProgramRequest?.division;
    return Division_Status.find(x => x.Id === division)?.Description || 'N/A';
  }

  resolveBatchFromAdmissionLookup(): void {
    const programmeId =
      this.academicProgramId ||
      this.academicProgramRequest?.acadamicProgrammeId;
    const division = this.academicProgramRequest?.division;
    const applicantYear = this.academicProgramRequest?.applicantYear;

    this.lookupBatchCodes = [];
    this.batchLookupError = null;
    this.reviewerForm.get("batchCode")?.setValue(null);

    if (!programmeId || division == null || applicantYear == null) {
      this.batchLookupError =
        "Cannot resolve batch: program, division, or application type is missing on the request.";
      return;
    }

    this.isResolvingBatch = true;
    this.admissionLookupService.getList().subscribe({
      next: (res: any) => {
        const lookups: any[] = res?.data || [];
        const matches = lookups.filter(x =>
          x &&
          x.isActive !== false &&
          !x.isDeleted &&
          String(x.acadamicProgrammeId) === String(programmeId) &&
          Number(x.division) === Number(division) &&
          Number(x.applicantYear) === Number(applicantYear) &&
          !!x.batchCode
        );

        // Prefer distinct batch codes from matching lookups
        this.lookupBatchCodes = Array.from(
          new Set(matches.map(m => String(m.batchCode).trim()).filter(Boolean))
        );

        if (this.lookupBatchCodes.length === 0) {
          this.batchLookupError =
            `No active Admission Lookup batch found for this program, ${this.divisionLabel}, and ${this.applicationTypeLabel}.`;
        } else {
          // Auto-populate with the resolved batch (first match if multiple)
          this.reviewerForm.get("batchCode")?.setValue(this.lookupBatchCodes[0]);
        }
        this.isResolvingBatch = false;
        this.reviewerForm.get("batchCode")?.updateValueAndValidity();
      },
      error: () => {
        this.isResolvingBatch = false;
        this.batchLookupError =
          "Failed to load Admission Lookup. Please try again.";
      }
    });
  }

  createReviewerForm() {
    this.reviewerForm = this.fb.group({
      admissionDecision: ["", Validators.required],
      remark: [null, [Validators.maxLength(250)]],
      batchCode: [null]
    });
  }

  get admissionDecision() {
    return this.reviewerForm.get("admissionDecision");
  }

  get isAccepted(): boolean {
    return this.admissionDecision?.value === "3";
  }

  private getApplicantReviewerDecision(): AcademicProgramRequest {
    const formModel = this.reviewerForm.getRawValue();
    const generalUserInfo = new AcademicProgramRequest();

    generalUserInfo.id = this.academicProgramRequest?.id || this.id || 0;
    generalUserInfo.applicantId = this.applicantId || this.academicProgramRequest?.applicantId;
    generalUserInfo.acadamicProgrammeId = this.academicProgramId || this.academicProgramRequest?.acadamicProgrammeId;
    generalUserInfo.approvalStatus = formModel.admissionDecision;
    generalUserInfo.remark = formModel.remark;
    generalUserInfo.batchCode = formModel.batchCode;
    generalUserInfo.division = this.academicProgramRequest?.division;
    generalUserInfo.applicantYear = this.academicProgramRequest?.applicantYear;

    return generalUserInfo;
  }

  submitForm() {
    if (this.reviewerForm.valid) {
      const postData = this.getApplicantReviewerDecision();
      if (!postData.applicantId || !postData.acadamicProgrammeId) {
        this._customNotificationService.notification(
          "error",
          "Error",
          "Missing required information: Applicant ID or Academic Program ID."
        );
        return;
      }

      if (Number(postData.approvalStatus) === 3 && !postData.batchCode) {
        this._customNotificationService.notification(
          "warning",
          "Warning",
          this.batchLookupError ||
            "No batch found in Admission Lookup for this application type. Configure Admission Lookup first."
        );
        return;
      }

      this.isSubmitting = true;
      this._generalInformationService
        .applicantReviewerDecision(postData.id, postData)
        .subscribe(res => {
          if (res && res.status == "success") {
            const responseData = res.data;
            const userId = responseData?.applicantUserId;
            const email = responseData?.emailAddress || responseData?.['email'];

            if (postData.approvalStatus == 3) {
              if (userId) {
                this.userManagementService.updateUserRole(String(userId), "ApprovedApplicant", email)
                  .subscribe(() => {
                    this._customNotificationService.notification(
                      "success",
                      "Success",
                      "User role updated to ApprovedApplicant."
                    );
                    this.decisionSubmitted.emit(postData);
                    this.modalRef.close(postData);
                    this.router.navigate(["/student-application/applicant-request-list"]);
                    this.isSubmitting = false;
                  });
              } else {
                this._customNotificationService.notification(
                  "error",
                  "Error",
                  "Could not find userId to update role."
                );
                this.isSubmitting = false;
              }
            } else {
              this._customNotificationService.notification(
                "success",
                "Success",
                "Your Decision is saved successfully."
              );
              this.decisionSubmitted.emit(postData);
              this.modalRef.close(postData);
              this.isSubmitting = false;
            }
          } else {
            this._customNotificationService.notification(
              "error",
              "Error",
              "Failed to save decision. Please try again."
            );
            this.isSubmitting = false;
          }
        }, error => {
          const apiMessage =
            error?.error?.message ||
            error?.error?.title ||
            "An error occurred while saving the decision. Please try again.";
          this._customNotificationService.notification(
            "error",
            "Error",
            apiMessage
          );
          this.isSubmitting = false;
        });
    } else {
      this._customNotificationService.notification(
        "warning",
        "Warning",
        "Please fill in all required fields before submitting."
      );
    }
  }

  cancel() {
    this.modalRef.close();
  }
}
