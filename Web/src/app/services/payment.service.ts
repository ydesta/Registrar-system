import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private baseUrl = environment.baseUrl;
  private readonly _payment: string = `/${environment.apiVersion}/payment`;
  constructor(private httpClient: HttpClient) { }
  createPaymentOrder(request: PaymentOrderRequest): Observable<ResponseDtos> {
    const endPointUrl = `${this.baseUrl}${this._payment}/create-payment-order`;
    return this.httpClient.post<ResponseDtos>(endPointUrl, request);
  }

  getPaymentOrder(paymentOrderId: string): Observable<PaymentOrder> {
    const endPointUrl = `${this.baseUrl}${this._payment}/payment-order/${paymentOrderId}`;
    return this.httpClient.get<PaymentOrder>(endPointUrl);
  }

  getPaymentOrderByOrderNumber(orderNumber: string): Observable<PaymentOrder> {
    const endPointUrl = `${this.baseUrl}${this._payment}/payment-order-by-number/${orderNumber}`;
    return this.httpClient.get<PaymentOrder>(endPointUrl);
  }
  initiatePayment(request: PaymentGatewayRequest): Observable<PaymentGatewayResponse> {
    const endPointUrl = `${this.baseUrl}${this._payment}/initiate-payment`;
    return this.httpClient.post<PaymentGatewayResponse>(endPointUrl, request);
  }

  processCallback(orderId: string, status: string, message: string): Observable<PaymentGatewayResponse> {
    const endPointUrl = `${this.baseUrl}${this._payment}/callback`;
    return this.httpClient.post<PaymentGatewayResponse>(endPointUrl, null, {
      params: {
        orderId,
        status,
        message
      }
    });
  }

  processRegistrationPayment(request: RegistrationPaymentRequest): Observable<ResponseDtos> {
    const endPointUrl = `${this.baseUrl}${this._payment}/process-registration-payment`;
    return this.httpClient.post<ResponseDtos>(endPointUrl, request);
  }

  handleRegistrationPaymentCallback(orderId: string, status: string, message: string): Observable<ResponseDtos> {
    const endPointUrl = `${this.baseUrl}${this._payment}/handle-registration-callback`;
    return this.httpClient.post<ResponseDtos>(endPointUrl, null, {
      params: {
        orderId,
        status,
        message
      }
    });
  }

  getRegistrationPaymentStatus(registrationId: string): Observable<ResponseDtos> {
    const endPointUrl = `${this.baseUrl}${this._payment}/registration-status/${registrationId}`;
    return this.httpClient.get<ResponseDtos>(endPointUrl);
  }
  processCompletePaymentFlow(request: CompletePaymentFlowRequest): Observable<ResponseDtos> {
    const endPointUrl = `${this.baseUrl}${this._payment}/process-complete-payment-flow`;
    return this.httpClient.post<ResponseDtos>(endPointUrl, request);
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
    const endPointUrl = `${this.baseUrl}${this._payment}/payment-order-status/${paymentOrderId}`;
    return this.httpClient.get<ResponseDtos>(endPointUrl);
  }

  getPaymentOrderById(paymentOrderId: string): Observable<ResponseDtos> {
    const endPointUrl = `${this.baseUrl}${this._payment}/payment-order/${paymentOrderId}`;
    return this.httpClient.get<ResponseDtos>(endPointUrl);
  }

  processPaymentOrder(paymentOrderId: string, gatewayRequest: PaymentGatewayRequest): Observable<ResponseDtos> {
    const endPointUrl = `${this.baseUrl}${this._payment}/process-payment-order/${paymentOrderId}`;
    return this.httpClient.post<ResponseDtos>(endPointUrl, gatewayRequest);
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
    const endPointUrl = `${this.baseUrl}${this._payment}/check-and-handle-callback/${orderNumber}`;
    return this.httpClient.get<ResponseDtos>(endPointUrl);
  }
}
