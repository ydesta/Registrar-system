export interface ApplicantHistoryModel {
  id: string;
  applicantID: string;
  applicant: any;
  applicationDate: Date;
  approvalDate: Date;
  admissionDecision: string;
  createdDate: Date;
  lastModifiedDate: Date;
  lastModifiedBy: string;
  createdBy: string;
  isDeleted: boolean;
}