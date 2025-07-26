export interface BankTransactionModel{
    id : string ,
     transactionID :  string ,
     bankID :  string ,
     bank : any,
     paymentDate : Date ,
     amount : 0,
    createdDate : Date,
    lastModifiedDate : Date ,
    lastModifiedBy : string ,
    createdBy : string ,
    isDeleted: boolean
}