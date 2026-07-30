export type CreateCheckoutSessionInput = {
  tenantId: number;
  planCode: string;
  amount: number;
  successUrl: string;
  cancelUrl: string;
};

export type CreateCheckoutSessionOutput = {
  /**
   * The URL to redirect the user to complete the payment.
   */
  checkoutUrl: string;
  
  /**
   * The unique identifier for this checkout session (e.g., transaction ID).
   */
  sessionId: string;
};

export interface PaymentGatewayInterface {
  /**
   * Generates a checkout session for upgrading a subscription plan.
   *
   * @param input Data required to initiate the payment
   * @returns The checkout session metadata including the redirect URL
   */
  createCheckoutSession(input: CreateCheckoutSessionInput): Promise<CreateCheckoutSessionOutput>;
}
