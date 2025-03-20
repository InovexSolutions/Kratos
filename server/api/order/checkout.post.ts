import { CheckoutService } from "~/server/services/order/CheckoutService"

// server/api/order/checkout.post.ts
export default defineEventHandler(async (event) => {
    const checkoutService = new CheckoutService()
    return checkoutService.initiateCheckout(event.context.auth.userId)
})