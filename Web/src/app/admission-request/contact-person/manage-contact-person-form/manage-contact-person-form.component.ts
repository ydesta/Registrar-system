import { Component } from "@angular/core";
import { ApplicantContactPersonRequest } from "../../model/applicant-contact-person-request.model";
import { NzModalRef, NzModalService } from "ng-zorro-antd/modal";
import { ActivatedRoute } from "@angular/router";
import { CustomNotificationService } from "src/app/services/custom-notification.service";
import { GeneralInformationService } from "../../services/general-information.service";
import { ApplicantContactPersonService } from "../../services/applicant-contact-person.service";
import { ContactPersonFormComponent } from "../contact-person-form/contact-person-form.component";
import { SharingDataService } from "../../services/sharing-data.service";
import { Subscription } from "rxjs";

@Component({
  selector: "app-manage-contact-person-form",
  templateUrl: "./manage-contact-person-form.component.html",
  styleUrls: ["./manage-contact-person-form.component.scss"]
})
export class ManageContactPersonFormComponent {
  contactPersonLists: ApplicantContactPersonRequest[] = [];
  applicantId: string;
  userId: string;
  ContactIndex = -1;
  noumberOfContact = 0;
  isSubmittedApplicationForm = 0;
  isApplicantProfile: boolean = false;
    private subscription!: Subscription;
  constructor(
    private modalRef: NzModalRef,
    private _modal: NzModalService,
    private _customNotificationService: CustomNotificationService,
    private route: ActivatedRoute,
    private generalInformationService: GeneralInformationService,
    private applicantContactPersonService: ApplicantContactPersonService,
    private sharingDataService: SharingDataService
  ) {
     this.userId = localStorage.getItem('userId');
    route.queryParams.subscribe(p => {
      this.applicantId = p["id"];
      if (this.applicantId != undefined) {
        this.getApplicantContactPersonByApplicantId(this.applicantId);
      }
    });
  }
  ngOnInit(): void {
    const userId = localStorage.getItem('userId');
    this.generalInformationService.getOrStoreParentApplicantId(userId).subscribe(applicantId => {
      this.applicantId = applicantId;
      this.getApplicantContactPersonByApplicantId(applicantId);
    });
    this.sharingDataService.programCurrentMessage.subscribe(res => {
      this.isSubmittedApplicationForm = res;
    });
    this.subscription = this.sharingDataService.currentApplicantProfile.subscribe(
      status => {
        this.isApplicantProfile = status;        
      }
    );
  }

  deleteContact(id: string) {
    this._modal.confirm({
      nzTitle: "Are you sure delete this Contact Record?",
      nzOkText: "Yes",
      nzOkType: "primary",
      nzOkDanger: true,
      nzOnOk: () => {
        try {
          this.applicantContactPersonService.delete(id).subscribe(res => {
            if (res) {
              this._customNotificationService.notification(
                "success",
                "Success",
                "Contact Record is deleted succesfully."
              );
              this.getApplicantContactPersonByApplicantId(this.applicantId);
            }
          });
        } catch (error) {
          this._customNotificationService.notification(
            "error",
            "Error",
            "Try again."
          );
        }
      },
      nzCancelText: "No",
      nzOnCancel: () => {}
    });
  }

  getApplicantContactPersonByApplicantId(id: string) {
    this.applicantContactPersonService
      .getApplicantContactPersonId(id)
      .subscribe(res => {
        this.contactPersonLists = res.data;
        this.noumberOfContact = this.contactPersonLists.length;
        this.sharingDataService.updateMessage(this.noumberOfContact);
      });
  }

  openModal(): void {
    const modal: NzModalRef = this._modal.create({
      nzTitle: "Applicant Contact Person",
      nzContent: ContactPersonFormComponent,
      nzComponentParams: {
        applicationId: this.applicantId
      },
      nzMaskClosable: false,
      nzFooter: null
    });
    modal.afterClose.subscribe(() => {
      this.getApplicantContactPersonByApplicantId(this.applicantId);
    });
  }

  editModal(data: ApplicantContactPersonRequest): void {
    const modal: NzModalRef = this._modal.create({
      nzTitle: "Edit Applicant Contact Person",
      nzContent: ContactPersonFormComponent,
      nzComponentParams: {
        contactPerson: data
      },
      nzMaskClosable: false,
      nzFooter: null
    });
    modal.afterClose.subscribe(() => {
      this.getApplicantContactPersonByApplicantId(this.applicantId);
    });
  }

  closeModal(): void {
    this.modalRef.close();
  }
  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
