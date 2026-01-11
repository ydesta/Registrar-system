export class GradeReportChildViewModel {
  serialNo: number;
  courseCode: string;
  courseTitle: string;
  grade: string;
  points: number | null;
}

export class GradeReportParentViewModel {
  serialNo: number;
  fullName: string;
  batchCode: string;
  academicProgram: string;
  courseGrades: GradeReportChildViewModel[];
}

export class PaginatedGradeReportResponse {
  data: GradeReportParentViewModel[];
  isSuccess: boolean;
  message: string | null;
  totalRowCount: number;
  itemPerPage: number;
  currentPage: number;
  hasPrev: boolean;
  hasNext: boolean;
  totalPageCount: number;
  action: string | null;
}
