export interface PricingModel {
    basePrice: number;
    modifiers: {
        field: string;
        type: 'per_unit' | 'fixed';
        price: number;
        unit?: string;
    }[];
}

export function calculateDynamicPrice(basePrice: number, config: any, pricingModel?: PricingModel) {
    if (!pricingModel) return basePrice;

    let total = basePrice;

    for (const modifier of pricingModel.modifiers || []) {
        const value = config[modifier.field];
        if (typeof value === 'number') {
            if (modifier.type === 'per_unit') {
                total += value * modifier.price;
            } else {
                total += modifier.price;
            }
        }
    }

    return total;
}