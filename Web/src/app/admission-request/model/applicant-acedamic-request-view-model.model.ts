export class ApplicantAcedamicRequestViewModel {
  public id: string;
  public requestId: number;
  public applicantId: string;
  public fullName: string;
  public gender: string;
  public mobile: string;
  public email: string;
  public academicProgramme: string;
  public nationality: string;
  public approvalStatus: number;
  public appliedDate: number;
}

export interface ApplicantIncompleteResponse {
  applicantId: string;
  fullName: string;
  requestDate: string;
  mobile: string;
  educationBackground: string;
  personalContact: string;
  applicantWorkExperiences: string;
  academicProgramRequest: string;
  studentPayments: string;
  finalSubmit: string;
}

