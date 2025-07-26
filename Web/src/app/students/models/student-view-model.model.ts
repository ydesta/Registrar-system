import { CourseBreakDownOffering } from './course-break-down-offering.model';
import { CoursePaymentViewModel } from './course-payment-view-model.model';

export class StudentViewModel {
  public fullName: string;
  public entryCode: string;
  public academicTermSeason: number;
  public academicTermYear: number;
  public academicProgram: string;
  public studentId: string;
  public studId: string;
  public id: string;
  public termCourseOfferingId: string;
  public academicProgramId: string;
  public registrationDate: Date;
  public status: number;
  public cgpa: number;
  public year: string;
  public isAllowedToRegister: number;
  public batchCode: string;
  public courseTermOfferings: CourseBreakDownOffering[];
  public coursePayment: CoursePaymentViewModel[]
}
