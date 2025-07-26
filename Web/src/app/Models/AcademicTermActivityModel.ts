export interface AcademicTermActivityModel {
  id: string;
  academicTermCode: string;
  academicTerm: any;
  activityID: string;
  activities: any;
  activityStartDate: Date;
  activityEndDate: Date;
  remark: string;
  createdDate: Date;
  lastModifiedDate: Date;
  lastModifiedBy: string;
  createdBy: string;
  isDeleted: boolean;
  title: string;
}
