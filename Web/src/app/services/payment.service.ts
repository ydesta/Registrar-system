import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
  PaymentOrderRequest,
  PaymentGatewayRequest,
  RegistrationPaymentRequest,
  CompletePaymentFlowRequest,
  PaymentOrder,
  PaymentGatewayResponse,
  ResponseDtos
} from '../interfaces/payment.interface';
import { CrudService } from 'src/app/services/crud.service';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private readonly payment = `/${environment.apiVersion}/payment`;

  constructor(private crud: CrudService) { }

  createPaymentOrder(request: PaymentOrderRequest): Observable<ResponseDtos> {
    return this.crud.add<ResponseDtos>(`${this.payment}/create-payment-order`, request);
  }

  getPaymentOrder(paymentOrderId: string): Observable<PaymentOrder> {
    return this.crud.getList<PaymentOrder>(`${this.payment}/payment-order/${paymentOrderId}`);
  }

  getPaymentOrderByOrderNumber(orderNumber: string): Observable<PaymentOrder> {
    return this.crud.getList<PaymentOrder>(`${this.payment}/payment-order-by-number/${orderNumber}`);
  }

  initiatePayment(request: PaymentGatewayRequest): Observable<PaymentGatewayResponse> {
    return this.crud.add<PaymentGatewayResponse>(`${this.payment}/initiate-payment`, request);
  }

  processCallback(orderId: string, status: string, message: string): Observable<PaymentGatewayResponse> {
    return this.crud.add<PaymentGatewayResponse>(`${this.payment}/callback`, null, {
      orderId,
      status,
      message
    });
  }

  processRegistrationPayment(request: RegistrationPaymentRequest): Observable<ResponseDtos> {
    return this.crud.add<ResponseDtos>(`${this.payment}/process-registration-payment`, request);
  }

  handleRegistrationPaymentCallback(orderId: string, status: string, message: string): Observable<ResponseDtos> {
    return this.crud.add<ResponseDtos>(`${this.payment}/handle-registration-callback`, null, {
      orderId,
      status,
      message
    });
  }

  getRegistrationPaymentStatus(registrationId: string): Observable<ResponseDtos> {
    return this.crud.getList<ResponseDtos>(`${this.payment}/registration-status/${registrationId}`);
  }

  processCompletePaymentFlow(request: CompletePaymentFlowRequest): Observable<ResponseDtos> {
    return this.crud.add<ResponseDtos>(`${this.payment}/process-complete-payment-flow`, request);
  }

  redirectToPaymentGateway(redirectUrl: string): void {
    if (redirectUrl) {
      window.location.href = redirectUrl;
    }
  }

  handlePaymentCompletion(response: PaymentGatewayResponse): void {
    if (response.success && response.redirectUrl) {
      this.redirectToPaymentGateway(response.redirectUrl);
    }
  }

  createPayment(request: PaymentGatewayRequest): Observable<PaymentGatewayResponse> {
    return this.initiatePayment(request);
  }

  handlePaymentCallback(orderId: string, status: string, message: string): Observable<ResponseDtos> {
    return this.handleRegistrationPaymentCallback(orderId, status, message);
  }

  getPaymentOrderStatus(paymentOrderId: string): Observable<ResponseDtos> {
    return this.crud.getList<ResponseDtos>(`${this.payment}/payment-order-status/${paymentOrderId}`);
  }

  getPaymentOrderById(paymentOrderId: string): Observable<ResponseDtos> {
    return this.crud.getList<ResponseDtos>(`${this.payment}/payment-order/${paymentOrderId}`);
  }

  processPaymentOrder(paymentOrderId: string, gatewayRequest: PaymentGatewayRequest): Observable<ResponseDtos> {
    return this.crud.add<ResponseDtos>(`${this.payment}/process-payment-order/${paymentOrderId}`, gatewayRequest);
  }

  getPaymentStatusText(status: number): string {
    const statusMap: { [key: number]: string } = {
      0: 'Pending',
      1: 'Processing',
      2: 'Completed',
      3: 'Failed',
      4: 'Cancelled',
      5: 'Expired'
    };
    return statusMap[status] || 'Unknown';
  }

  getPaymentOrderStatusText(status: number): string {
    const statusMap: { [key: number]: string } = {
      0: 'Created',
      1: 'Pending Payment',
      2: 'Payment Processing',
      3: 'Payment Completed',
      4: 'Payment Failed',
      5: 'Payment Cancelled',
      6: 'Payment Expired'
    };
    return statusMap[status] || 'Unknown';
  }

  checkOrderStatusAndHandleCallback(orderNumber: string): Observable<ResponseDtos> {
    return this.crud.getList<ResponseDtos>(`${this.payment}/check-and-handle-callback/${orderNumber}`);
  }
}
