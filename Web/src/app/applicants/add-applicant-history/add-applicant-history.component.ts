import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { FileModel } from 'src/app/Models/FileModel';
import { CrudService } from 'src/app/services/crud.service';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-add-applicant-history',
  templateUrl: './add-applicant-history.component.html',
  styleUrls: ['./add-applicant-history.component.scss'],
})
export class AddApplicantHistoryComponent implements OnInit {
  action = 'Add Applicant Review';
  approveApplicantForm: FormGroup;
  applicantForm: FormGroup;
  applicantId: any;
  applicantFiles: FileModel[] = [];
  acadamicProgrammes: any;
  educationLists: any;
  contactPersonLists: any;
  applicantWorkExpForm: FormGroup;
  applicantContactPersonForm: FormGroup;
  workExpLists: any;
  applicant: any;
  submit = 'Approve';
  attachmentModal = false;
  attachmentpath: any;
  safeUrl!: SafeUrl;
  approvalId = '';
  approvarlStatus = 'Pending';

  batches?: any;
  entries?: any;
  constructor(
    private sanitizer: DomSanitizer,
    public aciveRoute: ActivatedRoute,
    private _route: Router,
    private _fb: FormBuilder,
    private _crudService: CrudService,
    private _customNotificationService: CustomNotificationService
  ) {
    this._crudService.getList('/batchs').subscribe((res: any) => {
      this.batches = res.data;
    });
    this.approveApplicantForm = this._fb.group({
      createdBy: ['-'],
      lastModifiedBy: ['-'],
      applicantID: ['', Validators.required],
      applicationDate: [null, Validators.required],
      approvalDate: [null, Validators.required],
      admissionDecision: ['', Validators.required],
      batchCode: [null, Validators.required],
      entryCode: [null, Validators.required],
    });
    this.applicantForm = this._fb.group({
      createdBy: ['-'],
      lastModifiedBy: ['-'],
      acadamicProgrammeCode: ['', Validators.required],
      applicantID: ['', Validators.required],
      applicantUserId: [''],
      firstName: ['', Validators.required],
      fatherName: ['', Validators.required],
      grandFatherName: ['', Validators.required],
      sirName: [''],
      motherName: ['', Validators.required],
      gender: ['', Validators.required],
      birthDate: [null, Validators.required],
      birthPlace: ['', Validators.required],
      nationality: ['', Validators.required],
      //virtual
      telephonOffice: [''],
      telephonHome: [''],
      mobile: [''],
      postalAddress: [''],
      emailAddress: [''],
      region: [''],
      city: [''],
      woreda: [''],
      kebele: [''],
      selfConfirmedApplicantInformation: false,
      dateOfApply: null,
      sourceOfFinance: [''],
      howDidYouComeKnow: [''],

      applicationDate: [null, Validators.required],
      approvalDate: [new Date(), Validators.required],
      admissionDecision: ['', Validators.required],
      batchCode: [null, Validators.required],
      entryCode: [null, Validators.required],
    });
    this.applicantWorkExpForm = this._fb.group({
      createdBy: ['-'],
      lastModifiedBy: ['-'],
      applicantID: [''],
      companyName: ['', Validators.required],
      totalWorkYear: [0, Validators.required],
      post: [''],
    });
    this.applicantContactPersonForm = this._fb.group({
      createdBy: ['-'],
      lastModifiedBy: ['-'],
      applicantID: [''],
      fullName: ['', Validators.required],
      telephoneOffice: ['', Validators.required],
      telephoneHome: [''],
      relation: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.applicantId = this.aciveRoute.snapshot.paramMap.get('id');
    if (this.applicantId != 'null') {
      this.action = 'Applicant Review';
      this._crudService
        .getList('/Applicants' + '/' + this.applicantId)
        .subscribe((res: any) => {
          this.applicant = res.data;
          this.applicantFiles = res.data.files;
          this.applicantForm.patchValue({
            applicantID: res.data.applicantID,
            applicationDate: res.data.dateOfApply,
          });
          this._crudService
            .getList(
              '/ApplicantHistorys/applicant/' +
                res.data.applicantID.replace('/', '%2F')
            )
            .subscribe((res: any) => {
              if (res.data != null) {
                this.approvarlStatus = res.data.admissionDecision;
                this.patchValues(res.data);
                this.approvalId = res.data.id;
                this.submit = 'Save Changes';
              }
            });
          this.patchApplicantValues(res.data);
          this._crudService
            .getList(
              '/ApplicantEducationBackgrounds/applicantId/' +
                res.data.applicantID.replace('/', '%2F')
            )
            .subscribe((res: any) => {
              this.educationLists = res.data;
            });
          this._crudService
            .getList(
              '/ApplicantContactPersons/applicant/' +
                res.data.applicantID.replace('/', '%2F')
            )
            .subscribe((res: any) => {
              this.patchContactPerson(res.data);
            });
          this._crudService
            .getList(
              '/ApplicantWorkExperiences/applicant/' +
                res.data.applicantID.replace('/', '%2F')
            )
            .subscribe((res: any) => {
              this.patchWorkExpPerson(res.data);
            });
        });
    }
    this._crudService.getList('/AcadamicProgramme').subscribe((res: any) => {
      this.acadamicProgrammes = res.data;
    });

    this._crudService.getList('/entrys').subscribe((res: any) => {
      this.entries = res.data;
    });
  }
  submitForm() {
    if (this.applicantForm.valid) {
      if (this.approvalId == '') {
        this._crudService
          //.add('/ApplicantHistorys', this.approveApplicantForm.value)
          .update(
            '/applicants/ApproveApplicant',
            this.applicantId,
            this.applicantForm.value
          )
          .subscribe((res: any) => {
            this._customNotificationService.notification(
              'success',
              'Success',
              res.data
            );
            //this._route.navigateByUrl('applicants/applicant-history');
            this._route.navigateByUrl('applicants');
          });
      } else if (this.approvalId != '') {
        if (this.approveApplicantForm.valid) {
          this._crudService
            .update(
              '/ApplicantHistorys',
              this.approvalId,
              this.approveApplicantForm.value
            )
            .subscribe((res: any) => {
              if (res.status == 'success') {
                this._customNotificationService.notification(
                  'success',
                  'Success',
                  res.data
                );
                this._route.navigateByUrl('applicants/applicant-history');
              } else {
                this._customNotificationService.notification(
                  'error',
                  'Error',
                  res.data
                );
              }
            });
        }
      }
    } else {
      this._customNotificationService.notification(
        'error',
        'error',
        'Enter valid data.'
      );
    }
  }
  patchValues(data: any) {
    this.approveApplicantForm.patchValue({
      applicantID: data.applicantID,
      applicationDate: data.applicationDate,
      approvalDate: data.approvalDate,
      admissionDecision: data.admissionDecision,
    });
  }
  patchApplicantValues(data: any) {
    this.applicantForm.patchValue({
      applicantID: data.applicantID,
      applicantUserId: data.applicantUserId,
      photo: data.photo,
      firstName: data.firstName,
      fatherName: data.fatherName,
      grandFatherName: data.grandFatherName,
      sirName: data.sirName,
      motherName: data.motherName,
      gender: data.gender,
      birthDate: data.birthDate,
      birthPlace: data.birthPlace,
      nationality: data.nationality,
      telephonOffice: data.telephonOffice,
      telephonHome: data.telephonHome,
      mobile: data.mobile,
      postalAddress: data.postalAddress,
      emailAddress: data.emailAddress,
      region: data.region,
      city: data.city,
      woreda: data.woreda,
      kebele: data.kebele,
      acadamicProgrammeCode: data.acadamicProgrammeCode,
      howDidYouComeKnow: data.howDidYouComeKnow,
      sourceOfFinance: data.sourceOfFinance,
      selfConfirmedApplicantInformation: data.selfConfirmedApplicantInformation,
      dateOfApply: data.dateOfApply,
      admissionDecision: data.admissionDecision,
    });
  }
  openAttachmentModal(fileName: any) {
    this.safeUrl =
      environment.fileUrl + '/Resources/Files/' + 'academic programme.pdf';
    this.attachmentModal = true;
  }
  transform(url: any) {
    return (this.attachmentpath = this.sanitizer.bypassSecurityTrustResourceUrl(
      'https://vadimdez.github.io/ng2-pdf-viewer/assets/pdf-test.pdf'
    ));
  }
  handleCancel() {
    this.attachmentModal = false;
    this.attachmentpath = '';
  }
  handleOk() {
    this.attachmentModal = false;
    this.attachmentpath = '';
  }
  patchContactPerson(value: any) {
    this.applicantContactPersonForm = this._fb.group({
      createdBy: value.createdBy,
      lastModifiedBy: value.lastModifiedBy,
      applicantID: value.applicantID,
      fullName: value.fullName,
      telephoneOffice: value.telephoneOffice,
      telephoneHome: value.telephoneHome,
      relation: value.relation,
    });
  }
  patchWorkExpPerson(value: any) {
    this.applicantWorkExpForm = this._fb.group({
      createdBy: value.createdBy,
      lastModifiedBy: value.lastModifiedBy,
      applicantID: value.applicantID,
      companyName: value.companyName,
      totalWorkYear: value.totalWorkYear,
      post: value.post,
    });
  }
}
