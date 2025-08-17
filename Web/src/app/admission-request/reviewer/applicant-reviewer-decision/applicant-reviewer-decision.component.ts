import { Component, OnInit, Input, Output, EventEmitter } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { GeneralInformationService } from "../../services/general-information.service";
import { AcademicProgramRequest } from "../../model/academic-program-request.model";
import { ActivatedRoute, Router } from "@angular/router";
import { CustomNotificationService } from "src/app/services/custom-notification.service";
import { UserManagementService } from 'src/app/services/user-management.service';
import { NzModalRef } from "ng-zorro-antd/modal";

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
  
  constructor(
    private fb: FormBuilder,
    private _generalInformationService: GeneralInformationService,
    private route: ActivatedRoute,
    private router: Router,
    private _customNotificationService: CustomNotificationService,
    private userManagementService: UserManagementService,
    private modalRef: NzModalRef
  ) {
    this.createReviewerForm();
    route.queryParams.subscribe(p => {
      this.id = p["request-id"];
    });
  }
  
  ngOnInit(): void {
    this.admissionDecision.valueChanges.subscribe(value => {
      if (value === "4" || value === "2") {
        this.reviewerForm.get("remark").setValidators(Validators.required);
      } else {
        this.reviewerForm.get("remark").clearValidators();
      }
      this.reviewerForm.get("remark").updateValueAndValidity();
    });
  }
  
  createReviewerForm() {
    this.reviewerForm = this.fb.group({
      admissionDecision: ["", Validators.required],
      remark: [null, [Validators.maxLength(250)]]
    });
  }
  
  get admissionDecision() {
    return this.reviewerForm.get("admissionDecision");
  }
  
  private getApplicantReviewerDecision(): AcademicProgramRequest {
    const formModel = this.reviewerForm.getRawValue();
    const generalUserInfo = new AcademicProgramRequest();
    
    // Use the academicProgramRequest ID if available, otherwise use the passed id
    generalUserInfo.id = this.academicProgramRequest?.id || this.id || 0;
    generalUserInfo.applicantId = this.applicantId || this.academicProgramRequest?.applicantId;
    generalUserInfo.acadamicProgrammeId = this.academicProgramId || this.academicProgramRequest?.acadamicProgrammeId;
    generalUserInfo.approvalStatus = formModel.admissionDecision;
    generalUserInfo.remark = formModel.remark;
    
    return generalUserInfo;
  }
  
  submitForm() {
    if (this.reviewerForm.valid) {
      const postData = this.getApplicantReviewerDecision();
      
      // Validate that we have the required IDs
      if (!postData.applicantId || !postData.acadamicProgrammeId) {
        this._customNotificationService.notification(
          "error",
          "Error",
          "Missing required information: Applicant ID or Academic Program ID."
        );
        return;
      }
      
      this._generalInformationService
        .applicantReviewerDecision(postData.id, postData)
        .subscribe(res => {
          if (res.status=="success") {
            const userId = res.data.applicantUserId;
            const email = res.data.emailAddress;
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
                  });
              } else {
                this._customNotificationService.notification(
                  "error",
                  "Error",
                  "Could not find userId to update role."
                );
              }
            } else {
              this._customNotificationService.notification(
                "success",
                "Success",
                "Your Decision is saved successfully."
              );
              this.decisionSubmitted.emit(postData);
              this.modalRef.close(postData);
            }
          }
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
