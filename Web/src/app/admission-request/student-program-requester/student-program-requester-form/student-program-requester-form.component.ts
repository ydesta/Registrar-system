import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { NzModalRef } from "ng-zorro-antd/modal";
import { EducationBackgroundService } from "../../services/education-background.service";
import { AcademicProgramRequest } from "../../model/academic-program-request.model";
import { AcademicProgramRequestService } from "../../services/academic-program-request.service";
import { AcadamicProgramme } from "../../model/acadamic-programme.model";
import { CustomNotificationService } from "src/app/services/custom-notification.service";
import { StaticData } from "../../model/StaticData";
import { Division_Status } from "src/app/common/constant";

@Component({
  selector: "app-student-program-requester-form",
  templateUrl: "./student-program-requester-form.component.html",
  styleUrls: ["./student-program-requester-form.component.scss"]
})
export class StudentProgramRequesterFormComponent implements OnInit {
 
  @Input() applicantId: string;
  @Output() dataUpdated = new EventEmitter<void>();
  @Input() studentProgramRequester: AcademicProgramRequest;
  academicProgramRequestForm: FormGroup;
  acadamicProgrammes: AcadamicProgramme[] = [];
  divisionStatusist: StaticData[] = [];
  id: number;
  constructor(
    private modalRef: NzModalRef,
    private _fb: FormBuilder,
    private _academicProgramRequestService: AcademicProgramRequestService,
    private _customNotificationService: CustomNotificationService
  ) {
    this.createAcademicProgramRequest();
  }
  ngOnInit(): void {
    // Validate that we have an applicantId
    if (!this.applicantId) {
      if (this.studentProgramRequester?.applicantId) {
        this.applicantId = this.studentProgramRequester.applicantId;
      }
    }
    
    this.getAcademicProgramList();
    this.getListOfDivisionStatus();
    if (this.studentProgramRequester != undefined) {
      this.id = this.studentProgramRequester.id;
      this.academicProgramRequestForm.patchValue(this.studentProgramRequester);
    }
  }

  createAcademicProgramRequest() {
    this.academicProgramRequestForm = this._fb.group({
      createdBy: ["-"],
      lastModifiedBy: ["-"],
      division: ["", [Validators.required]],
      acadamicProgrammeId: ["", [Validators.required]]
    });
  }

  private getAcademicProgramRequest(): AcademicProgramRequest {
    const formModel = this.academicProgramRequestForm.getRawValue();
    const request = new AcademicProgramRequest();
    
    // Ensure we have a valid applicantId
    if (!this.applicantId) {
      console.error("Error: applicantId is required but not available");
      throw new Error("Applicant ID is required but not available");
    }
    
    request.applicantId = this.applicantId;
    request.createdBy = "";
    request.acadamicProgrammeId = formModel.acadamicProgrammeId;
    request.division = formModel.division;
    request.studentStatus = 0;
    request.approvalStatus = 0;
    return request;
  }
  get acadamicProgrammeId() {
    return this.academicProgramRequestForm.get("acadamicProgrammeId");
  }
  get division() {
    return this.academicProgramRequestForm.get("division");
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
          console.error('Error loading academic programs:', error);
          this._customNotificationService.notification(
            "error",
            "Error",
            "Failed to load academic programs. Please try again."
          );
          this.acadamicProgrammes = [];
        }
      });
  }

  onCancel() {
    this.modalRef.close();
  }

  onSubmit() {
    if (this.academicProgramRequestForm.valid) {
      const postData = this.getAcademicProgramRequest();
      console.log("object         ", postData);
      if (this.id == undefined) {
        this._academicProgramRequestService.create(postData).subscribe({
          next: (res) => {
            if (res != null) {
              this._customNotificationService.notification(
                "success",
                "Success",
                "Academic Program Request is saved successfully."
              );
              this.dataUpdated.emit();
              this.modalRef.close();
            } else {
              this._customNotificationService.notification(
                "warn",
                "Warning",
                "Academic Program Request already exists or save failed."
              );
            }
          },
          error: (error) => {
            console.error('Error creating academic program request:', error);
            this._customNotificationService.notification(
              "error",
              "Error",
              "Failed to save academic program request. Please try again."
            );
          }
        });
      } else {
        postData.id = this.id;
        postData.applicantId = this.applicantId || this.studentProgramRequester?.applicantId;
        this._academicProgramRequestService
          .update(this.id, postData)
          .subscribe({
            next: (res) => {
              console.log("##      ", res);
              // Check if response indicates success
              const isSuccess = res === "success";
              
              if (isSuccess) {
                this._customNotificationService.notification(
                  "success",
                  "Success",
                  "Academic Program Request is updated successfully."
                );
                this.dataUpdated.emit();
                this.modalRef.close();
              } else {
                this._customNotificationService.notification(
                  "warn",
                  "Warning",
                  "Academic Program Request already exists or update failed."
                );
              }
            },
            error: (error) => {
              console.error('Error updating academic program request:', error);
              this._customNotificationService.notification(
                "error",
                "Error",
                "Failed to update academic program request. Please try again."
              );
            }
          });
      }
    } else {
      this._customNotificationService.notification(
        "warning",
        "Validation Error",
        "Please fill in all required fields correctly."
      );
    }
  }
  getListOfDivisionStatus() {
    let division: StaticData = new StaticData();
    Division_Status.forEach(pair => {
      division = {
        Id: pair.Id,
        Description: pair.Description
      };
      this.divisionStatusist.push(division);
    });
  }
}
