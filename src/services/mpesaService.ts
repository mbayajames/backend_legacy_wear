import axios from 'axios';
import crypto from 'crypto';
import { Buffer } from 'buffer';

export interface MpesaPaymentRequest {
  phone: string;
  amount: number;
  accountReference: string;
  transactionDesc: string;
}

export interface MpesaResponse {
  success: boolean;
  message: string;
  data?: any;
}

class MpesaService {
  private baseURL: string;
  private consumerKey: string;
  private consumerSecret: string;
  private businessShortCode: string;
  private passkey: string;
  private callbackURL: string;

  constructor() {
    this.consumerKey = process.env.MPESA_CONSUMER_KEY!;
    this.consumerSecret = process.env.MPESA_CONSUMER_SECRET!;
    this.businessShortCode = process.env.MPESA_BUSINESS_SHORTCODE!;
    this.passkey = process.env.MPESA_PASSKEY!;
    this.callbackURL = process.env.MPESA_CALLBACK_URL!;
    this.baseURL = process.env.MPESA_ENVIRONMENT === 'production' 
      ? 'https://api.safaricom.co.ke'
      : 'https://sandbox.safaricom.co.ke';
  }

  private async getAccessToken(): Promise<string> {
    try {
      const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
      
      const response = await axios.get(`${this.baseURL}/oauth/v1/generate?grant_type=client_credentials`, {
        headers: {
          Authorization: `Basic ${auth}`
        }
      });

      return response.data.access_token;
    } catch (error) {
      console.error('Error getting access token:', error);
      throw new Error('Failed to get M-Pesa access token');
    }
  }

  private generatePassword(timestamp: string): string {
    const data = `${this.businessShortCode}${this.passkey}${timestamp}`;
    return Buffer.from(data).toString('base64');
  }

  async initiateSTKPush(paymentRequest: MpesaPaymentRequest): Promise<MpesaResponse> {
    try {
      const accessToken = await this.getAccessToken();
      const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
      const password = this.generatePassword(timestamp);

      const requestData = {
        BusinessShortCode: this.businessShortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: paymentRequest.amount,
        PartyA: paymentRequest.phone,
        PartyB: this.businessShortCode,
        PhoneNumber: paymentRequest.phone,
        CallBackURL: this.callbackURL,
        AccountReference: paymentRequest.accountReference,
        TransactionDesc: paymentRequest.transactionDesc
      };

      const response = await axios.post(
        `${this.baseURL}/mpesa/stkpush/v1/processrequest`,
        requestData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.ResponseCode === '0') {
        return {
          success: true,
          message: 'Payment initiated successfully',
          data: {
            checkoutRequestID: response.data.CheckoutRequestID,
            customerMessage: response.data.CustomerMessage
          }
        };
      } else {
        return {
          success: false,
          message: response.data.ResponseDescription || 'Payment initiation failed'
        };
      }
    } catch (error: any) {
      console.error('M-Pesa STK Push error:', error);
      return {
        success: false,
        message: error.response?.data?.errorMessage || 'Payment initiation failed'
      };
    }
  }

  async handleCallback(callbackData: any): Promise<void> {
    // Handle M-Pesa callback
    try {
      const resultCode = callbackData.Body.stkCallback.ResultCode;
      const resultDesc = callbackData.Body.stkCallback.ResultDesc;
      const checkoutRequestID = callbackData.Body.stkCallback.CheckoutRequestID;

      if (resultCode === 0) {
        // Payment successful
        const callbackMetadata = callbackData.Body.stkCallback.CallbackMetadata;
        const items = callbackMetadata.Item;
        
        const amount = items.find((item: any) => item.Name === 'Amount').Value;
        const mpesaReceiptNumber = items.find((item: any) => item.Name === 'MpesaReceiptNumber').Value;
        const phoneNumber = items.find((item: any) => item.Name === 'PhoneNumber').Value;

        // Update payment status in database
        await this.updatePaymentStatus(checkoutRequestID, 'completed', {
          mpesaReceiptNumber,
          amount,
          phoneNumber
        });
      } else {
        // Payment failed
        await this.updatePaymentStatus(checkoutRequestID, 'failed', {
          error: resultDesc
        });
      }
    } catch (error) {
      console.error('Error handling M-Pesa callback:', error);
    }
  }

  private async updatePaymentStatus(checkoutRequestID: string, status: string, details: any) {
    // Implement database update logic here
    console.log(`Payment ${status}:`, { checkoutRequestID, details });
  }
}

export default new MpesaService();