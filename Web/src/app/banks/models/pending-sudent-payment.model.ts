export interface PendingStudentPaymentModel {
    id: string;
    academicTerm: string;
    batchCode: string;
    status: string;
    numberOfRegistered: number;
    registeredOn: Date;
    totalPayment: number;
    isProcessing?: boolean;
    requestType: string;
}