import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import {
  alphabetsWithSpecialCharsValidator,
  numbersOnlyValidator
} from "src/app/common/constant";
import { ApplicantWorkExperienceRequest } from "../../model/applicant-work-experience-request.model";
import { NzModalRef } from "ng-zorro-antd/modal";
import { WorkExperienceService } from "../../services/work-experience.service";
import { CustomNotificationService } from "src/app/services/custom-notification.service";

@Component({
  selector: "app-work-experience-form",
  templateUrl: "./work-experience-form.component.html",
  styleUrls: ["./work-experience-form.component.scss"]
})
export class WorkExperienceFormComponent implements OnInit {
  haveWorkExperience = false;
  workExpeFile = "";
  applicantWorkExpForm: FormGroup;
  @Input() applicationId: string;
  @Input() workExperience: ApplicantWorkExperienceRequest;
  eexperinceFile = "";
  formData = new FormData();
  file_store: FileList;
  file_list: Array<string> = [];
  @Output() dataUpdated = new EventEmitter<void>();
  workExperinceId: string;
  isSubmitting = false;
  constructor(
    private _fb: FormBuilder,
    private modalRef: NzModalRef,
    private workExperienceService: WorkExperienceService,
    private _customNotificationService: CustomNotificationService
  ) {
    this.createWorkExperience();
  }
  ngOnInit(): void {
    if (this.workExperience != undefined) {
      this.workExperinceId = this.workExperience.id;
      this.applicantWorkExpForm.patchValue(this.workExperience);
    }
  }

  closeModal(): void {
    this.modalRef.close();
  }

  haveWorkExpe() {
    this.haveWorkExperience = !this.haveWorkExperience;
  }
  createWorkExperience() {
    this.applicantWorkExpForm = this._fb.group({
      createdBy: ["-"],
      lastModifiedBy: ["-"],
      applicantID: [""],
      companyName: [
        "",
        [Validators.required, alphabetsWithSpecialCharsValidator()]
      ],
      totalWorkYear: [0, [Validators.required, numbersOnlyValidator()]],
      post: [""],
      ActualFile: [""]
    });
  }
  get companyName() {
    return this.applicantWorkExpForm.get("companyName");
  }
  get totalWorkYear() {
    return this.applicantWorkExpForm.get("totalWorkYear");
  }
  private getApplicantWorkExperience(): ApplicantWorkExperienceRequest {
    const formModel = this.applicantWorkExpForm.getRawValue();
    const education = new ApplicantWorkExperienceRequest();
    education.applicantID = this.applicationId;
    education.createdBy = "";
    education.companyName = formModel.companyName;
    education.totalWorkYear = formModel.totalWorkYear;
    education.post = formModel.post;
    return education;
  }

  handleFileInputChange(files: FileList): void {
    this.file_store = files;
    if (files.length) {
      const count = files.length > 1 ? ` (+${files.length - 1} files)` : "";
      this.applicantWorkExpForm.patchValue({
        ActualFile: `${files[0].name}${count}`
      });

      this.file_list = []; // Clear previous files
      for (let i = 0; i < files.length; i++) {
        this.file_list.push(files[i].name);
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.workExpeFile = e.target.result;
        };
        reader.readAsDataURL(files[i]);
      }
    } else {
      this.applicantWorkExpForm.patchValue({
        ActualFile: ""
      });
      this.file_list = []; // Clear files if no selection
    }
  }

  removeFile(index: number): void {
    if (index >= 0 && index < this.file_list.length) {
      this.file_list.splice(index, 1);
      if (this.file_store) {
        const newFileList = new DataTransfer();
        for (let i = 0; i < this.file_store.length; i++) {
          if (i !== index) {
            newFileList.items.add(this.file_store[i]);
          }
        }
        this.file_store = newFileList.files;
      }
      if (this.file_list.length === 0) {
        this.applicantWorkExpForm.patchValue({
          ActualFile: ""
        });
        this.workExpeFile = "";
      } else {
        const count = this.file_list.length > 1 ? ` (+${this.file_list.length - 1} files)` : "";
        this.applicantWorkExpForm.patchValue({
          ActualFile: `${this.file_list[0]}${count}`
        });
      }
    }
  }

  handleSubmit() {
    var fd = new FormData();
    for (let i = 0; i < this.file_store.length; i++) {
      fd.append("Files", this.file_store[i]);
    }
  }

  onSave(): void {
    if (this.isSubmitting) {
      return;
    }

    if (this.applicantWorkExpForm.valid) {
      const postData = this.getApplicantWorkExperience();
      if (this.workExperinceId == undefined) {
        this.isSubmitting = true;
        const formData = new FormData();
        Object.keys(postData).forEach(key => {
          if (key !== "ActualFile" && postData[key] != null && postData[key] !== undefined) {
            formData.append(key, postData[key]);
          }
        });
        if (this.file_store != undefined) {
          for (let i = 0; i < this.file_store.length; i++) {
            formData.append("ActualFile", this.file_store[i]);
          }
        }
        this.workExperienceService
          .createExperience(formData)
          .subscribe({
            next: (res) => {
              this.isSubmitting = false;
              if (res?.status === "error") {
                this._customNotificationService.notification(
                  "warning",
                  "Duplicate",
                  res?.error || res?.data || "This work experience record already exists."
                );
                return;
              }
              if (res?.status == "success" || res) {
                this._customNotificationService.notification(
                  "success",
                  "Success",
                  "Work experience is saved successfully."
                );
              }
              this.dataUpdated.emit();
              this.modalRef.close();
            },
            error: (error) => {
              this.isSubmitting = false;
              const apiMessage =
                error?.error?.error ||
                error?.error?.data ||
                error?.error?.message ||
                "Failed to save work experience. Please try again.";
              this._customNotificationService.notification(
                "error",
                "Error",
                apiMessage
              );
            }
          });
      } else {
        this.isSubmitting = true;
        postData.applicantID = this.workExperience.applicantID;
        postData.id = this.workExperinceId;
        this.workExperienceService
          .update(this.workExperinceId, postData)
          .subscribe({
            next: (res) => {
              this.isSubmitting = false;
              if (res) {
                this._customNotificationService.notification(
                  "success",
                  "Success",
                  "Work experience is updated successfully."
                );
              }
              this.dataUpdated.emit();
              this.modalRef.close();
            },
            error: () => {
              this.isSubmitting = false;
              this._customNotificationService.notification(
                "error",
                "Error",
                "Failed to update work experience. Please try again."
              );
            }
          });
      }
    }
  }
}
