// server/services/core/OrderService.ts
import { prisma } from "~/server/lib/prisma"
import { PricingService } from "./PricingService"
import { ProvisioningService } from "./ProvisioningService"
import { BillingCycle } from "@prisma/client"

interface DirectCheckoutParams {
  userId: string
  planId: string
  configuration: {
    serviceType: 'GAME_SERVER' | 'VPS' | 'DEDICATED_SERVER'
    location: string
    resources: {
      memory: number
      disk: number
      cpu?: number
    }
    gameConfig?: {
      type: string
      slots: number
      mods?: string[]
    }
  }
  billingCycle: 'monthly' | 'hourly'
  paymentMethodId?: string
}
/*
export class OrderService {
  private pricingService = new PricingService()
  private provisioningService = new ProvisioningService()

  async processDirectCheckout(params: DirectCheckoutParams) {
    return await prisma.$transaction(async (tx) => {
      // 1. Price Calculation
      const priceResult = await this.pricingService.calculatePrice({
        planId: params.planId,
        configuration: params.configuration,
        duration: params.billingCycle
      })

      // 2. Create Order
      const order = await tx.order.create({
        data: {
          userId: params.userId,
          status: 'PENDING',
          planId: params.planId,
          BillingCycle: params.billingCycle,
          totalAmount: priceResult.total,
          service: {
            create: {
              type: params.configuration.serviceType,
              userId: params.userId,
              config: this.buildServiceConfig(params)
            }
          }
        },
        include: { service: true }
      })

      // 3. Create Invoice
      const invoice = await tx.invoice.create({
        data: {
          userId: params.userId,
          orderId: order.id,
          serviceId: order.service[0].id,
          amount: priceResult.total,
          currency: 'EUR',
          status: 'PENDING',
          periodStart: new Date(),
          periodEnd: this.calculatePeriodEnd(params.billingCycle)
        }
      })

      // 4. Payment Processing
      if (params.paymentMethodId) {
        await this.processPayment(tx, {
          invoiceId: invoice.id,
          paymentMethodId: params.paymentMethodId,
          amount: priceResult.total
        })
      }

      return { order, invoice, priceDetails: priceResult }
    })
  }

  async confirmOrder(orderId: string) {
    return await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { service: true, invoice: true }
      })

      if (!order) throw new Error('Order not found')

      // 1. Validate payment
      if (order.invoice.status !== 'PAID') {
        throw new Error('Invoice not paid')
      }

      // 2. Provision Service
      const service = order.service[0]
      const provisionedService = await this.provisioningService.provisionService({
        userId: order.userId,
        serviceType: service.type,
        configuration: this.mapProvisioningConfig(service.config)
      })

      // 3. Update Order
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'ACTIVE',
          service: {
            update: {
              where: { id: service.id },
              data: {
                hostId: provisionedService.hostId,
                networkConfig: { connect: { id: provisionedService.networkConfig.id } }
              }
            }
          }
        },
        include: { service: true }
      })

      return updatedOrder
    })
  }

  private buildServiceConfig(params: DirectCheckoutParams) {
    return {
      type: params.configuration.serviceType,
      location: params.configuration.location,
      resources: params.configuration.resources,
      ...(params.configuration.serviceType === 'GAME_SERVER' && {
        game: params.configuration.gameConfig
      })
    }
  }

  private calculatePeriodEnd(billingCycle: string) {
    const now = new Date()
    switch (billingCycle) {
      case 'hourly': return new Date(now.setHours(now.getHours() + 1))
      case 'monthly': return new Date(now.setMonth(now.getMonth() + 1))
      default: return new Date(now.setDate(now.getDate() + 30))
    }
  }

  private async processPayment(
    tx: any,
    params: { invoiceId: string; paymentMethodId: string; amount: number }
  ) {
    // Implement your Stripe integration here
    // Example:
    const paymentResult = await mockStripeCharge({
      amount: params.amount,
      currency: 'EUR',
      source: params.paymentMethodId
    })

    await tx.invoice.update({
      where: { id: params.invoiceId },
      data: {
        status: paymentResult.success ? 'PAID' : 'FAILED',
        paidAt: paymentResult.success ? new Date() : undefined,
        stripePaymentIntentId: paymentResult.id
      }
    })

    if (!paymentResult.success) {
      throw new Error(`Payment failed: ${paymentResult.console.error();
      }`)
    }
  }

  private mapProvisioningConfig(config: any) {
    return {
      memory: config.resources.memory,
      disk: config.resources.disk,
      location: config.location,
      ...(config.game && {
        gameType: config.game.type,
        slots: config.game.slots
      })
    }
  }
}

// Mock Stripe client - replace with real implementation
async function mockStripeCharge(params: any) {
  return {
    id: 'pi_mock_' + Math.random().toString(36).substr(2, 9),
    success: true,
    amount: params.amount
  }
}

*/