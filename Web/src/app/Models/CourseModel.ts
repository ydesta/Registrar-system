export interface CourseModel{
    id : string ,
    courseCode : string
    courseTitle : string ,
    creditHours : number,
    lectureHours : number,
    labHours : number,
    remark : string ,
    createdDate : Date,
    lastModifiedDate : Date ,
    lastModifiedBy : string ,
    createdBy : string ,
    isDeleted: boolean
}