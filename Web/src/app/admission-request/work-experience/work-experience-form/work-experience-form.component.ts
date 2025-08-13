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
    if (this.applicantWorkExpForm.valid) {
      const postData = this.getApplicantWorkExperience();
      if (this.workExperinceId == undefined) {
        Object.keys(postData).forEach(key => {
          if (key !== "ActualFile") {
            if (this.formData.get(key) != postData[key]) {
              this.formData.append(key, postData[key]);
            }
          }
        });
        if (this.file_store != undefined) {
          for (let i = 0; i < this.file_store.length; i++) {
            this.formData.append("ActualFile", this.file_store[i]);
          }
        }
        this.workExperienceService
          .createExperience(this.formData)
          .subscribe(res => {
            if (res.status == "success") {
              this._customNotificationService.notification(
                "success",
                "Success",
                "Education Record is deleted succesfully."
              );
            }
            this.dataUpdated.emit();
            this.modalRef.close();
          });
      } else {
        postData.applicantID = this.workExperience.applicantID;
        postData.id = this.workExperinceId;
        this.workExperienceService
          .update(this.workExperinceId, postData)
          .subscribe(res => {
            if (res) {
              this._customNotificationService.notification(
                "success",
                "Success",
                "Education Record is update succesfully."
              );
            }
            this.dataUpdated.emit();
            this.modalRef.close();
          });
      }
    } else {
    }
  }
}
