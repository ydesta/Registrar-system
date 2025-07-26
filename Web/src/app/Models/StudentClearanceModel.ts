export interface StudentClearanceModel {
  id: string;
  studentId: string;
  student: any;
  labraryClearance: boolean;
  financeClearance: boolean;
  systemadmin: boolean;
  remark: string;
  createdDate: Date;
  lastModifiedDate: Date;
  lastModifiedBy: string;
  createdBy: string;
  isDeleted: boolean;
}
