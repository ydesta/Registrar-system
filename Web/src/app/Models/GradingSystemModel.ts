export interface GradingSystemModel {
  id: string;
  grade : string ,
  gradeDescription : string ,
  point : number,
  remark: string;
  createdDate: Date;
  lastModifiedDate: Date;
  lastModifiedBy: string;
  createdBy: string;
  isDeleted: boolean;
}
