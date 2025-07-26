export interface StudentAttendanceModel {
  id: string;
  studentID: string;
  student:any,
  courseCode: string;
  course: any;
  termOfferingID: string,
  termCourseOffering : any, 
  noOfDaysPresent : number,
  remark: string;
  createdDate: Date;
  lastModifiedDate: Date;
  lastModifiedBy: string;
  createdBy: string;
  isDeleted: boolean;
}
