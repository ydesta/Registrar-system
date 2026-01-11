export class GradeReportQueryParams {
  termId: number;
  termYear: number;
  batchCode: string;
  pageIndex: number = 0;
  pageSize: number = 10;
  sortField?: string;
  sortOrder?: string;
}
