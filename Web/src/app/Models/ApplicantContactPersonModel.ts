export interface ApplicantContactPersonModel {
  id: string;
  applicantID: string;
  applicant: any;
  fullName :  string ,
   telephoneOffice :  string ,
   telephoneHome :  string ,
   relation :  string ,
   sourceOfFinance :  string ,
   howDidYouComeKnow :  string 
  createdDate: Date;
  lastModifiedDate: Date;
  lastModifiedBy: string;
  createdBy: string;
  isDeleted: boolean;
}