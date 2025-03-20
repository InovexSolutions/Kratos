import { PaymentService } from "~/server/services/order/PaymentService"

// server/api/order/payment.post.ts
export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const paymentService = new PaymentService()
    return paymentService.createPaymentSession(body.orderId)
})