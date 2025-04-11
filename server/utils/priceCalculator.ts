export interface PricingModel {
    basePrice: number;
    modifiers: {
        field: string;
        type: 'per_unit' | 'fixed';
        price: number;
        unit?: string;
        included?: number; // The amount included in the base price
    }[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function calculateDynamicPrice(basePrice: number, config: any, pricingModel?: PricingModel) {
    if (!pricingModel) return basePrice;

    let total = basePrice;

    for (const modifier of pricingModel.modifiers || []) {
        const value = config[modifier.field];
        const included = modifier.included || 0;
        
        if (typeof value === 'number') {
            if (modifier.type === 'per_unit') {
                // Only charge for resources above what's included in base plan
                const chargeable = Math.max(0, value - included);
                total += chargeable * modifier.price;
            } else if (modifier.type === 'fixed') {
                // For fixed price modifiers, add full price if selected
                total += modifier.price;
            }
        }
    }

    return total;
}