import { ofetch } from 'ofetch'
import type { User, Service } from '@prisma/client'
import { Allocation, NodeResource, NodeWithLocation, PterodactylServer, ServerCreateParams } from '~/types/pterodactyl'
import { prisma } from '~/server/lib/prisma'

export class PterodactylService {
  private readonly config = {
    host: useRuntimeConfig().public.pterodactylUrl,
    apiKey: useRuntimeConfig().pterodactylApiKey
  }

  async createServer(user: User, config: ServerCreateParams): Promise<Service> {
    const pterodactylUserId = await this.findOrCreateUser(user)
    // console.log('[Pterodactyl] User ID:', pterodactylUserId)
    const serverDetails = await this.createPterodactylServer(pterodactylUserId, config)
    // console.log('[Pterodactyl] Nuxt User ID:', user_uid)
    
    return prisma.service.create({
      data: {
        type: 'GAME_SERVER',
        userId: user.id,
        config: {
          memory: config.memory,
          cpu: config.cpu,
          disk: config.disk,
          pterodactylServerId: serverDetails.id.toString(),
          gameType: 'minecraft'
        },
        networkConfig: {
          create: {
            ipv4: serverDetails.allocation.ip,
            ports: { tcp: [serverDetails.allocation.port] }
          }
        }
      },
      include: { networkConfig: true }
    });
  }

  private async findOrCreateUser(user: User): Promise<string> {
    try {
      const response = await ofetch(`${this.config.host}/api/application/users?filter[email]=${user.email}`, {
        headers: this.getHeaders()
      });

      if (response.data.length > 0) {
        return response.data[0].attributes.id;
      }

      const newUser = await ofetch(`${this.config.host}/api/application/users`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: {
          email: user.email,
          username: this.generateUsername(user.email),
          first_name: user.firstName || '',
          last_name: user.lastName || '',
        }
      });

      await prisma.user.update({
        where: { id: user.id },
        data: { 
          config: {
            ...(user.config as object || {}),
            pterodactylUserId: newUser.attributes.id
          }
        }
      });

      return newUser.attributes.id;
    } catch (error) {
      console.error('Pterodactyl user creation failed:', error);
      throw new Error('Failed to create Pterodactyl user');
    }
  }

  async findAvailableNode(location: string, requiredMemory: number, requiredDisk: number): Promise<number> {
    try {
      const response = await ofetch(`${this.config.host}/api/application/nodes`, {
        headers: this.getHeaders(),
        query: {
          filter: JSON.stringify({ location }),
          include: 'allocations'
        }
      });
  
      const nodes = response.data
        .map((n: any) => n.attributes)
        .filter((node: NodeResource) => 
          !node.maintenance_mode &&
          this.nodeHasCapacity(node, requiredMemory, requiredDisk)
        );
  
      if (!nodes.length) {
        throw new Error(`No available nodes in ${location} with sufficient resources`);
      }
  
      // Prioritize nodes with more available resources
      return nodes.sort((a: NodeResource, b: NodeResource) => 
        this.calculateAvailableMemory(b) - this.calculateAvailableMemory(a)
      )[0].id;
    } catch (error) {
      console.error('Node selection failed:', error);
      throw new Error('Failed to find available node');
    }
  }
  
  private nodeHasCapacity(node: NodeResource, requiredMemory: number, requiredDisk: number): boolean {
    const hasMemory = node.memory_overallocate === -1 ? true :
      (node.allocated_resources.memory + requiredMemory) <= 
      (node.memory * (node.memory_overallocate / 100 + 1));
  
    const hasDisk = node.disk_overallocate === -1 ? true :
      (node.allocated_resources.disk + requiredDisk) <= 
      (node.disk * (node.disk_overallocate / 100 + 1));
  
    return hasMemory && hasDisk;
  }
  
  private calculateAvailableMemory(node: NodeResource): number {
    if (node.memory_overallocate === -1) return Infinity;
    return (node.memory * (node.memory_overallocate / 100 + 1)) - node.allocated_resources.memory;
  }
  
  async findAvailableNodeWithAllocation(location: number, requiredMemory: number, requiredDisk: number): Promise<{ nodeId: number, allocationId: number }> {
    try {
      // 1. Get all nodes in the selected location
      const nodes = await this.getNodesByLocation(location);
    //   console.log('[Pterodactyl] Nodes:', nodes);
      
      // 2. Filter and sort nodes
      const suitableNodes = nodes
        .filter(node => 
          !node.maintenance_mode &&
          this.nodeHasCapacity(node, requiredMemory, requiredDisk)
        )
        .sort((a, b) => 
          this.calculateAvailableResources(b) - this.calculateAvailableResources(a)
        );
  
      if (!suitableNodes.length) {
        throw new Error(`No available nodes in location "${location}" with sufficient resources`);
      }
  
      // 3. Find first node with available allocations
      for (const node of suitableNodes) {
        const allocations = await this.getAvailableAllocations(node.id);
        if (allocations.length > 0) {
          return {
            nodeId: node.id,
            allocationId: allocations[0].id
          };
        }
      }
  
      throw new Error(`No available allocations in location "${location}" nodes`);
    } catch (error) {
      console.error('Node/allocation selection failed:', {
        location,
        requiredMemory,
        requiredDisk,
        error: (error as Error).message
      });
      throw error;
    }
  }
  
  private async getNodesByLocation(location: number): Promise<NodeWithLocation[]> {
    // console.log('[Pterodactyl] Fetching nodes for location:', location)
    const response = await ofetch(`${this.config.host}/api/application/nodes`, {
      headers: this.getHeaders(),
      query: {
        filter: JSON.stringify({ location_id: location }),
      }
    });
    // console.log('[Pterodactyl] getNodesByLocation response:', JSON.stringify(response, null, 2));
    return response.data.map((n: any) => ({
      ...n.attributes,
      location: n.attributes.location_id
    }));
  }
  
  private async getAvailableAllocations(nodeId: number): Promise<Allocation[]> {
    const response = await ofetch(`${this.config.host}/api/application/nodes/${nodeId}/allocations`, {
      headers: this.getHeaders()
    });
  
    return response.data
      .map((a: any) => a.attributes)
      .filter((alloc: Allocation) => !alloc.assigned);
  }
  
  private calculateAvailableResources(node: NodeResource): number {
    // Prioritize nodes with more available memory and disk
    const availableMemory = node.memory_overallocate === -1 ? 
      Infinity : 
      node.memory * (1 + node.memory_overallocate/100) - node.allocated_resources.memory;
    
    const availableDisk = node.disk_overallocate === -1 ? 
      Infinity : 
      node.disk * (1 + node.disk_overallocate/100) - node.allocated_resources.disk;
  
    return Math.min(availableMemory, availableDisk);
  }
  

//   private 
  async createPterodactylServer(userId: string, config: ServerCreateParams): Promise<PterodactylServer> {
    try {
        const { nodeId, allocationId } = await this.findAvailableNodeWithAllocation(
            config.location,
            config.memory,
            config.disk
          );
        // console.log('[Pterodactyl] Node and allocation:', nodeId, allocationId)
        
    //   console.log('[Pterodactyl] Fetching egg data:', config.nest, config.egg)
      const eggData = await this.getEggData(config.nest, config.egg)
    //   console.log('[Pterodactyl] Egg data:', eggData)
      const serverName = config.servername || `Server-${Date.now()}`
    //   console.log('[Pterodactyl] Creating server:', serverName)

    //   console.log('[Pterodactyl] Allocation:', config.allocation.default)

      const server = await $fetch(`${this.config.host}/api/application/servers`, {
        method: 'POST',
        headers: this.getHeaders(),
        parseResponse: JSON.parse,
        body: {
          name: serverName,
          user: userId,
          egg: config.egg,
          docker_image: eggData.docker_image,
          startup: eggData.startup,
          environment: await this.processEnvironment(eggData, config),
          limits: {
            memory: config.memory,
            swap: config.swap,
            disk: config.disk,
            io: config.io,
            cpu: config.cpu
          },
          feature_limits: {
            databases: config.databases,
            backups: config.backups,
            allocations: config.allocation_limit
          },
          allocation: {
            default: allocationId
          },
            node: nodeId,
        }
      })

        // console.log('[Pterodactyl] Raw response Server Creation:', JSON.stringify(server, null, 2));

        // Directly access attributes from root object
        if (!(server as any)?.attributes) {
            throw new Error('Invalid egg data response structure');
        }

        // console.log('[Pterodactyl] Server creation response:', server)
        const server_id = (server as any).attributes.id
        // console.log('[Pterodactyl] Server ID:', server_id)
        const identifier = (server as any).attributes.identifier
        // console.log('[Pterodactyl] Server Identifier:', identifier)

      return {
        id: server_id,
        identifier: identifier,
        // status: server.data.attributes.status,
        // allocation: server.data.attributes.allocations[0]
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Server creation failed: ${(error as any).data?.errors?.[0]?.detail || error.message}`)
      } else {
        throw new Error('Server creation failed: Unknown error')
      }
    }
  }

//   private 
    async getEggData(nestId: number, eggId: number) {
        try {
          const response = await $fetch(
            `${this.config.host}/api/application/nests/${nestId}/eggs/${eggId}?include=variables`,
            { 
              headers: this.getHeaders(),
              parseResponse: JSON.parse
            }
          );
      
        //   console.log('[Pterodactyl] Raw response:', JSON.stringify(response, null, 2));
      
          // Directly access attributes from root object
          if (!(response as any)?.attributes) {
            throw new Error('Invalid egg data response structure');
          }
      
          return (response as any).attributes;
        } catch (error) {
          console.error('[Pterodactyl] getEggData error:', {
            nestId,
            eggId,
            error: (error as Error).message,
            response: (error as any).data
          });
          throw new Error(`Failed to get egg data: ${(error as Error).message}`);
        }
    }

  private getHeaders() {
    return {
      Authorization: `Bearer ${this.config.apiKey}`,
      Accept: 'Application/vnd.Pterodactyl.v1+json',
      'Content-Type': 'application/json'
    }
  }

  private generateUsername(email: string): string {
    return email.split('@')[0].replace(/[^\w]/g, '').slice(0, 15)
  }

  private generatePassword(length = 16): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()'
    return Array.from(crypto.getRandomValues(new Uint32Array(length)))
      .map((n) => chars[n % chars.length])
      .join('')
  }

  // Add this method inside the PterodactylService class
private async processEnvironment(
    eggData: any,
    config: ServerCreateParams
  ): Promise<Record<string, any>> {
    const environment: Record<string, any> = {};
  
    // Process egg variables
    if (eggData?.relationships?.variables?.data) {
      for (const variable of eggData.relationships.variables.data) {
        const attr = variable.attributes;
        const envVar = attr.env_variable;
        
        // Use config value if provided, otherwise use egg default
        environment[envVar] = config[envVar as keyof ServerCreateParams] || attr.default_value;
      }
    }
  
    // Add port allocation handling if needed
    if (config.port_array) {
      try {
        const portConfig = JSON.parse(config.port_array);
        Object.assign(environment, this.processPortEnvironment(portConfig));
      } catch (error) {
        console.error('Invalid port array configuration:', error);
      }
    }
  
    return environment;
  }
  
  // Add port environment processing
  private processPortEnvironment(portConfig: Record<string, any>): Record<string, any> {
    const portEnvironment: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(portConfig)) {
      if (key !== 'SERVER_PORT' && key !== 'NONE') {
        portEnvironment[key] = value;
      }
    }
    
    return portEnvironment;
  }

  async getServerDetails(serverId: string): Promise<PterodactylServer> {
    const response = await ofetch(`${this.config.host}/api/application/servers/${serverId}?include=allocations`, {
      headers: this.getHeaders()
    })
    // console.log('[Pterodactyl] Server details:', response)
    return {
      id: response.attributes.id,
      identifier: response.attributes.identifier,
      name: response.attributes.name,
      status: response.attributes.status,
      allocation: response.attributes.relationships.allocations.data[0].attributes
    }
  }

  async getServersFromUser(userId: string): Promise<PterodactylServer[]> {
    const response = await ofetch(`${this.config.host}/api/application/users/${userId}/servers`, {
      headers: this.getHeaders()
    })

    return response.data.map((server: any) => ({
      id: server.attributes.id,
      identifier: server.attributes.identifier,
      name: server.attributes.name,
      status: server.attributes.status,
      allocation: server.attributes.relationships.allocations.data[0].attributes
    }))
  }
}