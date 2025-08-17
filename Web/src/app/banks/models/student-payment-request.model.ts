export class StudentPaymentRequest {
    parentId: string;
    fromBank: string | null;  // GUID as string
    toBank: number | null;    // int as number
    transactionDate: string
    bankTransactionID: string
    amount: number
    type: number
    paidFor: number
    remark: string;
    // id: string
}
