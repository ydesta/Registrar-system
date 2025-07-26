export interface StudentAcademicStatusHistoryModel {
  id: string;
  studentID: string;
  student:any,
  academicStatusID: string;
  academicStatuses: any;
  date : Date,
  reason: string;
  remark: string;
  createdDate: Date;
  lastModifiedDate: Date;
  lastModifiedBy: string;
  createdBy: string;
  isDeleted: boolean;
}
