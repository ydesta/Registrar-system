export interface StudentPaymentModel{
    id : string ,
     studentID :  string ,
     student : any,
     courseCode :  string ,
     course : any,
     studentRegistrationID :  string,
     studentRegistration : any,
     bankTransactionID :  string ,
     bankTransaction : any,
    amount : 0,
    remark : string ,
    createdDate : Date,
    lastModifiedDate : Date ,
    lastModifiedBy : string ,
    createdBy : string ,
    isDeleted: boolean
}