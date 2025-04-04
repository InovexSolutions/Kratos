import { ofetch } from 'ofetch'
import type { User, Service } from '@prisma/client'
import type { Allocation, ApiError, EggData, NodeResource, NodeWithLocation, PterodactylResponse, PterodactylServer, ServerCreateParams } from '~/types/pterodactyl'
import prisma from '~/lib/prisma'
import { NodeSelector } from './NodeSelector'

export class PterodactylService {
  private readonly config = {
    host: useRuntimeConfig().public.pterodactylUrl,
    apiKey: useRuntimeConfig().pterodactylApiKey,
    clientApiKey: useRuntimeConfig().pterodactylClientApiKey // Add this line
  }
  private headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${this.config.apiKey}`
  }

  async createServer(user: User, config: ServerCreateParams): Promise<Service> {
    const pterodactylUserId = await this.findOrCreateUser(user)
    // console.log('[Pterodactyl] User ID:', pterodactylUserId)
    const serverDetails = await this.createPterodactylServer(pterodactylUserId, config)
    // console.log('[Pterodactyl] Nuxt User ID:', user_uid)

    const existingService = await prisma.service.findFirst({
      where: { 
        type: 'GAME_SERVER',
        userId: user.id,
        status: 'PENDING',
      }
    });
    
    if (!existingService) {
      throw new Error('Service not found');
    }
    
    const service = await prisma.service.update({
      where: { id: existingService.id },
      data: {
        status: 'ACTIVE',
        config: {
          memory: config.memory,
          cpu: config.cpu,
          disk: config.disk,
          pterodactylServerId: serverDetails.id.toString(),
          egg: config.egg,
        },
        orders: {
          updateMany: {
            where: {},  // Update related order
            data: { status: 'ACTIVE' }
          }
        }
      }
    });

    console.log('[Pterodactyl] Service created:', service)

    if (!serverDetails.nodeId) {
      throw new Error('Server creation failed: Node ID is undefined');
    }

    const pteroServer = prisma.pterodactylServer.create({
      data: {
        serviceId: service.id,
        nodeId: serverDetails.nodeId,
        pteroId: serverDetails.id
      }
    });
    console.log('[Pterodactyl] Pterodactyl db server updated:', pteroServer)

    return service
  }

  async deleteServer(serverId: number): Promise<void> {
    try {
      // Delete the server in Pterodactyl
      await ofetch(`${this.config.host}/api/application/servers/${serverId}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });

      // Delete the server from the database
      await prisma.pterodactylServer.delete({
        where: { pteroId: serverId }
      });
    }
    catch (error) {
      console.error('Failed to delete server:', error);
      throw new Error('Failed to delete server');
    }
  }

  private async findOrCreateUser(user: User): Promise<string> {
    try {
      const response = await ofetch(`${this.config.host}/api/application/users?filter[email]=${user.email}`, {
        headers: this.getHeaders()
      });
      console.log('[Pterodactyl] User search response:', response.data)

      if (response.data.length > 0) {
        return response.data[0].attributes.id;
      }

      const username = this.generateUsername(user.email);
      console.log('[Pterodactyl] Creating user:', username)

      const newUser = await ofetch(`${this.config.host}/api/application/users`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: {
          email: user.email,
          username: username,
          first_name: username,
          last_name: 'Kratos',
        }
      });

      await prisma.user.update({
        where: { id: user.id },
        data: {
          pteroUserId: newUser.attributes.id
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  async findAvailableNodeWithAllocation(location: number, requiredMemory: number, requiredCpu: number, requiredDisk: number): Promise<{ nodeId: number, allocationId: number }> {
    try {
      const nodeSelector = new NodeSelector();
      const result = await nodeSelector.findOptimalNode({
        location,
        memory: requiredMemory,
        disk: requiredDisk,
        cpu: requiredCpu
      });

      return result;
    } catch (error) {
      console.error('[Pterodactyl] Node/allocation selection failed:', {
        location,
        requiredMemory,
        requiredDisk,
        error: (error as Error).message
      });
      throw new Error(`No available nodes in location "${location}" with sufficient resources: ${(error as Error).message}`);
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return response.data.map((n: any) => ({
      ...n.attributes,
      location: n.attributes.location_id
    }));
  }

  private calculateAvailableResources(node: NodeResource): number {
    // Prioritize nodes with more available memory and disk
    const availableMemory = node.memory_overallocate === -1 ?
      Infinity :
      node.memory * (1 + node.memory_overallocate / 100) - node.allocated_resources.memory;

    const availableDisk = node.disk_overallocate === -1 ?
      Infinity :
      node.disk * (1 + node.disk_overallocate / 100) - node.allocated_resources.disk;

    return Math.min(availableMemory, availableDisk);
  }


  //   private 
  async createPterodactylServer(userId: string, config: ServerCreateParams): Promise<PterodactylServer> {
    try {
      const { nodeId, allocationId } = await this.findAvailableNodeWithAllocation(
        config.location,
        config.memory,
        config.cpu,
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (!(server as any)?.attributes) {
        throw new Error('Invalid egg data response structure');
      }

      // console.log('[Pterodactyl] Server creation response:', server)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const server_id = (server as any).attributes.id
      // console.log('[Pterodactyl] Server ID:', server_id)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const identifier = (server as any).attributes.identifier
      // console.log('[Pterodactyl] Server Identifier:', identifier)

      return {
        id: server_id,
        identifier: identifier,
        nodeId: nodeId,
        // status: server.data.attributes.status,
        // allocation: server.data.attributes.allocations[0]
      }
    } catch (error) {
      if (error instanceof Error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      if (!(response as PterodactylResponse)?.attributes) {
        throw new Error('Invalid egg data response structure');
      }

      return (response as PterodactylResponse).attributes;
    } catch (error) {
      console.error('[Pterodactyl] getEggData error:', {
        nestId,
        eggId,
        error: (error as Error).message,
        response: (error as ApiError).data
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

  private getClientHeaders() {
    return {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.clientApiKey}`
    }
  }

  private generateUsername(email: string): string {
    // Extract the username part from the email address + hash the full email compress it to 8 characters and add it as a suffix
    const username = email.split('@')[0]
    const hash = this.generatePassword(6)
    return `${username}-${hash}`
  }

  private generatePassword(length = 16): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()'
    return Array.from(crypto.getRandomValues(new Uint32Array(length)))
      .map((n) => chars[n % chars.length])
      .join('')
  }

  // Add this method inside the PterodactylService class
  private async processEnvironment(
    eggData: EggData,
    config: ServerCreateParams
  ): Promise<Record<string, string | number | boolean>> {
    const environment: Record<string, string | number | boolean> = {};

    // Process egg variables
    if (eggData?.relationships?.variables?.data) {
      for (const variable of eggData.relationships.variables.data) {
        const attr = variable.attributes;
        const envVar = attr.env_variable;

        // Use config value if provided, otherwise use egg default
        const configValue = config[envVar as keyof ServerCreateParams];
        const defaultValue = attr.default_value;

        if (configValue !== undefined) {
          environment[envVar] = configValue as string | number | boolean;
        } else if (typeof defaultValue === 'object' && defaultValue !== null && 'default' in defaultValue) {
          environment[envVar] = (defaultValue as { default: number }).default;
        } else {
          environment[envVar] = defaultValue as string | number | boolean;
        }
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
  private processPortEnvironment(portConfig: Record<string, unknown>): Record<string, unknown> {
    const portEnvironment: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(portConfig)) {
      if (key !== 'SERVER_PORT' && key !== 'NONE') {
        portEnvironment[key] = value;
      }
    }

    return portEnvironment;
  }

  async getServerDetails(serverId: number): Promise<PterodactylServer> {
    const response = await ofetch(`${this.config.host}/api/application/servers/${serverId}?include=allocations`, {
      headers: this.getHeaders()
    })
    // console.log('[Pterodactyl] Server details:', response)
    return {
      id: response.attributes.id,
      identifier: response.attributes.identifier,
      name: response.attributes.name,
      status: response.attributes.status,
      limits: {
        cpu: response.attributes.limits.cpu,
        memory: response.attributes.limits.memory,
        disk: response.attributes.limits.disk,
      },
      allocation: response.attributes.relationships.allocations.data[0].attributes
    }
  }

  async getServerDetailsByIdentifier(identifier: string): Promise<PterodactylServer> {
    const response = await ofetch(`${this.config.host}/api/client/servers/${identifier}`, {
      headers: this.getClientHeaders()
    });

    return {
      id: response.attributes.uuid,
      identifier: response.attributes.identifier,
      name: response.attributes.name,
      status: response.attributes.is_suspended ? 'suspended' : (response.attributes.is_installing ? 'installing' : 'running'),
      limits: {
        cpu: response.attributes.limits.cpu,
        memory: response.attributes.limits.memory,
        disk: response.attributes.limits.disk,
      },
      allocation: response.attributes.relationships.allocations.data.find((alloc: any) => alloc.attributes.is_default)?.attributes
    };
  }

  async getServersFromUser(userId: number): Promise<PterodactylServer[]> {
    const response = await ofetch(`${this.config.host}/api/application/users/${userId}?include=servers,allocations`, {
      headers: this.getHeaders()
    })

    console.log('[Pterodactyl] User servers:', response.attributes.relationships.servers.data)

    return response.attributes.relationships.servers.data.map((server: {
      attributes: {
        id: string | number;
        identifier: string;
        name: string;
        status: string;
        relationships: {
          allocations: {
            data: { attributes: Allocation }[];
          };
        };
      };
    }) => ({
      id: server.attributes.id,
      identifier: server.attributes.identifier,
      name: server.attributes.name,
      status: server.attributes.status,
      // allocation: server.attributes.relationships.allocations.data[0].attributes
    }))
  }

  async getServerResources(serverId: string) {
    const response = await ofetch(`${this.config.host}/api/client/servers/${serverId}/resources`, {
      headers: this.getClientHeaders()
    })
    console.log('[Pterodactyl] Server resources:', response)
    return {
      cpu: Math.round(response.attributes.resources.cpu_absolute),
      memory: response.attributes.resources.memory_bytes,
      disk: response.attributes.resources.disk_bytes,
      uptime: response.attributes.resources.uptime
    }
  }

  async getNests() {
    return $fetch(`${this.config.host}/api/application/nests`, {
      headers: this.headers
    })
  }

  async getEggs(nestId: string | number | undefined) {
    const id = nestId ? parseInt(nestId as string) : 1;
    return $fetch(`${this.config.host}/api/application/nests/${id}/eggs`, {
      headers: this.headers
    });
  }

  /**
   * Get Nodes
   * @returns Nodes
   */
  async getNodes() {
    return $fetch(`${this.config.host}/api/application/nodes`, {
      headers: this.headers
    })
  }

  /**
   * Get Users
   * @returns Users
   */
  async getUsers() {
    return $fetch(`${this.config.host}/api/application/users`, {
      headers: this.headers
    })
  }

  /**
     * Get available allocations for a specific node
     * @param nodeId Node ID
     * @returns Array of available allocations
     */
  async getAvailableAllocations(nodeId: number): Promise<Allocation[]> {
    const response = await $fetch<{ data: { attributes: Allocation }[] }>(`${this.config.host}/api/application/nodes/${nodeId}/allocations`, {
      headers: this.headers
    });
    // console.log('Allocations:', response.data);

    // Filter to only get unassigned allocations
    return response.data
      .map((allocation: { attributes: Allocation }) => allocation.attributes)
      .filter((allocation: Allocation) => !allocation.assigned);
  }

  /**
     * Get Locations
     * @returns Locations list
     */
  async getLocations() {
    return $fetch(`${this.config.host}/api/application/locations?include=nodes`, {
      headers: this.headers
    })
  }

  /**
   * Get server utilization (CPU, memory, disk)
   * @param serverId Server identifier
   * @returns Utilization data
   */
  async getServerUtilization(serverId: string): Promise<any> {
    try {
      const response = await $fetch(`${this.config.host}/api/client/servers/${serverId}/resources`, {
        headers: this.getClientHeaders()
      });
      
      // Return both utilization data and current state
      return {
        cpu: response.attributes.resources.cpu_absolute * 100, // Multiply by 100 since 1.0 = 100%
        memory: response.attributes.resources.memory_bytes / 1048576, // Convert to MB
        disk: response.attributes.resources.disk_bytes / 1048576, // Convert to MB
        uptime: response.attributes.resources.uptime,
        network_rx: response.attributes.resources.network_rx_bytes,
        network_tx: response.attributes.resources.network_tx_bytes,
        status: response.attributes.current_state // Add the current state
      };
    } catch (error) {
      console.error('Failed to get server utilization:', error);
      throw new Error('Failed to get server utilization');
    }
  }

  /**
   * Get server console logs
   * @param serverId Server identifier
   * @returns Array of console log lines
   */
  async getServerConsoleLogs(serverId: string): Promise<string[]> {
    try {
      const response = await $fetch(`${this.config.host}/api/client/servers/${serverId}/logs`, {
        headers: this.getClientHeaders()
      });
      
      return response.data || [];
    } catch (error) {
      console.error('Failed to get console logs:', error);
      throw new Error('Failed to get console logs');
    }
  }

  /**
   * Send command to server console
   * @param serverId Server identifier
   * @param command Command to send
   */
  async sendServerCommand(serverId: string, command: string): Promise<void> {
    try {
      await $fetch(`${this.config.host}/api/client/servers/${serverId}/command`, {
        method: 'POST',
        headers: this.getClientHeaders(),
        body: {
          command: command
        }
      });
    } catch (error) {
      console.error('Failed to send command:', error);
      throw new Error('Failed to send command to server');
    }
  }

  /**
   * Send power action to server
   * @param serverId Server identifier
   * @param action Power action (start, stop, restart, kill)
   */
  async sendPowerAction(serverId: string, action: 'start' | 'stop' | 'restart' | 'kill'): Promise<void> {
    try {
      await $fetch(`${this.config.host}/api/client/servers/${serverId}/power`, {
        method: 'POST',
        headers: this.getClientHeaders(),
        body: {
          signal: action
        }
      });
    } catch (error) {
      console.error(`Failed to send ${action} action:`, error);
      throw new Error(`Failed to ${action} server`);
    }
  }
}