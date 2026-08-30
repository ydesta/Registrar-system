export interface BatchTermItem {
  id: number;
  batchId: string;
  batchCode: string;
  academicYear: number;
  academicTerm: number;
}

export interface AcademicTermModel {
  id?: number;
  termId: number;
  year: number;
  startDate?: Date | string;
  endDate?: Date | string;
  isCurrentTerm: boolean;
  showRegular?: boolean;
  showAdd?: boolean;
  showAssessment?: boolean;
  showEquivalent?: boolean;
  batchTerms?: BatchTermItem[];
  createdDate?: Date;
  lastModifiedDate?: Date;
  lastModifiedBy?: string;
  createdBy?: string;
  isDeleted?: boolean;
}