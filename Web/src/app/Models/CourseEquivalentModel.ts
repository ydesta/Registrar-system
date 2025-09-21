export interface CourseEquivalentModel{
    id : string ,
    courseId : string,
    course : any,
    equivalentCourseId : string ,
    equivalentCourse? : any, // Optional equivalent course details
    remark : string ,
    createdDate : Date,
    lastModifiedDate : Date ,
    lastModifiedBy : string ,
    createdBy : string ,
    isDeleted: boolean
}
export interface CourseEquivalencyViewModel {
  id: string; // Guid in .NET → string in TS
  courseId: string;
  courseCode: string;
  courseTitle: string;
  equivalentCourseId: string;
  equivalentCourseTitle: string;
  equivalentCourseCode: string;
  remark: string;
}
