export class ApplicationProgramRequest {
  applicantId: number;
  division: number;
  approvalStatus: number;
  studentStatus: number;
  createdDate: Date;
  lastModifiedDate: Date;
  lastModifiedBy: string;
  createdBy: string;
  isDeleted: boolean;
}
