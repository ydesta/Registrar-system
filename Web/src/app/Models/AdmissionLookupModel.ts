export interface AdmissionLookupModel {
  id?: string;
  term: number;
  year: number;
  acadamicProgrammeId: string;
  batchCode: string;
  division: number;
  applicantYear: number;
  isActive: boolean;
  remark?: string;
  createdDate?: Date;
}
