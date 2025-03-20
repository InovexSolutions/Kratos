import { CartService } from "~/server/services/order/CartService"

// server/api/order/cart.post.ts
export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const cartService = new CartService()
    return cartService.addToCart({
      userId: event.context.auth.userId,
      ...body
    })
})