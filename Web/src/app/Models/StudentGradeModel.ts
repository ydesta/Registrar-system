export interface StudentGradeModel {
  id: string;
  studentID: string;
  couseCode: string;
  academicTerm: any;
  staffId: string;
  mark: number;
  gradeLetter: string;  
  staff: any; 
  student:any; 
  couse: any;  
  remark: string;
  createdDate: Date;
  lastModifiedDate: Date;
  lastModifiedBy: string;
  createdBy: string;
  isDeleted: boolean;
}
