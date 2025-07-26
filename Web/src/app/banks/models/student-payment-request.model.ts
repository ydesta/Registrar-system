export class StudentPaymentRequest {
    studentCourseRegistrationID: string;
    fromBank: string;
    toBank: number
    transactionDate: string
    bankTransactionID: string
    amount: number
    type: number
    remark: string;
    // id: string
}
