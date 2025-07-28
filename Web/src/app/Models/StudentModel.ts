export interface StudentModel {
  id: string; 
  applicantId : string ;
  studentId: string;
  batchCode: string;
  entryCode:string;
  acadamicProgrammeCode :  string ;
  curriculumCode: string;
  createdDate: Date;
  lastModifiedDate: Date;
  lastModifiedBy: string;
  createdBy: string;
  isDeleted: boolean;
  firstName :  string ;
  fatherName :  string ;
  grandFatherName :  string ;
  sirName :  string ;
  motherName :  string ;
  gender :  string ;
  birthDate :  Date ;
  birthPlace :  string ;
  nationality :  string ,
  telephonOffice :  string ;
  telephonHome :  string ;
  mobile :  string ;
  postalAddress :  string ;
  emailAddress :  string ;
 
}
export interface StudentProfileViewModel {
  id: string;
  fullName: string;
  studentCode: string;
  entryYear: number;
  birthDate?: Date;
  gender: string;
  academicProgram: string;
  curriculumCode: string;
  batch: string;
  nationality: string;
  phoneNo: string;
  email: string;
  birthPlace: string;
  division: string;
  status: string;
  major: string;
  admissionDate: Date;
  photoUrl: string;
  studentAcademicYears: StudentAcademicYearView[];
  studentCoursesTaken: StudentCoursesTakenView[];
}

export interface StudentAcademicYearView {
  // Define the fields here based on your backend model
}

export interface StudentCoursesTakenView {
  // Define the fields here based on your backend model
}

