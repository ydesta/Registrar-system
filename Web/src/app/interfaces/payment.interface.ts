export interface PaymentOrderRequest {
  studentCourseOfferingId: string;
  academicTerm: number;
  academicYear: number;
  numberOfCourses: number;
  totalAmount: number;
  currency: string;
  processingOption: number;
  description?: string;
  maxPaymentAttempts?: number;
  paymentExpiryDate?: Date;
}

export interface PaymentGatewayRequest {
  paymentOrderId: string;
  amount: number;
  currency: string;
  description?: string;
}

export interface RegistrationPaymentRequest {
  studentCourseOfferingId: string;
  studentId: string;
  batchCode: string;
  academicTerm: number;
  academicYear: number;
  selectedCourses: any[];
  totalAmount: number;
  currency: string;
  description?: string;
  orderNumber?: string;
}

export interface CompletePaymentFlowRequest {
  orderRequest: PaymentOrderRequest;
  gatewayRequest: PaymentGatewayRequest;
}

export interface PaymentOrder {
  id: string;
  orderNumber: string;
  studentCourseOfferingId: string;
  academicTerm: number;
  academicYear: number;
  numberOfCourses: number;
  totalAmount: number;
  currency: string;
  status: string;
  isPaid: boolean;
  paidDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  transactionId?: string;
  returnUrl?: string;
  description?: string;
  isGatewayProcessed: boolean;
  gatewayProcessedDate?: Date;
  gatewayResponse?: string;
  gatewayErrorMessage?: string;
  gatewayName?: string;
}

export interface PaymentGatewayResponse {
  success: boolean;
  message?: string;
  redirectUrl?: any;
  transactionId?: string;
  orderNumber?: string;
  data?: any;
}

export interface ResponseDtos {
  status: string;
  success?: boolean;
  message?: string;
  data?: any;
  error?: string;
}
