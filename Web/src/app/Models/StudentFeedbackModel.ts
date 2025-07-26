export interface StudentFeedbackModel {
  id: string;
  comments: string;
  date: Date;
  remark: string;
  createdDate: Date;
  lastModifiedDate: Date;
  lastModifiedBy: string;
  createdBy: string;
  isDeleted: boolean;
}
