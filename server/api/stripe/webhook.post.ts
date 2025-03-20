import { PaymentService } from "~/server/services/order/PaymentService"
// server/api/stripe/webhook.post.ts
export default defineEventHandler(async (event) => {
    const stripeSignature = getHeader(event, 'stripe-signature');
    const body = await readRawBody(event);
  
    if (!body || !stripeSignature) {
      throw createError({ statusCode: 400, message: 'Invalid request' });
    }
  
    const paymentService = new PaymentService();
    
    try {
      const stripeEvent = paymentService.stripe.webhooks.constructEvent(
        body,
        stripeSignature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );  
      return paymentService.handleWebhook(stripeEvent);
    } catch (err) {
      console.error('Stripe webhook error:', err);
      throw createError({ statusCode: 400, message: 'Webhook error' });
    }
  });