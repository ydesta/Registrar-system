import { SearchQueryParams } from './../reports/SearchParam/search-query-params';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { BaseModel } from '../Models/BaseMode';

@Injectable({
  providedIn: 'root',
})
export class CrudService {
  baseUrl = environment.baseUrl;
  fileUrl = environment.fileUrl;
  apiVersion = environment.apiVersion;
  private endpointMapping: { [key: string]: string } = {};

  constructor(private _http: HttpClient) {
    // Initialize comprehensive endpoint mapping with API version
    // Maps old endpoint patterns to new versioned endpoints
    this.endpointMapping = {
      // Academic Programme
      '/AcadamicProgramme': `/${this.apiVersion}/program`,
      
      // Curriculum
      '/Curriculums': `/${this.apiVersion}/curriculum`,
      
      // Courses
      '/Courses': `/${this.apiVersion}/courses`,
      '/courses': `/${this.apiVersion}/courses`,
      '/CourseEquivalents': `/${this.apiVersion}/courseequivalents`,
      
      // Students
      '/Students': `/${this.apiVersion}/std`,
      
      // Applicants
      '/applicants': `/${this.apiVersion}/applicant`,
      '/Applicants': `/${this.apiVersion}/applicant`,
      '/ApplicantHistorys': `/${this.apiVersion}/applicanthistorys`,
      '/ApplicantWorkExperiences': `/${this.apiVersion}/applicantworkexperiences`,
      '/ApplicantContactPersons': `/${this.apiVersion}/applicantcontactpersons`,
      '/ApplicantEducationBackgrounds': `/${this.apiVersion}/applicanteducationbackgrounds`,
      
      // Academic Terms
      '/AcademicTerms': `/${this.apiVersion}/term`,
      '/academicTerms': `/${this.apiVersion}/term`,
      
      // Academic Status
      '/AcademicStatuses': `/${this.apiVersion}/academicstatuses`,
      
      // Banks & Payments
      '/Banks': `/${this.apiVersion}/banks`,
      '/banks': `/${this.apiVersion}/banks`,
      '/BankTransactions': `/${this.apiVersion}/bank`,
      '/TuitionFees': `/${this.apiVersion}/tuition`,
      
      // Batch & Entry
      '/batchs': `/${this.apiVersion}/batch`,
      '/entrys': `/${this.apiVersion}/entrys`,
      
      // Quadrants & Graduation
      '/Quadrants': `/${this.apiVersion}/quadrants`,
      '/quadrants': `/${this.apiVersion}/quadrants`,
      '/GraduationRequirements': `/${this.apiVersion}/graduationrequirements`,
      '/GraduationRequirementQuadrants': `/${this.apiVersion}/graduationrequirementquadrants`,
      
      // Staff
      '/Staffs': `/${this.apiVersion}/staff`,
      
      // Sections
      '/Sections': `/${this.apiVersion}/section`,
      
      // Colleges
      '/Colleges': `/${this.apiVersion}/college`,
      
      // Term Course Offerings
      '/TermCourseOfferings': `/${this.apiVersion}/offering`,
      
      // Student Registrations
      '/StudentRegistrations': `/${this.apiVersion}/registration`,
      
      // Grading Systems
      '/GradingSystems': `/${this.apiVersion}/grading`,
      
      // Student Grades
      '/StudentGrades': `/${this.apiVersion}/grade`,
      
      // Files (for file operations)
      '/Files': `/${this.apiVersion}/file`,
      
      // Student related endpoints
      '/StudentCourseOfferings': `/${this.apiVersion}/studentcourseofferings`,
      '/StudentFeedbacks': `/${this.apiVersion}/studentfeedbacks`,
      '/StudentClearances': `/${this.apiVersion}/studentclearances`,
      '/StudentEntryTruckings': `/${this.apiVersion}/studententrytruckings`,
      '/StudentCourseAttendances': `/${this.apiVersion}/studentcourseattendances`,
      '/StudentAcademicStatusHistorys': `/${this.apiVersion}/studentacademicstatushistorys`,
      '/RegistrarWorkFlows': `/${this.apiVersion}/registrarworkflows`,
      
      // Curriculum related
      '/CurriculumStatusTrackings': `/${this.apiVersion}/curriculumstatustrackings`,
      '/CurriculumAccrediations': `/${this.apiVersion}/curriculumaccrediations`,
      '/CurriculumTermCourseBreakdown': `/${this.apiVersion}/curriculumtermcoursebreakdown`,
      '/CurriculumQuadrantBreakdowns': `/${this.apiVersion}/curriculumquadrantbreakdowns`,
      
      // Course related
      '/CoursePrerequisites': `/${this.apiVersion}/courseprerequisites`,
      '/CourseExemptions': `/${this.apiVersion}/courseexemptions`,
      '/CourseOfferingInstructorAssignment': `/${this.apiVersion}/courseofferinginstructorassignment`,
      
      // Applicant related
      '/ApplicantCourseExemptions': `/${this.apiVersion}/applicantcourseexemptions`,
      
      // Academic Programme Status
      '/AcadamicProgrammeStatuss': `/${this.apiVersion}/acadamicprogrammestatuss`,
    };
  }

  /**
   * Normalizes the endpoint URL by:
   * 1. Checking if it already has a version (starts with /v), return as is
   * 2. Checking the mapping for a versioned equivalent
   * 3. If no mapping exists, return as is (don't auto-version unknown endpoints)
   */
  private normalizeEndpoint(url: string): string {
    // If URL already has a version (starts with /v), return as is
    if (url.match(/^\/v\d/)) {
      return url;
    }

    // Check if there's an exact mapping for this endpoint
    if (this.endpointMapping[url]) {
      return this.endpointMapping[url];
    }

    // Check if URL starts with a known old pattern and replace
    // Handle cases like '/Curriculums/excel' -> '/v1.0/curriculum/excel'
    for (const [oldPattern, newPattern] of Object.entries(this.endpointMapping)) {
      if (url.startsWith(oldPattern)) {
        const remainingPath = url.substring(oldPattern.length);
        return newPattern + remainingPath;
      }
    }

    // If no mapping found, return as is (don't auto-version)
    // This allows backward compatibility with non-versioned endpoints
    return url;
  }

  getList(appendUrl: string): Observable<BaseModel<any>> {
    const normalizedUrl = this.normalizeEndpoint(appendUrl);
    return this._http.get<BaseModel<any>>(this.baseUrl + normalizedUrl);
  }

  add(appendUrl: string, data: any) {
    const normalizedUrl = this.normalizeEndpoint(appendUrl);
    return this._http.post(this.baseUrl + normalizedUrl, data);
  }

  delete(appendUrl: any, id: any) {
    const normalizedUrl = this.normalizeEndpoint(appendUrl);
    return this._http.delete(this.baseUrl + normalizedUrl + '/' + id);
  }

  update(appendUrl: string, id: any, data: any) {
    const normalizedUrl = this.normalizeEndpoint(appendUrl);
    return this._http.patch(this.baseUrl + normalizedUrl + '/' + id, data);
  }

  expoerExcel(appendUrl: string) {
    const httpOptions = { responseType: 'blob' as 'json' };
    return this._http.get(this.fileUrl + appendUrl, httpOptions);
  }
  getRegisteredStud(searchParms: SearchQueryParams): Observable<any[]> {
    const appendUrl = `/${this.apiVersion}/registration/RegisteredStudent/`;
    const endpointUrl = this.baseUrl + appendUrl;
    const saParams = new HttpParams()
      .append('AcademicTerm', searchParms.AcademicTerm.toString())
      .append('Course', searchParms.Course.toString())
      .append('Status', searchParms.Status.toString());
    return this._http.get<any[]>(endpointUrl, { params: saParams });
  }
}
