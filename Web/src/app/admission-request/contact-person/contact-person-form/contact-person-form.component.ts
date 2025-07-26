import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ApplicantContactPersonRequest } from "../../model/applicant-contact-person-request.model";
import { NzModalRef } from "ng-zorro-antd/modal";
import {
  alphabetsWithSpecialCharsValidator,
  phoneValidator
} from "src/app/common/constant";
import { CustomNotificationService } from "src/app/services/custom-notification.service";
import { ApplicantContactPersonService } from "../../services/applicant-contact-person.service";

@Component({
  selector: "app-contact-person-form",
  templateUrl: "./contact-person-form.component.html",
  styleUrls: ["./contact-person-form.component.scss"]
})
export class ContactPersonFormComponent implements OnInit {
  @Input() applicationId: string;
  @Input() contactPerson: ApplicantContactPersonRequest;
  applicantContactPersonForm: FormGroup;
  contactId: string;
  /**
   *
   */
  @Output() dataUpdated = new EventEmitter<void>();
  constructor(
    private modalRef: NzModalRef,
    private _fb: FormBuilder,
    private _applicantContactPersonService: ApplicantContactPersonService,
    private _customNotificationService: CustomNotificationService
  ) {
    this.createEducationBackground();
  }

  ngOnInit(): void {
    if (this.contactPerson != undefined) {
      this.contactId = this.contactPerson.id;
      this.applicantContactPersonForm.patchValue(this.contactPerson);
    }
  }
  closeModal(): void {
    this.modalRef.close();
  }
  createEducationBackground() {
    this.applicantContactPersonForm = this._fb.group({
      createdBy: ["-"],
      lastModifiedBy: ["-"],
      applicantID: [""],
      fullName: ["", [Validators.required, alphabetsWithSpecialCharsValidator]],
      telephoneHome: ["", [Validators.required, phoneValidator()]],
      telephoneOffice: ["", [phoneValidator()]],
      relation: ["", Validators.required]
    });
  }
  private getApplicantContactPerson(): ApplicantContactPersonRequest {
    const formModel = this.applicantContactPersonForm.getRawValue();
    const contact = new ApplicantContactPersonRequest();
    contact.applicantID = this.applicationId;
    contact.createdBy = "";
    contact.fullName = formModel.fullName;
    contact.telephoneHome = formModel.telephoneHome;
    contact.telephoneOffice = formModel.telephoneOffice;
    contact.relation = formModel.relation;
    return contact;
  }
  get fullName() {
    return this.applicantContactPersonForm.get("fullName");
  }
  get telephoneHome() {
    return this.applicantContactPersonForm.get("telephoneHome");
  }
  get telephoneOffice() {
    return this.applicantContactPersonForm.get("telephoneOffice");
  }
  get relation() {
    return this.applicantContactPersonForm.get("relation");
  }
  onSubmit() {
    const postData = this.getApplicantContactPerson();
    if (this.contactId == undefined) {
      this._applicantContactPersonService.create(postData).subscribe(res => {
        if (res != null) {
          this._customNotificationService.notification(
            "success",
            "Success",
            "Applicant Contact  is save succesfully."
          );
          // Emit the event when data is successfully saved
          this.dataUpdated.emit();
          // Close the modal here if needed
          this.modalRef.close();
        } else {
          this._customNotificationService.notification(
            "warn",
            "Warn",
            "Applicant Contact does not depulicate."
          );
        }
      });
    } else {
      postData.id = this.contactId;
      postData.applicantID = this.contactPerson.applicantID;
      this._applicantContactPersonService
        .updateContact(this.contactId, postData)
        .subscribe(res => {
          if (res != null) {
            this._customNotificationService.notification(
              "success",
              "Success",
              "Applicant Contact  is update succesfully."
            );
            // Emit the event when data is successfully saved
            this.dataUpdated.emit();
            // Close the modal here if needed
            this.modalRef.close();
          } else {
            this._customNotificationService.notification(
              "warn",
              "Warn",
              "Applicant Contact does not depulicate."
            );
          }
        });
    }
  }
}
