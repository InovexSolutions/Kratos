import { prisma } from "~/server/lib/prisma"

export async function calculatePrice(gameSlug: string, configuration: Record<string, any>) {
    const game = await prisma.game.findUnique({
      where: { slug: gameSlug },
      include: {
        pricingTiers: true,
        modifiers: true
      }
    })
  
    if (!game) throw new Error('Game not found')
    if (!configuration) throw new Error('Configuration is required')
  
    let total = Number(game.basePrice)
    const lineItems = [{
      product_key: 'BASE_PRICE',
      notes: `Base price for ${game.name}`,
      cost: Number(game.basePrice)
    }]

    // Process pricing tiers
    for (const [configKey, configValue] of Object.entries(configuration)) {
      const tier = game.pricingTiers.find(t => 
        t.type === configKey && t.value === configValue.toString()
      )

      if (tier && Number(tier.price) > 0) {
        const price = Number(tier.price)
        total += price
        lineItems.push({
          product_key: `TIER_${tier.type.toUpperCase()}`,
          notes: `${tier.label}`,
          cost: price
        })
      }
    }

    // Process modifiers
    for (const modifier of game.modifiers) {
      let modifierValue = 0
      let description = modifier.description

      switch (modifier.type) {
        case 'fixed':
          modifierValue = Number(modifier.value)
          total += modifierValue
          break

        case 'multiplier':
          modifierValue = total * (Number(modifier.value) - 1)
          total *= Number(modifier.value)
          description = `${modifier.value}x multiplier applied`
          break

        case 'conditional':
          const condition = modifier.condition as { field: string; value: string }
          if (configuration[condition.field]?.toString() === condition.value) {
            modifierValue = total * (Number(modifier.value) - 1)
            total *= Number(modifier.value)
            description = `Conditional ${modifier.value}x multiplier (${condition.field} = ${condition.value})`
          }
          break
      }

      if (modifierValue !== 0) {
        lineItems.push({
          product_key: `MOD_${modifier.type.toUpperCase()}`,
          notes: modifier.description || description,
          cost: modifierValue
        })
      }
    }

    return {
      total: Number(total.toFixed(2)),
      currency: 'EUR',
      lineItems,
      configuration
    }
}

export async function getGame(gameSlug: string) {
    const game = await prisma.game.findUnique({
      where: { slug: gameSlug },
      include: {
        pricingTiers: true,
        modifiers: true
      }
    })
    if (!game) throw new Error('Game not found');
    // console.log('Get game api res: ', game)
    return game
}
