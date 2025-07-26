export interface CoursePrerequisiteModel{
    id : string ,
    courseCode : string,
    course : any,
    prerequisiteCourseCode : string ,
    remark : string ,
    createdDate : Date,
    lastModifiedDate : Date ,
    lastModifiedBy : string ,
    createdBy : string ,
    isDeleted: boolean
}