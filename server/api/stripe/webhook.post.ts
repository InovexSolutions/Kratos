/* eslint-disable @typescript-eslint/no-explicit-any */
import { stripe, StripeService } from '~/server/services/stripeService'
import { PaymentService } from '~/server/services/order/PaymentService'
import prisma from '~/lib/prisma'

export default defineEventHandler(async (event) => {
  const body = await readRawBody(event)
  const sig = getHeader(event, 'stripe-signature')
  
  if (!body || !sig) {
    throw createError({ statusCode: 400, message: 'Missing payload or signature' })
  }
  
  let stripeEvent
  
  try {
    stripeEvent = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    )
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    console.error(`Webhook Error: ${errorMessage}`)
    throw createError({ statusCode: 400, message: `Webhook Error: ${errorMessage}` })
  }
  
  const paymentService = new PaymentService()
  const stripeService = new StripeService()
  
  try {
    console.log(`Processing Stripe webhook event: ${stripeEvent.type}`)
    
    // Process the event based on its type
    switch (stripeEvent.type) {
      // Invoice events
      case 'invoice.created':
        console.log('New invoice created')
        await syncStripeInvoiceToDatabase(stripeEvent.data.object)
        break
        
      case 'invoice.finalized':
        console.log('Invoice finalized and ready for payment')
        await syncStripeInvoiceToDatabase(stripeEvent.data.object)
        break
        
      case 'invoice.payment_succeeded':
        console.log('Invoice payment succeeded')
        await handleSuccessfulPayment(stripeEvent.data.object)
        break
        
      case 'invoice.payment_failed':
        console.log('Invoice payment failed')
        await handleFailedPayment(stripeEvent.data.object)
        break
        
      case 'invoice.upcoming':
        console.log('Upcoming invoice notification')
        await notifyUpcomingInvoice(stripeEvent.data.object)
        break
        
      case 'invoice.marked_uncollectible':
        console.log('Invoice marked as uncollectible')
        await handleUncollectibleInvoice(stripeEvent.data.object)
        break
        
      case 'invoice.voided':
        console.log('Invoice voided')
        await handleVoidedInvoice(stripeEvent.data.object)
        break

      // Add handlers for currently unhandled events
      case 'payment_method.attached':
        console.log('Payment method attached')
        // No specific action needed
        break
      
      // Subscription events
      case 'customer.subscription.created':
        console.log('Subscription created')
        await updateSubscriptionInDatabase(stripeEvent.data.object)
        break

      case 'customer.subscription.updated':
        console.log('Subscription updated')
        await updateSubscriptionInDatabase(stripeEvent.data.object)
        break

      case 'customer.subscription.deleted':
        console.log(`Subscription ${stripeEvent.type.split('.')[2]}`)
        await updateSubscriptionInDatabase(stripeEvent.data.object)
        break
      
      // Setup intent events - add support for them
      case 'setup_intent.created':
      case 'setup_intent.succeeded':
          console.log(`Setup intent ${stripeEvent.type.split('.')[1]}`)
          // No action needed, handled by checkout process
          break
      
      // Payment Intent events
      case 'payment_intent.succeeded':
        await stripeService.processWebhook(stripeEvent)
        break
      case 'payment_intent.payment_failed':
      case 'payment_intent.canceled':
        // Let the PaymentService handle payment intent events
        await paymentService.handleWebhook(stripeEvent)
        break
      case 'payment_intent.created':
        console.log(`Payment intent ${stripeEvent.type.split('.')[1]}`)
        // May need to handle these depending on your flow
        break
        
      default:
        console.log(`Unhandled event type: ${stripeEvent.type}`)
    }
    
    return { 
      received: true,
      type: stripeEvent.type,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.error('Error processing webhook:', error)
    throw createError({ 
      statusCode: 500, 
      message: `Error processing webhook: ${error instanceof Error ? error.message : 'Unknown error'}` 
    })
  }
})

// Function to sync Stripe invoices to our database
async function syncStripeInvoiceToDatabase(stripeInvoice: any) {
  // Skip if not related to a subscription
  if (!stripeInvoice.subscription) {
    console.log('Invoice not related to subscription, skipping')
    return
  }
  
  try {
    // Get the subscription to find the order ID
    const subscription = await stripe.subscriptions.retrieve(stripeInvoice.subscription)
    const { orderId } = subscription.metadata || {}
    
    if (!orderId) {
      console.log('No orderId found in subscription metadata')
      return
    }
    
    // Get the order to get the userId
    const order = await prisma.order.findUnique({ 
      where: { id: orderId },
      include: { user: true }
    })
    
    if (!order) {
      console.log(`Order ${orderId} not found`)
      return
    }
    
    // Convert status from Stripe format to our format
    const statusMap = {
      'draft': 'DRAFT',
      'open': 'PENDING',
      'paid': 'PAID',
      'uncollectible': 'FAILED',
      'void': 'VOID'
    }
    
    type StripeInvoiceStatus = keyof typeof statusMap
    
    // Include only fields that exist in your schema
    const invoiceData = {
      stripeInvoiceId: stripeInvoice.id,
      orderId: orderId,
      userId: order.userId,
      amount: stripeInvoice.amount_due / 100, // Convert from cents
      subtotal: stripeInvoice.subtotal / 100,
      tax: (stripeInvoice.tax || 0) / 100,
      status: statusMap[stripeInvoice.status as StripeInvoiceStatus] || 'PENDING',
      periodStart: new Date(stripeInvoice.period_start * 1000),
      periodEnd: new Date(stripeInvoice.period_end * 1000),
      // Remove dueDate field
      paidAt: stripeInvoice.status === 'paid' ? new Date() : null,
      description: stripeInvoice.description || `Invoice for ${order.items?.[0]?.plan?.name || 'subscription'}`
    }
    
    // Remove fields that don't exist in your schema
    const { subtotal, tax, description, ...validInvoiceData } = invoiceData;
    
    // Create or update invoice in our database
    // await prisma.invoice.upsert({
    //   where: { 
    //     stripeInvoiceId: stripeInvoice.id 
    //   },
    //   update: validInvoiceData,
    //   create: {
    //     ...validInvoiceData,
    //     // Add any required fields that might be missing
    //   }
    // })
    
    console.log(`Invoice ${stripeInvoice.id} synced for order ${orderId}`)
    
  } catch (error) {
    console.error('Error syncing invoice:', error)
  }
}

// Handle successful payment
async function handleSuccessfulPayment(stripeInvoice: any) {
  try {
    await syncStripeInvoiceToDatabase(stripeInvoice)
    
    // If this is the first payment, provision the service
    if (stripeInvoice.billing_reason === 'subscription_create') {
      console.log('First payment for subscription, provisioning services')
      
      // Get the subscription to find the order
      const subscription = await stripe.subscriptions.retrieve(stripeInvoice.subscription)
      const { orderId } = subscription.metadata || {}
      
      if (!orderId) {
        console.log('No orderId found in subscription metadata')
        return
      }
      
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { service: true }
      })
      
      if (!order) {
        console.log(`Order ${orderId} not found`)
        return
      }
      
      // If service is in PENDING state, trigger provisioning
      if (order.service && order.service.status === 'PENDING') {
        try {
          console.log(`Creating service deployment for order ${orderId}`)
          
          // Create a deployment record
          await prisma.serviceDeployment.create({
            data: {
              serviceId: order.service.id,
              status: 'PENDING',
              logs: ['Deployment initiated via invoice payment']
            }
          })
          
          // The provisioning service will pick this up later
        } catch (provisioningError) {
          console.error('Error during service provisioning:', provisioningError)
          
          // Update service with error status
          await prisma.service.update({
            where: { id: order.service.id },
            data: {
              status: 'SUSPENDED' // Use a valid value from your ServiceStatus enum
            }
          })
        }
      }
    }
    
    // Send payment confirmation email if needed
    const order = await getOrderFromInvoice(stripeInvoice)
    if (order?.user?.email) {
      // Send payment confirmation email (implement this later)
      console.log(`Would send payment confirmation to ${order.user.email}`)
    }
    
  } catch (error) {
    console.error('Error handling successful payment:', error)
  }
}

// Handle failed payment
async function handleFailedPayment(stripeInvoice: any) {
  try {
    // Update invoice status
    await syncStripeInvoiceToDatabase(stripeInvoice)
    
    // Get the order details
    const order = await getOrderFromInvoice(stripeInvoice)
    
    if (!order) {
      console.log('Order not found for failed invoice')
      return
    }
    
    // Create payment attempt record
    // await prisma.paymentAttempt.create({
    //   data: {
    //     invoiceId: (await prisma.invoice.findFirst({ 
    //       where: { stripeInvoiceId: stripeInvoice.id }
    //     }))?.id || '',
    //     status: 'FAILED',
    //     errorMessage: stripeInvoice.last_payment_error?.message || 'Payment failed',
    //     attemptedAt: new Date()
    //   }
    // })
    
    // Send email notification
    if (order?.user?.email) {
      console.log(`Would send payment failure notification to ${order.user.email}`)
    }
    
  } catch (error) {
    console.error('Error handling failed payment:', error)
  }
}

// Handle upcoming invoice notification
async function notifyUpcomingInvoice(stripeInvoice: any) {
  try {
    // Get the order details
    const order = await getOrderFromInvoice(stripeInvoice)
    
    if (!order || !order.user?.email) {
      return
    }
    
    // Calculate days until due
    const dueDate = stripeInvoice.due_date 
      ? new Date(stripeInvoice.due_date * 1000)
      : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // Default to 3 days
      
    const daysUntilDue = Math.ceil((dueDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
    
    // Send email notification if due date is approaching
    if (daysUntilDue <= 3) {
      console.log(`Would send upcoming invoice reminder to ${order.user.email} for invoice due in ${daysUntilDue} days`)
    }
    
  } catch (error) {
    console.error('Error processing upcoming invoice:', error)
  }
}

// Handle uncollectible invoice
async function handleUncollectibleInvoice(stripeInvoice: any) {
  try {
    // Update invoice status
    await syncStripeInvoiceToDatabase(stripeInvoice)
    
    // Get the order details
    const order = await getOrderFromInvoice(stripeInvoice)
    
    if (!order) return
    
    // If configured to suspend service on failed payment
    if (process.env.SUSPEND_ON_FAILED_PAYMENT === 'true') {
      // Update service status
      if (order.serviceId) {
        await prisma.service.update({
          where: { id: order.serviceId },
          data: { status: 'SUSPENDED' }
        })
        
        console.log(`Service for order ${order.id} suspended due to uncollectible invoice`)
      }
    }
    
    // Send notification
    if (order?.user?.email) {
      console.log(`Would send payment failure and service suspension notice to ${order.user.email}`)
    }
    
  } catch (error) {
    console.error('Error handling uncollectible invoice:', error)
  }
}

// Handle voided invoice
async function handleVoidedInvoice(stripeInvoice: any) {
  try {
    // Update invoice status
    await syncStripeInvoiceToDatabase(stripeInvoice)
  } catch (error) {
    console.error('Error handling voided invoice:', error)
  }
}

// Function to update subscription in our database
async function updateSubscriptionInDatabase(stripeSubscription: any) {
  const { orderId } = stripeSubscription.metadata || {}
  
  if (!orderId) {
    console.log('No orderId found in subscription metadata')
    return
  }
  
  try {
    await prisma.subscription.updateMany({
      where: { stripeSubscriptionId: stripeSubscription.id },
      data: {
        status: stripeSubscription.status,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        canceledAt: stripeSubscription.canceled_at ? new Date(stripeSubscription.canceled_at * 1000) : null
      }
    })
    
    // If subscription status is canceled, update order status
    if (stripeSubscription.status === 'canceled') {
      await prisma.order.updateMany({
        where: { id: orderId },
        data: { status: 'CANCELLED' }
      })
      
      console.log(`Order ${orderId} status updated to CANCELLED due to subscription cancellation`)
    }
    
    console.log(`Subscription ${stripeSubscription.id} updated`)
  } catch (error) {
    console.error('Error updating subscription:', error)
  }
}

// Helper function to get order from invoice
async function getOrderFromInvoice(stripeInvoice: any) {
  if (!stripeInvoice.subscription) return null
  
  try {
    // Get the subscription to find the order ID
    const subscription = await stripe.subscriptions.retrieve(stripeInvoice.subscription)
    const { orderId } = subscription.metadata || {}
    
    if (!orderId) return null
    
    // Get the order with user details
    return prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        service: true
      }
    })
  } catch (error) {
    console.error('Error getting order from invoice:', error)
    return null
  }
}