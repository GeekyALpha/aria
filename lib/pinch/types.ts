// Pinch API types (v2020.1). Derived from docs.getpinch.com.au reference.

export type SourceType = "credit-card" | "bank-account";
export type DateInterval = "days" | "months" | "years";

export interface PinchPayer {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  emailAddress?: string | null;
  mobileNumber?: string | null;
  companyName?: string | null;
}

export interface PinchCreatePayerInput {
  id?: string;
  firstName: string;
  lastName?: string;
  emailAddress: string;
  companyName?: string;
  mobileNumber?: string;
}

export interface PinchSource {
  id: string;
  sourceType: SourceType;
  bankAccountBsb?: string | null;
  bankAccountNumber?: string | null;
  bankAccountName?: string | null;
  creditCardToken?: string | null;
  displayCardNumber?: string | null;
  cardScheme?: string | null;
}

export interface PinchPlanFixedPayment {
  amountInCents?: number | null;
  amountPercentage?: number | null;
  description?: string;
  scheduledDateOffset: number;
  scheduledDateInterval: DateInterval;
  cancelPlanOnFailure?: boolean;
}

export interface PinchPlan {
  id: string;
  name: string;
  requiresTotalAmount: boolean;
  subscriberCount?: number;
  fixedPayments?: PinchPlanFixedPayment[];
}

export interface PinchCreatePlanInput {
  id?: string;
  name: string;
  fixedPayments: PinchPlanFixedPayment[];
  metadata?: string;
}

export interface PinchSubscription {
  id: string;
  planId: string;
  planName?: string;
  status: string;
  totalAmount: number;
  startDate?: string;
  fixedPayments?: { amount: number; description?: string; transactionDate?: string }[];
}

export interface PinchCreateSubscriptionInput {
  planId: string;
  payerId: string;
  totalAmount: number;
  startDate?: string;
  surcharge?: SourceType[];
  sourceId?: string;
}

export interface PinchPaymentLink {
  id: string;
  url: string;
  amountInCents: number;
  amount?: number;
  currency: string;
  description: string;
  allowedPaymentMethods: SourceType[];
  surchargePaymentMethods?: SourceType[];
  returnUrl: string;
}

export interface PinchCreatePaymentLinkInput {
  amount: number;
  payerId: string;
  description: string;
  currency?: string;
  allowedPaymentMethods: SourceType[];
  surchargePaymentMethods?: SourceType[];
  returnUrl: string;
  linkExpiryDate?: string;
  metadata?: string;
}

export interface PinchFees {
  transactionFee: number;
  applicationFee: number;
  totalFee: number;
  currency: string;
  taxRate: number;
}

export interface PinchRealtimePayment {
  id: string;
  attemptId?: string;
  amount: number;
  currency: string;
  description?: string;
  status: string;
  sourceType?: SourceType;
  isSurcharged?: boolean;
  totalFee?: number;
  transactionDate?: string;
  estimatedTransferDate?: string | null;
  payer?: { id: string; firstName?: string; lastName?: string; emailAddress?: string };
  fees?: PinchFees;
  dishonour?: { code?: string; message?: string } | null;
}

export interface PinchRealtimeInput {
  amount: number;
  token?: string;
  payerId?: string;
  sourceId?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  description?: string;
  surcharge?: SourceType[];
  nonce?: string[];
  metadata?: string;
}

export interface PinchFeeCalcInput {
  amount: number;
  sourceType?: SourceType;
  sourceId?: string;
  token?: string;
  applicationFee?: number;
  currency?: string;
  surcharge?: SourceType[];
}

export interface PinchFeeCalcResult {
  amount: number;
  netAmount: number;
  fees: PinchFees;
}

export interface PinchWebhookEvent {
  Id?: string;
  id?: string;
  Type?: string;
  type?: string;
  EventDate?: string;
  Data?: Record<string, unknown>;
  Metadata?: Record<string, unknown>;
}

export const PAY_IN_3_PLAN_NAME = "Aria Pay-in-3";
