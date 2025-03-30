// server/services/order/PaymentService.ts
import Stripe from 'stripe'
import prisma from "~/lib/prisma"
import { ProvisioningService } from '../core/ProvisioningService';

export class PaymentService {
  public stripe: Stripe; // Changed to public
  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-02-24.acacia'
    });
  }

  async createPaymentSession(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true }
    });

    if (!order) throw new Error('Order not found');
    
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: { name: `Hosting Order #${order.id}` },
          unit_amount: Math.round(Number(order.totalAmount) * 100)
        },
        quantity: 1
      }],
      mode: 'payment',
      success_url: `${process.env.BASE_URL}/order/${order.id}/success`,
      cancel_url: `${process.env.BASE_URL}/order/${order.id}/cancel`,
      metadata: { orderId }
    });

    await prisma.order.update({
      where: { id: orderId },
      data: { stripeSessionId: session.id }
    });

    return session;
  }

  async handleWebhook(event: Stripe.Event) {
    if (event.type === 'customer.subscription.created') {
      const subscription = event.data.object as Stripe.Subscription;
      console.log('Subscription created:', subscription.id);
      // Update order status
      await this.handleSubscriptionCreated(subscription);
    }
    
    if (event.type === 'invoice.payment_succeeded' && event.data.object.subscription) {
      const invoice = event.data.object as Stripe.Invoice;
      console.log('Subscription payment succeeded:', invoice.subscription);
      // Update invoice as paid, provision services if initial payment
      await this.handleSubscriptionPaymentSucceeded(invoice);
    }
    if (event.type === 'checkout.session.completed') {
      console.log('Checkout session completed:', event.data.object);
      const session = event.data.object as Stripe.Checkout.Session;
      console.log('Session metadata:', session.client_reference_id);
      if (session.client_reference_id) {
        await this.fulfillOrder(session.client_reference_id);
      } else {
        throw new Error('Client reference ID is null');
      }
      console.log('Order fulfilled:', session.client_reference_id);
    }
  }

  async handleSubscriptionCreated(subscription: Stripe.Subscription) {
    // Extract orderId from subscription metadata
    const { orderId } = subscription.metadata || {};
    
    if (!orderId) {
      console.error('No orderId found in subscription metadata');
      return;
    }
    
    try {
      // Update the order and mark it as active
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'PENDING',
          updatedAt: new Date()
        }
      });
      
      console.log(`Order ${orderId} status updated to PENDING`);
    } catch (error) {
      console.error(`Failed to update order ${orderId}:`, error);
    }
  }

  async handleSubscriptionPaymentSucceeded(invoice: Stripe.Invoice) {
    // Get the subscription ID
    const subscriptionId = typeof invoice.subscription === 'string' 
      ? invoice.subscription 
      : invoice.subscription?.id;
      
    if (!subscriptionId) {
      console.error('No subscriptionId found in invoice');
      return;
    }
    
    try {
      // Get the subscription to access its metadata
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
      const { orderId } = subscription.metadata || {};
      
      if (!orderId) {
        console.error('No orderId found in subscription metadata');
        return;
      }
      
      // Create an invoice record for this payment
      await prisma.invoice.create({
        data: {
          orderId: orderId,
          userId: (await prisma.order.findUnique({ where: { id: orderId } }))?.userId || '',
          amount: Number(invoice.amount_paid) / 100, // Convert from cents
          status: 'PAID',
          paidAt: new Date(),
          periodStart: new Date(invoice.period_start * 1000), // Convert from Unix timestamp
          periodEnd: new Date(invoice.period_end * 1000),
          stripeInvoiceId: invoice.id
        }
      });
      
      console.log(`Created invoice record for subscription payment, order ${orderId}`);
    } catch (error) {
      console.error(`Failed to process subscription payment for invoice ${invoice.id}:`, error);
    }
  }

  private async fulfillOrder(orderId: string) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id: orderId, status: 'UNPAID' },
        data: { status: 'PENDING' },
        include: { items: { include: { plan: true } } }
      });

      // Create invoices
      const invoice = await tx.invoice.create({
        data: {
          userId: order.userId,
          amount: order.totalAmount,
          status: 'PAID',
          paidAt: new Date(),
          periodStart: new Date(),
          periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          orderId: orderId
        }
      });

      // Provision services
      const provisioningService = new ProvisioningService();
      for (const item of order.items) {
        // Extract and validate configuration from the item
        const config = item.configuration as Record<string, any>;
        
        // Create a properly typed configuration object
        const serviceConfig = {
          ram: config.ram || 4,
          cpu: config.cpu || 2,
          disk: config.disk || 20,
          location: config.location || 'us-east',
          gameType: config.gameType,
          slots: config.slots,
          dedicatedIp: config.dedicatedIp || false
        };
        
        await provisioningService.provisionService({
          userId: order.userId,
          serviceType: item.plan.serviceType,
          configuration: serviceConfig
        });
      }

      return invoice;
    });
  }
}