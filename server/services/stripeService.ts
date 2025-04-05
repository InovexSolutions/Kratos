// ~/server/services/stripeService.ts
import Stripe from 'stripe'
import prisma from '~/lib/prisma'
import { ProvisioningService } from './core/ProvisioningService'

// Initialize the Stripe client
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia',
  typescript: true
})

export default stripe

// Customer management functions
export async function createStripeCustomer(user: any) {
  return stripe.customers.create({
    email: user.email,
    name: `${user.firstName} ${user.lastName}`,
    metadata: { userId: user.id }
  })
}

// Payment intent functions
export async function createStripePaymentIntent(amount: number, customerId: string) {
  return stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency: 'eur',
    customer: customerId,
    automatic_payment_methods: { enabled: true }
  })
}

// Subscription functions
export async function createStripeSubscription(customerId: string, priceId: string) {
  return stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    expand: ['latest_invoice.payment_intent']
  })
}

// Cancel subscription
export async function cancelStripeSubscription(subscriptionId: string) {
  return stripe.subscriptions.cancel(subscriptionId)
}

export class StripeService {
  // Process webhook events from Stripe
  async processWebhook(event: Stripe.Event) {
    try {
      // Handle payment success
      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await this.fulfillOrder(paymentIntent)
      }
      
      // Handle payment failure
      if (event.type === 'payment_intent.payment_failed') {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await this.handleFailedPayment(paymentIntent)
      }
      
      return { received: true }
    } catch (error) {
      console.error('Webhook error:', error)
      throw error
    }
  }
  
  // Fulfill the order after successful payment
  private async fulfillOrder(paymentIntent: Stripe.PaymentIntent) {
    console.log('Fulfilling payment intent:', paymentIntent)
    const customer = paymentIntent.customer || {}
    
    if (!customer) {
      throw new Error('Customer ID not found in payment metadata')
    }

    // Find user by customer ID
    const user = await prisma.user.findFirst({
      where: { stripeCustomerId: customer }
    })

    if (!user) {
      throw new Error('User not found for customer ID')
    }
    
    // Find pending orders for this user
    const order = await prisma.order.findFirst({
      where: {
        userId: user.id,
        status: 'PENDING'
      },
      include: {
        items: {
          include: { plan: true }
        }
      }
    })
    
    if (!order) {
      throw new Error('No pending order found')
    }
    
    // Update order status
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'PENDING',
        updatedAt: new Date(),
        // stripePaymentIntentId: paymentIntent.id
      }
    })
    
    // Create invoice for the order
    await prisma.invoice.create({
      data: {
        userId: user.id,
        orderId: order.id,
        amount: order.totalAmount,
        status: 'PAID',
        paidAt: new Date(),
        periodStart: new Date(),
        periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      }
    })
    
    // Provision services for the user
    await this.provisionServices(order)

    // Set service deployment status
    await prisma.serviceDeployment.updateMany({
      where: {
        service: {
          userId: user.id
        }
      },
      data: {
        status: 'DEPLOYED'
      }
    })
  }
  
  // Handle failed payment
  private async handleFailedPayment(paymentIntent: Stripe.PaymentIntent) {
    const { userId } = paymentIntent.metadata || {}
    
    if (!userId) {
      throw new Error('User ID not found in payment metadata')
    }
    
    // Find pending orders for this user
    const order = await prisma.order.findFirst({
      where: {
        userId,
        status: 'PENDING'
      }
    })
    
    if (!order) {
      return // No order to update
    }
    
    // Update order status
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'UNPAID',
        // stripePaymentIntentId: paymentIntent.id
      }
    })
  }
  
  // Provision game services after payment
  async provisionServices(order: any) {
    // Initialize the provisioning service
    const provisioningService = new ProvisioningService()
    
    // Process each order item
    for (const item of order.items) {
      try {
        console.log(`Provisioning service for order item: ${item.id}`)
        
        // Skip if not a game server
        if (item.plan.serviceType !== 'GAME_SERVER') {
          console.log(`Skipping non-game-server service type: ${item.plan.serviceType}`)
          continue
        }
        
        // Provision the service
        await provisioningService.provisionService({
          userId: order.userId,
          serviceType: item.plan.serviceType,
          configuration: {
            gameType: this.determineGameType(item),
            nestId: item.configuration.nestId || 1,
            eggId: item.configuration.eggId || 1,
            ram: item.configuration.ram || 4,
            cpu: item.configuration.cpu || 2,
            disk: item.configuration.disk || 10,
            slots: item.configuration.slots || 20,
            location: item.configuration.locationId || 2,
            dedicatedIp: item.configuration.dedicatedIp || false
          }
        })
        
        console.log(`Service provisioning initiated for order item: ${item.id}`)
      } catch (error) {
        console.error(`Error provisioning service for item ${item.id}:`, error)
        
        // Log the error in the order
        await prisma.orderItem.update({
          where: { id: item.id },
          data: {
            data: `Provisioning error: ${error instanceof Error ? error.message : String(error)}`
          }
        })
      }
    }
  }
  
  // Determine game type from order item
  private determineGameType(item: any): string {
    // Try to get game type from configuration
    if (item.configuration.gameType) {
      return item.configuration.gameType
    }
    
    // Try to infer from plan name
    const planName = item.plan.name.toLowerCase()
    if (planName.includes('minecraft')) return 'minecraft'
    if (planName.includes('rust')) return 'rust'
    if (planName.includes('zomboid') || planName.includes('project_zomboid')) return 'project_zomboid'
    if (planName.includes('valheim')) return 'valheim'
    
    // Default to minecraft if can't determine
    return 'minecraft'
  }
}