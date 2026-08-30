export interface CgpaCreditHourLimitModel {
  id?: string;
  academicTerm?: number;
  year?: number;
  limitLevel: number;
  studentId?: string;
  batchCode?: string;
  student?: {
    id?: string;
    studentId?: string;
    firstName?: string;
    fatherName?: string;
    grandFatherName?: string;
  };
  minCgpa: number;
  maxCreditHours: number;
  isActive: boolean;
  isEnabled?: boolean;
  remark?: string;
  createdDate?: Date;
}

export interface CgpaCreditHourLimitConfigModel {
  isEnabled: boolean;
  academicTerm?: number;
  year?: number;
  studentId?: string;
  batchCode?: string;
  appliedLevel?: number;
  limits: CgpaCreditHourLimitModel[];
}
