import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { NzModalRef } from "ng-zorro-antd/modal";
import {
  alphabetsOnlyValidator,
  alphabetsWithSpecialCharsValidator,
  EDUCATION_LEVEL_OPTIONS
} from "src/app/common/constant";
import { ApplicantEducationBackgroundRequest } from "../../model/applicant-education-background-request.model";
import { EducationBackgroundService } from "../../services/education-background.service";
import { CustomNotificationService } from "src/app/services/custom-notification.service";

@Component({
  selector: "app-education-form",
  templateUrl: "./education-form.component.html",
  styleUrls: ["./education-form.component.scss"]
})
export class EducationFormComponent implements OnInit {
  @Input() applicationId: string;
  @Input() educationBackground: ApplicantEducationBackgroundRequest;
  applicantEducationBacgroundForm: FormGroup;
  educationFile = "";
  formData = new FormData();
  file_store: FileList;
  file_list: Array<string> = [];
  @Output() dataUpdated = new EventEmitter<void>();
  educationId: string;
  
  // Education level options for the select dropdown
  educationLevelOptions = EDUCATION_LEVEL_OPTIONS;
  constructor(
    private modalRef: NzModalRef,
    private _fb: FormBuilder,
    private educationBackgroundService: EducationBackgroundService,
    private _customNotificationService: CustomNotificationService
  ) {
    this.createEducationBackground();
  }

  ngOnInit(): void {
    if (this.educationBackground != undefined) {
      this.educationId = this.educationBackground.id;
      
      // Convert graduatedYear string to array format for range picker
      const educationData: any = { ...this.educationBackground };
      if (educationData.graduatedYear && typeof educationData.graduatedYear === 'string') {
        const yearParts = educationData.graduatedYear.split(',');
        if (yearParts.length === 2) {
          // Convert to Date objects for the range picker
          educationData.graduatedYear = [
            new Date(parseInt(yearParts[0].trim()), 0, 1), // Start year
            new Date(parseInt(yearParts[1].trim()), 11, 31) // End year
          ];
        }
      }
      
      this.applicantEducationBacgroundForm.patchValue(educationData);
      
      // Set initial validation based on existing programme level
      const programmeLevel = this.educationBackground.programmeLevel;
      if (programmeLevel) {
        this.updateFieldOfStudyValidation(programmeLevel);
      }
    } else {
      // Clear file-related data for new records
      this.file_store = undefined;
      this.file_list = [];
      this.educationFile = "";
      this.formData = new FormData();
    }
  }
  closeModal(): void {
    this.modalRef.close();
  }
  createEducationBackground() {
    this.applicantEducationBacgroundForm = this._fb.group({
      createdBy: ["-"],
      lastModifiedBy: ["-"],
      applicantID: [""],
      schoollName: [
        "",
        [Validators.required, alphabetsWithSpecialCharsValidator()]
      ],
      fieldOfStudy: [
        "",
        [alphabetsWithSpecialCharsValidator()]
      ],
      programmeLevel: [
        "",
        [Validators.required]
      ],
      graduatedYear: ["", Validators.required],
      remark: [""],
      ActualFile: ["",Validators.required]
    });

    // Subscribe to programmeLevel changes to update fieldOfStudy validation
    this.applicantEducationBacgroundForm.get('programmeLevel')?.valueChanges.subscribe(level => {
      this.updateFieldOfStudyValidation(level);
    });
  }
  private getApplicantEducationBackground(): ApplicantEducationBackgroundRequest {
    const formModel = this.applicantEducationBacgroundForm.getRawValue();
    const education = new ApplicantEducationBackgroundRequest();
    education.applicantID = this.applicationId;
    education.createdBy = "";
    education.fieldOfStudy = formModel.fieldOfStudy;
    
    // Convert graduatedYear array back to string format
    if (Array.isArray(formModel.graduatedYear) && formModel.graduatedYear.length === 2) {
      const startYear = formModel.graduatedYear[0].getFullYear();
      const endYear = formModel.graduatedYear[1].getFullYear();
      education.graduatedYear = `${startYear},${endYear}`;
    } else {
      education.graduatedYear = formModel.graduatedYear ? formModel.graduatedYear.toString() : "";
    }
    
    education.programmeLevel = formModel.programmeLevel;
    education.remark = formModel.remark;
    education.schoollName = formModel.schoollName;
    return education;
  }
  get schoollName() {
    return this.applicantEducationBacgroundForm.get("schoollName");
  }
  get fieldOfStudy() {
    return this.applicantEducationBacgroundForm.get("fieldOfStudy");
  }

  get isFieldOfStudyRequired() {
    const programmeLevel = this.applicantEducationBacgroundForm.get("programmeLevel")?.value;
    return this.isGraduatedStudent(programmeLevel);
  }
  get programmeLevel() {
    return this.applicantEducationBacgroundForm.get("programmeLevel");
  }
  get graduatedYear() {
    return this.applicantEducationBacgroundForm.get("graduatedYear");
  }
  
  get actualFile() {
    return this.applicantEducationBacgroundForm.get("ActualFile");
  }
  
  remark() {
    return this.applicantEducationBacgroundForm.get("remark");
  }

  private isGraduatedStudent(programmeLevel: string): boolean {
    const graduatedLevels = [
      "Bachelor's Degree",
      "Master's Degree", 
      "Doctorate (Ph.D.)",
      "Associate's Degree",
      "Certificate/Diploma"
    ];
    return graduatedLevels.includes(programmeLevel);
  }

  get isFieldOfStudyVisible(): boolean {
    const programmeLevel = this.applicantEducationBacgroundForm.get("programmeLevel")?.value;
    // Hide field of study for High School Complete, show for all others
    return programmeLevel !== "High School Complete";
  }

  private updateFieldOfStudyValidation(programmeLevel: string): void {
    const fieldOfStudyControl = this.applicantEducationBacgroundForm.get("fieldOfStudy");
    
    if (programmeLevel === "High School Complete") {
      // Clear field of study value and remove validators for High School Complete
      fieldOfStudyControl?.setValue("");
      fieldOfStudyControl?.setValidators([alphabetsWithSpecialCharsValidator()]);
    } else if (this.isGraduatedStudent(programmeLevel)) {
      // Add required validator for graduated students
      fieldOfStudyControl?.setValidators([Validators.required, alphabetsWithSpecialCharsValidator()]);
    } else {
      // Remove required validator for other non-graduated students
      fieldOfStudyControl?.setValidators([alphabetsWithSpecialCharsValidator()]);
    }
    
    // Update validation status
    fieldOfStudyControl?.updateValueAndValidity();
  }

  getFileUploadStatus() {
    const fileControl = this.applicantEducationBacgroundForm.get("ActualFile");
    if (fileControl && fileControl.invalid && (fileControl.dirty || fileControl.touched)) {
      return 'error';
    }
    return '';
  }

  //#region File upload Function

  handleFileInputChange(files: FileList): void {
    this.file_store = files;
    const fileControl = this.applicantEducationBacgroundForm.get("ActualFile");
    
    if (files.length) {
      const count = files.length > 1 ? ` (+${files.length - 1} files)` : "";
      this.applicantEducationBacgroundForm.patchValue({
        ActualFile: `${files[0].name}${count}`
      });

      this.file_list = []; // Clear previous files
      for (let i = 0; i < files.length; i++) {
        this.file_list.push(files[i].name);
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.educationFile = e.target.result;
        };
        reader.readAsDataURL(files[i]);
      }
    } else {
      this.applicantEducationBacgroundForm.patchValue({
        ActualFile: ""
      });
      this.file_list = []; // Clear files if no selection
    }
    
    // Mark the control as touched to trigger validation
    if (fileControl) {
      fileControl.markAsTouched();
    }
  }

  handleSubmit() {
    var fd = new FormData();
    for (let i = 0; i < this.file_store.length; i++) {
      fd.append("Files", this.file_store[i]);
    }

    // Now you can use 'fd' to send files to the server using HTTP request
    // You can also send additional data along with the files if needed
  }
  //#endregion

  onSave(): void {
    if (this.applicantEducationBacgroundForm.valid) {
      const postData = this.getApplicantEducationBackground();
      if (this.educationId == undefined) {
        // Check if files are uploaded for new records
        if (!this.file_store || this.file_store.length === 0) {
          this._customNotificationService.notification(
            "warning",
            "File Required",
            "Please upload at least one document before saving."
          );
          return;
        }
        
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
        this.educationBackgroundService
          .createEducation(this.formData)
          .subscribe({
            next: (res) => {
              if (res) {
                this._customNotificationService.notification(
                  "success",
                  "Success",
                  "Applicant Education is saved successfully."
                );
                // Emit the event when data is successfully saved
                this.dataUpdated.emit();
                // Close the modal here if needed
                this.modalRef.close();
              }
            },
            error: (error) => {
              console.error('Error creating education:', error);
              this._customNotificationService.notification(
                "error",
                "Error",
                "Failed to save education record. Please try again."
              );
            }
          });
      } else {
        postData.id = this.educationId;
        postData.applicantID = this.educationBackground.applicantID;
        this.educationBackgroundService
          .update(this.educationId, postData)
          .subscribe({
            next: (res) => {
              if (res) {
                this._customNotificationService.notification(
                  "success",
                  "Success",
                  "Applicant Education is updated successfully."
                );
                // Emit the event when data is successfully saved
                this.dataUpdated.emit();
                // Close the modal here if needed
                this.modalRef.close();
              }
            },
            error: (error) => {
              console.error('Error updating education:', error);
              this._customNotificationService.notification(
                "error",
                "Error",
                "Failed to update education record. Please try again."
              );
            }
          });
      }
    } else {
      // Form is invalid, show validation errors
      this._customNotificationService.notification(
        "warning",
        "Validation Error",
        "Please fill in all required fields correctly."
      );
    }
  }
}
