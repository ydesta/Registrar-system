export class LateRegistrationReportViewModel {
  serialNo: number;
  studentCode: string;
  fullName: string;
  batchCode: string;
  isRegistered: boolean;
  isLateRegistration: boolean;
  registrationDate?: Date;
  penaltyAmount: number;
  isPenaltyPaid: boolean;
  isSemesterPaid: boolean;
  status: string;
}
