import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { BaseModel } from '../Models/BaseMode';

export type QueryValue = string | number | boolean | null | undefined;
export type QueryParams = Record<string, QueryValue> | HttpParams | string;

export class ApiClient {
  constructor(
    private http: HttpClient,
    private url: (path: string, query?: QueryParams) => string
  ) {}

  get<T = any>(path: string, query?: QueryParams, headers?: Record<string, string>): Observable<T> {
    return this.http.get<T>(this.url(path, query), headers ? { headers } : {});
  }

  post<T = any>(path: string, data?: unknown, query?: QueryParams, headers?: Record<string, string>): Observable<T> {
    return this.http.post<T>(this.url(path, query), data, headers ? { headers } : {});
  }

  put<T = any>(path: string, data?: unknown, query?: QueryParams): Observable<T> {
    return this.http.put<T>(this.url(path, query), data);
  }

  patch<T = any>(path: string, data?: unknown): Observable<T> {
    return this.http.patch<T>(this.url(path), data);
  }

  delete<T = any>(path: string, query?: QueryParams): Observable<T> {
    return this.http.delete<T>(this.url(path, query));
  }

  getBlob(path: string, query?: QueryParams): Observable<Blob> {
    return this.http.get(this.url(path, query), { responseType: 'blob' });
  }
}

@Injectable({
  providedIn: 'root',
})
export class CrudService {
  readonly baseUrl = environment.baseUrl;
  readonly fileUrl = environment.fileUrl;
  readonly secureUrl = environment.secureUrl;
  readonly apiVersion = environment.apiVersion;
  readonly secure: ApiClient;

  private readonly endpoints: Array<{ from: string; to: string }>;

  constructor(private http: HttpClient) {
    const v = this.apiVersion;
    const map: Record<string, string> = {
      '/acadamicprogramme': `/${v}/program`,
      '/curriculums': `/${v}/curriculum`,
      '/courses': `/${v}/courses`,
      '/courseequivalents': `/${v}/courseequivalents`,
      '/courseprerequisites': `/${v}/courseprerequisites`,
      '/courseexemptions': `/${v}/courseexemptions`,
      '/courseofferinginstructorassignment': `/${v}/courseofferinginstructorassignment`,
      '/students': `/${v}/std`,
      '/applicants': `/${v}/applicant`,
      '/applicanthistorys': `/${v}/applicanthistorys`,
      '/applicantworkexperiences': `/${v}/applicantworkexperiences`,
      '/applicantcontactpersons': `/${v}/applicantcontactpersons`,
      '/applicanteducationbackgrounds': `/${v}/applicanteducationbackgrounds`,
      '/applicantcourseexemptions': `/${v}/applicantcourseexemptions`,
      '/academicterms': `/${v}/term`,
      '/academicstatuses': `/${v}/academicstatuses`,
      '/banks': `/${v}/banks`,
      '/banktransactions': `/${v}/bank`,
      '/tuitionfees': `/${v}/tuition`,
      '/batchs': `/${v}/batch`,
      '/batches': `/${v}/batch`,
      '/entrys': `/${v}/entrys`,
      '/quadrants': `/${v}/quadrants`,
      '/graduationrequirements': `/${v}/graduationrequirements`,
      '/graduationrequirementquadrants': `/${v}/graduationrequirementquadrants`,
      '/staffs': `/${v}/staff`,
      '/sections': `/${v}/section`,
      '/colleges': `/${v}/college`,
      '/termcourseofferings': `/${v}/offering`,
      '/studentregistrations': `/${v}/registration`,
      '/gradingsystems': `/${v}/grading`,
      '/studentgrades': `/${v}/grade`,
      '/files': `/${v}/file`,
      '/studentcourseofferings': `/${v}/studentcourseofferings`,
      '/studentfeedbacks': `/${v}/studentfeedbacks`,
      '/studentclearances': `/${v}/studentclearances`,
      '/studententrytruckings': `/${v}/studententrytruckings`,
      '/studentcourseattendances': `/${v}/studentcourseattendances`,
      '/studentacademicstatushistorys': `/${v}/studentacademicstatushistorys`,
      '/registrarworkflows': `/${v}/registrarworkflows`,
      '/curriculumstatustrackings': `/${v}/curriculumstatustrackings`,
      '/curriculumaccrediations': `/${v}/curriculumaccrediations`,
      '/curriculumtermcoursebreakdown': `/${v}/curriculumtermcoursebreakdown`,
      '/curriculumquadrantbreakdowns': `/${v}/curriculumquadrantbreakdowns`,
      '/acadamicprogrammestatuss': `/${v}/acadamicprogrammestatuss`,
    };
    this.endpoints = Object.keys(map)
      .map(from => ({ from, to: map[from] }))
      .sort((a, b) => b.from.length - a.from.length);
    this.secure = new ApiClient(http, (path, query) => this.buildUrl(path, query, this.secureUrl, false));
  }

  getList<T = BaseModel<any>>(path: string, query?: QueryParams): Observable<T> {
    return this.http.get<T>(this.buildUrl(path, query));
  }

  getPaginated<T = any>(path: string, query?: QueryParams, extra?: Record<string, QueryValue>): Observable<T> {
    const resource = path.replace(/\?.*$/, '').replace(/\/paginated\/?$/i, '');
    return this.getList<T>(`${resource}/paginated`, this.params(query, extra));
  }

  params(query?: QueryParams, extra?: Record<string, QueryValue>): HttpParams {
    return this.appendQuery(this.appendQuery(new HttpParams(), query), extra);
  }

  getById<T = any>(path: string, id: string | number): Observable<T> {
    return this.http.get<T>(this.buildUrl(`${this.trimSlash(path)}/${id}`));
  }

  add<T = any>(path: string, data?: unknown, query?: QueryParams): Observable<T> {
    return this.http.post<T>(this.buildUrl(path, query), data);
  }

  update<T = any>(path: string, id: string | number, data: unknown): Observable<T> {
    return this.http.patch<T>(this.buildUrl(`${this.trimSlash(path)}/${id}`), data);
  }

  patch<T = any>(path: string, data?: unknown, query?: QueryParams): Observable<T> {
    return this.http.patch<T>(this.buildUrl(path, query), data);
  }

  put<T = any>(path: string, data?: unknown): Observable<T> {
    return this.http.put<T>(this.buildUrl(path), data);
  }

  delete<T = any>(path: string, id: string | number): Observable<T> {
    return this.http.delete<T>(this.buildUrl(`${this.trimSlash(path)}/${id}`));
  }

  addResponse<T = any>(path: string, data?: unknown): Observable<HttpResponse<T>> {
    return this.http.post<T>(this.buildUrl(path), data, { observe: 'response' });
  }

  updateResponse<T = any>(path: string, id: string | number, data: unknown): Observable<HttpResponse<T>> {
    return this.http.patch<T>(this.buildUrl(`${this.trimSlash(path)}/${id}`), data, { observe: 'response' });
  }

  deleteResponse<T = any>(path: string, id: string | number): Observable<HttpResponse<T>> {
    return this.http.delete<T>(this.buildUrl(`${this.trimSlash(path)}/${id}`), { observe: 'response' });
  }

  getBlob(path: string, query?: QueryParams): Observable<Blob> {
    return this.http.get(this.buildUrl(path, query), { responseType: 'blob' });
  }

  exportExcel(path: string): Observable<Blob> {
    return this.http.get(this.fileUrl + this.resolve(path), { responseType: 'blob' });
  }

  expoerExcel(path: string): Observable<Blob> {
    return this.exportExcel(path);
  }

  private buildUrl(path: string, query?: QueryParams, base = this.baseUrl, remap = true): string {
    const [pathname, embedded] = this.splitPath(path);
    const resolved = remap ? this.resolve(pathname) : (pathname.startsWith('/') ? pathname : `/${pathname}`);
    const url = base + resolved;
    const params = this.mergeQuery(embedded, query);
    return params ? `${url}?${params}` : url;
  }

  private resolve(path: string): string {
    const normalized = path.startsWith('/') ? path : `/${path}`;
    if (/^\/v\d/i.test(normalized)) {
      return normalized;
    }
    const lower = normalized.toLowerCase();
    for (const entry of this.endpoints) {
      if (lower === entry.from) {
        return entry.to;
      }
      if (lower.startsWith(`${entry.from}/`)) {
        return entry.to + normalized.substring(entry.from.length);
      }
    }
    return normalized;
  }

  private splitPath(path: string): [string, string] {
    const index = path.indexOf('?');
    if (index < 0) {
      return [path, ''];
    }
    return [path.substring(0, index), path.substring(index + 1)];
  }

  private mergeQuery(embedded: string, query?: QueryParams): string {
    let params = new HttpParams({ fromString: embedded || '' });
    params = this.appendQuery(params, query);
    return params.keys().length ? params.toString() : '';
  }

  private appendQuery(params: HttpParams, query?: QueryParams): HttpParams {
    if (!query) {
      return params;
    }
    if (typeof query === 'string') {
      return this.appendQuery(params, new HttpParams({ fromString: query.replace(/^\?/, '') }));
    }
    if (query instanceof HttpParams) {
      query.keys().forEach(key => {
        query.getAll(key)?.forEach(value => {
          params = params.append(key, value);
        });
      });
      return params;
    }
    Object.keys(query).forEach(key => {
      const value = query[key];
      if (value !== null && value !== undefined && value !== '') {
        params = params.append(key, String(value));
      }
    });
    return params;
  }

  private trimSlash(path: string): string {
    return path.replace(/\/+$/, '');
  }
}
