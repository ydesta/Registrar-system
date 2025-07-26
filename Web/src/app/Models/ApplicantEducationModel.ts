export interface ApplicantEducationModel {
  id: string;
  applicantID: string;
  applicant: any;
  schoollName: string;
  fieldOfStudy: string;
  programmeLevel: string;
  graduatedYear: number;
  createdDate: Date;
  lastModifiedDate: Date;
  lastModifiedBy: string;
  createdBy: string;
  isDeleted: boolean;
}

export interface EducationModel {
  createdBy: string;
  lastModifiedBy: string;
  applicantID: string;
  schoollName: string;
  fieldOfStudy: string;
  programmeLevel: string;
  graduatedYear: string;
  remark: string;
  attachFile: string;
}
