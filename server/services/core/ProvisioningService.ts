// server/services/core/ProvisioningService.ts
import { prisma } from "~/server/lib/prisma"
import type { ServiceType } from "@prisma/client" // Add import
import { NodeSelector } from "../NodeSelector"

interface ProvisioningParams {
  userId: string
  serviceType: ServiceType
  configuration: {
    gameType?: string
    slots?: number
    memory: number
    disk: number
    location: string
  }
}

export class ProvisioningService {
  private nodeSelector = new NodeSelector();

  async provisionService(params: {
    userId: string
    serviceType: ServiceType
    configuration: any
  }) {
    // 1. Validate resources
    const resourceRequirements = {
      cpu: params.configuration.cpu * 100, // Add appropriate value for cpu
      memory: params.configuration.ram * 1024,
      disk: params.configuration.disk * 1024,
      location: params.configuration.location || 'eu'
    };

    console.log('Resource requirements:', resourceRequirements);

    // 2. Find suitable host
    const host = await this.nodeSelector.findOptimalHost(resourceRequirements);
    
    if (!host) {
      // Notify admins
      console.error('No available hosts matching requirements');
      throw new Error('No available hosts matching requirements');
    }

    // 3. Create service record
    const service = await prisma.service.create({
      data: {
        type: params.serviceType,
        userId: params.userId,
        hostId: host,
        config: this.buildServiceConfig(params),
        // network: {
        //   create: await this.generateNetworkConfig()
        // }
      },
      // include: { networkConfig: true }
    });

    // 4. Update host status
    await prisma.host.update({
      where: { id: host },
      data: { 
        status: 'ALLOCATED',
        createdAt: new Date(),
      }
    });

    return service;
  }

  private buildServiceConfig(params: ProvisioningParams) {
    switch (params.serviceType) {
      case 'GAME_SERVER':
        return {
          game: params.configuration.gameType,
          slots: params.configuration.slots,
          memory: params.configuration.memory,
          disk: params.configuration.disk
        };
      case 'VPS':
        return {
          os: 'ubuntu',
          cpu: 2,
          memory: params.configuration.memory,
          disk: params.configuration.disk
        };
      default:
        return params.configuration;
    }
  }

  private async generateNetworkConfig() {
    // Implementation depends on your network management
    return {
      ipv4: await this.allocateIPv4Address(),
      ports: { tcp: [25565] }
    };
  }

  private async allocateIPv4Address(): Promise<string> {
    // Implementation for allocating an IPv4 address
    // This is a placeholder implementation
    return '192.168.1.1';
  }
}