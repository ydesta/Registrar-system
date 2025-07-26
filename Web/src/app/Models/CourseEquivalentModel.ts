export interface CourseEquivalentModel{
    id : string ,
    courseCode : string,
    course : any,
    equivalentCourseCode : string ,
    remark : string ,
    createdDate : Date,
    lastModifiedDate : Date ,
    lastModifiedBy : string ,
    createdBy : string ,
    isDeleted: boolean
}