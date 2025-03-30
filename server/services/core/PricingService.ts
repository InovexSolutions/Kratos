// server/services/core/PricingService.ts
import prisma from "~/lib/prisma"

interface ResourceConfiguration {
  memory: number;
  disk: number;
  [key: string]: number; // For any additional resources
}

interface PriceCalculationParams {
  planId: string
  configuration: {
    resources?: ResourceConfiguration;
    [key: string]: unknown;
  }
  duration: 'hourly' | 'monthly'
}

export class PricingService {
  async calculatePrice(params: PriceCalculationParams) {
    const plan = await prisma.pricingPlan.findUniqueOrThrow({
      where: { id: params.planId }
    });

    const basePrice = plan.priceMonthly;

    let total = Number(basePrice);
    const lineItems = [{
      key: 'base',
      description: plan.name,
      amount: Number(basePrice)
    }];

    // Add resource-based pricing
    if (params.configuration.resources) {
      const resourceCost = this.calculateResourceCost(
        plan,
        params.configuration.resources
      );
      total += resourceCost;
      lineItems.push({
        key: 'resources',
        description: 'Extra resources',
        amount: resourceCost
      });
    }

    return {
      total: parseFloat(total.toFixed(2)),
      currency: 'EUR',
      breakdown: lineItems,
      planDetails: plan
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private calculateResourceCost(plan: any, resources: any) {
    const baseSpec = plan.specs;
    let cost = 0;
    
    if (resources.memory > baseSpec.memory) {
      cost += (resources.memory - baseSpec.memory) * plan.memoryPricePerGB;
    }
    
    if (resources.disk > baseSpec.disk) {
      cost += (resources.disk - baseSpec.disk) * plan.diskPricePerGB;
    }

    return cost;
  }
}