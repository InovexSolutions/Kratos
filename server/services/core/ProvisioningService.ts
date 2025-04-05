/* eslint-disable @typescript-eslint/no-explicit-any */
import prisma from "~/lib/prisma"
import type { ServiceType, Service, Prisma } from "@prisma/client"
import { NodeSelector } from "../NodeSelector"
import { PterodactylService } from "~/server/services/pterodactyl.service"
import type { ServerCreateParams } from "~/types/pterodactyl"

interface ProvisioningParams {
  userId: string
  serviceType: ServiceType
  configuration: any // Using any here to fix compatibility issues
}

interface HostRequirements {
  cpu: number
  memory: number
  disk: number
  location: number
}

interface Host {
  id: string;
  // Add other host properties as needed
}

export class ProvisioningService {
  private nodeSelector = new NodeSelector();
  private pterodactyl = new PterodactylService();

  async provisionService(params: ProvisioningParams): Promise<Service> {
    console.log('Provisioning service:', params);
    
    // 1. Validate resources
    const resourceRequirements: HostRequirements = {
      cpu: params.configuration.cpu * 100, // Convert cores to % (100% per core)
      memory: params.configuration.ram * 1024, // Convert GB to MB
      disk: params.configuration.disk * 1024, // Convert GB to MB
      location: params.configuration.location
    };

    console.log('Resource requirements:', resourceRequirements);

    try {
      // Get user
      const user = await prisma.user.findUnique({
        where: { id: params.userId }
      });

      if (!user) {
        throw new Error('User not found');
      }

      

      // 2. If game server, handle with Pterodactyl
      if (params.serviceType === 'GAME_SERVER') {
        const host = await this.nodeSelector.findOptimalNode(resourceRequirements) as unknown as Host;
        return await this.provisionGameServer(params, host.id);
      } else {
        // 4. For other service types
        // 3. Find suitable host - fix the type
        // const host = await this.nodeSelector.findOptimalHost(resourceRequirements) as unknown as Host;
        throw new Error('Service type not supported yet');
        // if (!host) {
          // console.error('No available hosts matching requirements');
          // throw new Error('No available hosts matching requirements');
        // }
        // return await this.provisionGenericService(params, host.id);
      }
    } catch (error: unknown) {
      console.error('Provisioning error:', error);
      throw new Error(`Service provisioning failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async provisionGameServer(params: ProvisioningParams, hostId: string): Promise<Service> {
    try {
      // 1. Get user
      const user = await prisma.user.findUnique({
        where: { id: params.userId }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // 2. Get nest and egg IDs from config or use defaults
      const nestId = params.configuration.nestId || this.getNestId(params.configuration.gameType || 'minecraft');
      const eggId = params.configuration.eggId || this.getEggId(
        params.configuration.gameType || 'minecraft', 
        params.configuration.eggType
      );
      
      console.log(`Using Nest ID: ${nestId}, Egg ID: ${eggId}`);
      
      // 3. Set up game-specific configuration
      const gameConfig = this.getGameSpecificConfig({
        ...params.configuration,
        nest: params.configuration.gameType || 'minecraft',
        egg: params.configuration.eggType || 'vanilla'
      });
      
      // 4. Create the complete server configuration
      const serverCreateParams: ServerCreateParams = {
        servername: `game-${Date.now().toString().substring(7)}`,
        memory: params.configuration.ram * 1024,
        disk: params.configuration.disk * 1024,
        cpu: params.configuration.cpu * 100,
        nest: nestId,
        egg: eggId,
        swap: 2048,
        io: 500,
        location: 0, // Default location
        databases: 0,
        backups: 0,
        allocation_limit: 0,
        allocation: {
          default: 0
        },
        ...gameConfig  // Merge game-specific config
      };
      
      // 5. Use Pterodactyl service to create the server
      const service = await this.pterodactyl.createServer(user, serverCreateParams);
      
      // 6. Update host status
      // await prisma.host.update({
        // where: { id: hostId },
        // data: { 
          // status: 'ALLOCATED',
        // }
      // });

      // 7. Create service tracking record for monitoring
      await prisma.serviceDeployment.create({
        data: {
          serviceId: service.id,
          status: 'PENDING',
          logs: ['Server provisioning started']
        }
      });
      
      return service;
    } catch (error: unknown) {
      console.error('Game server provisioning error:', error);
      throw error;
    }
  }

  private async provisionGenericService(params: ProvisioningParams, hostId: string): Promise<Service> {
    // Create the service record with properly typed config
    const service = await prisma.service.create({
      data: {
        type: params.serviceType,
        userId: params.userId,
        hostId: hostId,
        config: this.buildServiceConfig(params) as Prisma.JsonObject,
      },
    });

    // Update host status
    // await prisma.host.update({
      // where: { id: hostId },
      // data: { status: 'ALLOCATED' }
    // });

    return service;
  }

  private getGameSpecificConfig(config: any): any {
    const nestType = config.nest?.toLowerCase();
    const eggType = config.egg?.toLowerCase();
    
    // Default config for the nest type
    let baseConfig: any = {};
    
    // Nest-specific configurations
    switch (nestType) {
      case 'minecraft':
        baseConfig = {
          environment: {
            MEMORY: `${config.ram}G`,
            DIFFICULTY: 'normal',
            MAX_PLAYERS: config.slots || 20,
          }
        };
        
        // Egg-specific configurations
        switch (eggType) {
          case 'vanilla':
            baseConfig.environment.SERVER_JARFILE = 'server.jar';
            baseConfig.environment.MINECRAFT_VERSION = config.version || 'latest';
            break;
          case 'paper':
            baseConfig.environment.SERVER_JARFILE = 'paper.jar';
            baseConfig.environment.MINECRAFT_VERSION = config.version || 'latest';
            baseConfig.environment.BUILD_TYPE = 'recommended';
            break;
          case 'forge':
            baseConfig.environment.SERVER_JARFILE = 'forge-server.jar';
            baseConfig.environment.MINECRAFT_VERSION = config.version || '1.19.2';
            baseConfig.environment.FORGE_VERSION = config.forgeVersion || 'recommended';
            break;
          case 'fabric':
            baseConfig.environment.SERVER_JARFILE = 'fabric-server.jar';
            baseConfig.environment.MINECRAFT_VERSION = config.version || 'latest';
            baseConfig.environment.FABRIC_VERSION = config.fabricVersion || 'latest';
            break;
          default:
            // Default to vanilla configuration
            baseConfig.environment.SERVER_JARFILE = 'server.jar';
            baseConfig.environment.MINECRAFT_VERSION = config.version || 'latest';
        }
        break;
        
      case 'project_zomboid':
        // No egg differentiation for Project Zomboid yet
        baseConfig = {
          environment: {
            ADMIN_PASSWORD: 'kratos_host',
            SERVER_MEMORY: `${config.ram}G`,
            PLAYERS: config.slots || 16,
            MOD_IDS: '',
            SERVER_PORT: 16261,
            RCON_PORT: 27015,
          }
        };
        break;
        
      // Continue with other nest types
      case 'rust':
        // No egg differentiation for Rust yet
        baseConfig = {
          environment: {
            MAX_PLAYERS: config.slots || 50,
            SERVER_LEVEL: 'Procedural Map',
            SERVER_MAP: 'Procedural Map',
            WORLD_SIZE: '3500',
            SEED: Math.floor(Math.random() * 100000).toString(),
          }
        };
        break;
        
      case 'valheim':
        // No egg differentiation for Valheim yet
        baseConfig = {
          environment: {
            SERVER_NAME: `Valheim Server ${Date.now().toString().substring(7)}`,
            WORLD_NAME: 'valheim_world',
            PASSWORD: 'change_me',
            PUBLIC: '1',
          }
        };
        break;
    }
    
    return baseConfig;
  }

  private getNestId(nestType: string): number {
    // Map nest types to nest IDs
    const nestMapping = {
      'minecraft': 1,
      'project_zomboid': 2,
      'rust': 3,
      'valheim': 4,
    };

    return nestMapping[nestType?.toLowerCase() as keyof typeof nestMapping] || 1;
  }

  private getEggId(nestType: string, eggType?: string): number {
    // Define mappings for each nest type to its available eggs
    const eggMappings: Record<string, Record<string, number>> = {
      'minecraft': {
        'vanilla': 3,  // Updated to match your config template
        'paper': 1,    // Paper Spigot, ID 1
        'forge': 4,    // Updated to match your config template
        'spigot': 1,   // Using Paper ID since it's a variant of Spigot
        'fabric': 12,
        'default': 3   // Default to vanilla if not specified
      },
      'project_zomboid': {
        'default': 16
      },
      'rust': {
        'default': 2
      },
      'valheim': {
        'default': 15
      }
    };

    // Get the egg mapping for this nest type
    const nestEggs = eggMappings[nestType?.toLowerCase()] || {};
    
    // Return the specific egg ID if provided and exists, otherwise return default
    return (eggType && nestEggs[eggType.toLowerCase()]) || nestEggs['default'] || 1;
  }

  private buildServiceConfig(params: ProvisioningParams): Record<string, any> {
    switch (params.serviceType) {
      case 'GAME_SERVER':
        return {
          nest: params.configuration.nestId || this.getNestId(params.configuration.gameType),
          egg: params.configuration.eggId || this.getEggId(params.configuration.gameType, params.configuration.eggType),
          ram: params.configuration.ram,
          cpu: params.configuration.cpu,
          disk: params.configuration.disk
        };
      case 'VPS':
        return {
          os: 'ubuntu',
          ram: params.configuration.ram,
          cpu: params.configuration.cpu,
          disk: params.configuration.disk
        };
      default:
        return params.configuration;
    }
  }

  private async generateNetworkConfig(): Promise<{ipv4: string, ports: {tcp: number[]}}> {
    // Implementation depends on your network management
    return {
      ipv4: await this.allocateIPv4Address(),
      ports: { tcp: [25565] }
    };
  }

  private async allocateIPv4Address(): Promise<string> {
    // This is a placeholder - implement your IP allocation strategy
    return '192.168.1.1';
  }

  // async createPterodactylServer(service: any, gameConfig: any): Promise<void> {
  //   try {
  //     // Get the user
  //     const user = await prisma.user.findUnique({
  //       where: { id: service.userId }
  //     });
      
  //     if (!user) {
  //       throw new Error('User not found');
  //     }
      
  //     // Ensure the user has a Pterodactyl ID
  //     if (!user.pteroUserId) {
  //       // Create the user in Pterodactyl first
  //       const pterodactylUser = await this.pterodactyl.createUser(user);
        
  //       // Update the user with their Pterodactyl ID
  //       await prisma.user.update({
  //         where: { id: user.id },
  //         data: { pteroUserId: pterodactylUser.id }
  //       });
  //     }
      
  //     // Extract configuration details
  //     const config = service.config || {};
      
  //     // Create the server in Pterodactyl
  //     const serverParams = {
  //       name: `game-${service.id.substring(0, 8)}`,
  //       user: user.pteroUserId,
  //       egg: config.eggId || 1,
  //       nest: config.nestId || 1,
  //       memory: (config.ram || 4) * 1024,
  //       disk: (config.disk || 50) * 1024,
  //       cpu: (config.cpu || 2) * 100,
  //       // Other required params...
  //       swap: 0,
  //       io: 500,
  //       location: 1, // Default location ID
  //       databases: 0,
  //       backups: 0,
  //       allocation_limit: 0,
  //       environment: gameConfig?.environment || {}
  //     };
      
  //     // Call Pterodactyl API to create the server
  //     const pterodactylServer = await this.pterodactyl.createServer(user, serverParams);
      
  //     // Link the Pterodactyl server to our service
  //     await prisma.pterodactylServer.create({
  //       data: {
  //         serviceId: service.id,
  //         pterodactylId: pterodactylServer.id || `temp_${Date.now()}`,
  //         status: 'INSTALLING'
  //       }
  //     });
      
  //     console.log(`Created Pterodactyl server for service ${service.id}`);
      
  //   } catch (error) {
  //     console.error('Failed to create Pterodactyl server:', error);
  //     throw error;
  //   }
  // }
}