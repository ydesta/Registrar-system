interface PaginatedResponse<T> {
  data: T[];
  isSuccess: boolean;
  message?: string;
  totalRowCount: number;
  itemPerPage: number;
  currentPage: number;
  hasPrev: boolean;
  hasNext: boolean;
  totalPageCount: number;
  action?: string;
}