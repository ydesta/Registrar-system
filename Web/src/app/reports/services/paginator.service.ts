import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, takeUntil } from 'rxjs/operators';

export type PagerExtra = Record<string, string | number | boolean | null | undefined>;

export interface PaginationState {
  pageIndex: number;
  pageSize: number;
  total: number;
  searchKey: string;
  sortColumn: string;
  sortOrder: string;
}

export class ServerPaginator {
  pageIndex = 1;
  pageSize = 10;
  total = 0;
  searchKey = '';
  sortColumn = '';
  sortOrder = '';
  loading = false;
  readonly pageSizeOptions: number[];

  private reloadFn: (() => void) | null = null;
  private readonly search$ = new Subject<string>();
  private readonly filter$ = new Subject<void>();
  private readonly destroy$ = new Subject<void>();
  private readonly helper: PaginatorService;

  constructor(helper: PaginatorService) {
    this.helper = helper;
    this.pageSize = helper.defaultPageSize;
    this.pageSizeOptions = helper.pageSizeOptions;
  }

  init(reload: () => void): void {
    this.reloadFn = reload;
    this.search$.pipe(
      debounceTime(this.helper.searchDebounceMs),
      map(value => this.helper.sanitizeSearchKey(value)),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(value => {
      this.searchKey = value;
      this.pageIndex = 1;
      this.reload();
    });
    this.filter$.pipe(
      debounceTime(this.helper.searchDebounceMs),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.pageIndex = 1;
      this.reload();
    });
  }

  destroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  query(extra?: PagerExtra, searchKey?: string): string {
    return this.helper.buildQuery({
      pageIndex: this.pageIndex,
      pageSize: this.pageSize,
      searchKey: searchKey !== undefined ? searchKey : this.searchKey,
      sortColumn: this.sortColumn,
      sortOrder: this.sortOrder,
      extra
    });
  }

  applyResult(res: any): void {
    this.total = this.helper.resolveTotal(res);
    this.loading = false;
  }

  fail(): void {
    this.total = 0;
    this.loading = false;
  }

  reload(): void {
    this.reloadFn?.();
  }

  onSearch(value?: string): void {
    this.search$.next(value !== undefined ? value : this.searchKey);
  }

  onFilterChange(): void {
    this.filter$.next();
  }

  onPageIndexChange(page: number): void {
    this.pageIndex = page;
    this.reload();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = this.helper.normalizePageSize(size);
    this.pageIndex = 1;
    this.reload();
  }

  onSort(event: string | { key?: string; value?: string } | null, column?: string): void {
    if (event && typeof event === 'object') {
      this.sortColumn = event.key || '';
      this.sortOrder = this.toSortOrder(event.value);
    } else if (!event) {
      this.sortColumn = '';
      this.sortOrder = '';
    } else {
      this.sortColumn = column || '';
      this.sortOrder = this.toSortOrder(typeof event === 'string' ? event : undefined);
    }
    this.pageIndex = 1;
    this.reload();
  }

  resetPage(): void {
    this.pageIndex = 1;
    this.reload();
  }

  serial(index: number): number {
    return (this.pageIndex - 1) * this.pageSize + index + 1;
  }

  private toSortOrder(value?: string | null): string {
    if (!value) {
      return '';
    }
    if (value === 'descend' || value === 'desc') {
      return 'desc';
    }
    if (value === 'ascend' || value === 'asc') {
      return 'asc';
    }
    return value;
  }
}

@Injectable({
  providedIn: 'root'
})
export class PaginatorService {
  readonly defaultPageSize = 10;
  readonly maxPageSize = 100;
  readonly pageSizeOptions = [5, 10, 20, 50, 100];
  readonly searchDebounceMs = 300;

  create(): ServerPaginator {
    return new ServerPaginator(this);
  }

  createState(): PaginationState {
    return {
      pageIndex: 1,
      pageSize: this.defaultPageSize,
      total: 0,
      searchKey: '',
      sortColumn: '',
      sortOrder: ''
    };
  }

  toApiPageIndex(pageIndex: number): number {
    return Math.max((pageIndex || 1) - 1, 0);
  }

  normalizePageSize(pageSize: number): number {
    if (!pageSize || pageSize <= 0) {
      return this.defaultPageSize;
    }
    return Math.min(pageSize, this.maxPageSize);
  }

  sanitizeSearchKey(searchKey?: string): string {
    if (!searchKey) {
      return '';
    }
    return searchKey.replace(/[%*?[\]]/g, '').replace(/[\x00-\x1F\x7F]/g, '').trim();
  }

  buildQuery(params: {
    pageIndex: number;
    pageSize: number;
    searchKey?: string;
    sortColumn?: string;
    sortOrder?: string;
    extra?: PagerExtra;
  }): string {
    const query = new URLSearchParams();
    query.set('pageindex', String(this.toApiPageIndex(params.pageIndex)));
    query.set('pageSize', String(this.normalizePageSize(params.pageSize)));
    const searchKey = this.sanitizeSearchKey(params.searchKey);
    if (searchKey) {
      query.set('searchKey', searchKey);
    }
    if (params.sortColumn) {
      query.set('sortColumn', params.sortColumn);
    }
    if (params.sortOrder) {
      query.set('sortOrder', params.sortOrder);
    }
    if (params.extra) {
      Object.keys(params.extra).forEach(key => {
        const value = params.extra[key];
        if (value !== null && value !== undefined && value !== '') {
          query.set(key, String(value));
        }
      });
    }
    return query.toString();
  }

  resolveTotal(res: any): number {
    return res?.totalRowCount ?? res?.total ?? res?.count ?? res?.totalCount ?? 0;
  }

  getPaginationParams(pageIndex: number, pageSize: number): { skip: number; take: number } {
    const take = this.normalizePageSize(pageSize);
    const skip = this.toApiPageIndex(pageIndex) * take;
    return { skip, take };
  }

  calculateTotalPages(totalRowCount: number, pageSize: number): number {
    const size = this.normalizePageSize(pageSize);
    if (size === 0) return 0;
    return Math.ceil(totalRowCount / size);
  }

  hasPreviousPage(currentPage: number): boolean {
    return currentPage > 0;
  }

  hasNextPage(currentPage: number, pageSize: number, totalRowCount: number): boolean {
    return (currentPage + 1) * pageSize < totalRowCount;
  }

  getDisplayRange(currentPage: number, pageSize: number, totalRowCount: number): { start: number; end: number } {
    const start = currentPage * pageSize + 1;
    const end = Math.min((currentPage + 1) * pageSize, totalRowCount);
    return { start, end };
  }
}
