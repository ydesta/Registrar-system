export interface BatchModel {
  id: string;
  batchCode: string;
  curriculumCode: string;
  curriculum: any;
  remark: string;
  createdDate: Date;
  lastModifiedDate: Date;
  lastModifiedBy: string;
  createdBy: string;
  isDeleted: boolean;
  entryYear: number;
  entryTerm: number;
  academicTerm: string;
  amount: number;
}
