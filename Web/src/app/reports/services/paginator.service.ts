import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PaginatorService {
  /**
   * Calculate pagination parameters
   * @param pageIndex Current page index (0-based)
   * @param pageSize Items per page
   * @returns Object with skip and take values
   */
  getPaginationParams(pageIndex: number, pageSize: number): { skip: number; take: number } {
    const skip = pageIndex * pageSize;
    const take = pageSize;
    return { skip, take };
  }

  /**
   * Calculate total pages
   * @param totalRowCount Total number of items
   * @param pageSize Items per page
   * @returns Total number of pages
   */
  calculateTotalPages(totalRowCount: number, pageSize: number): number {
    if (pageSize === 0) return 0;
    return Math.ceil(totalRowCount / pageSize);
  }

  /**
   * Check if there's a previous page
   * @param currentPage Current page index (0-based)
   * @returns True if previous page exists
   */
  hasPreviousPage(currentPage: number): boolean {
    return currentPage > 0;
  }

  /**
   * Check if there's a next page
   * @param currentPage Current page index (0-based)
   * @param pageSize Items per page
   * @param totalRowCount Total number of items
   * @returns True if next page exists
   */
  hasNextPage(currentPage: number, pageSize: number, totalRowCount: number): boolean {
    return (currentPage + 1) * pageSize < totalRowCount;
  }

  /**
   * Get the range of items displayed on current page
   * @param currentPage Current page index (0-based)
   * @param pageSize Items per page
   * @param totalRowCount Total number of items
   * @returns Object with start and end indices
   */
  getDisplayRange(currentPage: number, pageSize: number, totalRowCount: number): { start: number; end: number } {
    const start = currentPage * pageSize + 1;
    const end = Math.min((currentPage + 1) * pageSize, totalRowCount);
    return { start, end };
  }
}
