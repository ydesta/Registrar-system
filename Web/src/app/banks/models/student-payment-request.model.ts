export class StudentPaymentRequest {
    parentId: string;
    fromBank: string;
    toBank: number
    transactionDate: string
    bankTransactionID: string
    amount: number
    type: number
    paidFor: number
    remark: string;
    // id: string
}
