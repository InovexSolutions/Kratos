import type { Allocation } from "~/types/pterodactyl";

export class PterodactylService {
    private config = useRuntimeConfig()
    private headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.PTERODACTYL_API_KEY}`
    }

    async getServers() {
        return $fetch(`${process.env.PTERODACTYL_URL}/api/application/servers`, {
            headers: this.headers
        })
    }

    async createServer(data: any) {
        console.log('Creating server:', data);
        const getAllocations = await this.getAllocations(data.node);
        if (getAllocations.length === 0) {
            throw new Error('No allocations available on the selected node.');
        }
        const res = await $fetch(`${process.env.PTERODACTYL_URL}/api/application/servers`, {
            method: 'POST',
            headers: this.headers,
            body: {
                name: data.name,
                node: data.nodeId,
                user: data.userId,
                egg: data.eggId,
                docker_image: data.dockerImage || 'quay.io/pterodactyl/core:java',
                startup: data.startup || 'java -Xms128M -Xmx{{SERVER_MEMORY}}M -jar {{SERVER_JARFILE}}',
                environment: data.environment || {
                    SERVER_JARFILE: 'server.jar',
                    VANILLA_VERSION: 'latest'
                },
                limits: {
                    memory: data.limits?.memory || 1024,
                    swap: data.limits?.swap || 0,
                    disk: data.limits?.disk || 1024,
                    io: data.limits?.io || 500,
                    cpu: data.limits?.cpu || 100
                },
                feature_limits: {
                    databases: data.feature_limits?.databases || 1,
                    allocations: data.feature_limits?.allocations || 1,
                    backups: data.feature_limits?.backups || 1
                },
                allocation: data.allocation || {
                    default: getAllocations[0].id,
                },
                external_id: data.external_id || null,
                description: data.description || ''
            }
        })
        console.log('Created server:', res);
        return res;
    }

    /**
     * Get allocations for a node
     * @param nodeId Node ID
     * @returns Allocations
     */
    async getAllocations(nodeId: string) {
        const response: { data: { attributes: Allocation }[] } = await $fetch(`${process.env.PTERODACTYL_URL}/api/application/nodes/${nodeId}/allocations`, {
            headers: this.headers
        })
        return response.data
      .map((a: any) => a.attributes)
      .filter((alloc: Allocation) => !alloc.assigned);
    }

    /**
     * Update server details
     * @param id Server ID
     * @param data Server details data
     */
    async updateServerDetails(id: string, data: {
        name?: string;
        user?: number;
        external_id?: string;
        description?: string;
    }) {
        const res = $fetch(`${process.env.PTERODACTYL_URL}/api/application/servers/${id}/details`, {
            method: 'PATCH',
            headers: this.headers,
            body: {
                name: data.name,
                user: data.user,
                external_id: data.external_id,
                description: data.description
            }
        })
        // console.log('Updated server details:');
        return res;
    }

    /**
     * Update server build configuration
     * @param id Server ID
     * @param data Server build data
     */
    async updateServerBuild(id: string, data: {
        allocation?: number;
        memory?: number;
        swap?: number;
        io?: number;
        cpu?: number;
        disk?: number;
        threads?: number | null;
        feature_limits?: {
            databases?: number;
            allocations?: number;
            backups?: number;
        }
    }) {
        return $fetch(`${process.env.PTERODACTYL_URL}/api/application/servers/${id}/build`, {
            method: 'PATCH',
            headers: this.headers,
            body: {
                allocation: data.allocation,
                memory: data.memory,
                swap: data.swap,
                io: data.io,
                cpu: data.cpu,
                disk: data.disk,
                threads: data.threads,
                feature_limits: {
                    databases: data.feature_limits?.databases,
                    allocations: data.feature_limits?.allocations,
                    backups: data.feature_limits?.backups
                }
            }
        })
    }

    /**
     * Update server startup configuration
     * @param id Server ID
     * @param data Server startup data
     */
    async updateServerStartup(id: string, data: {
        startup?: string;
        environment?: Record<string, string>;
        egg?: string;
        image?: string;
        skip_scripts?: boolean;
    }) {
        return $fetch(`${process.env.PTERODACTYL_URL}/api/application/servers/${id}/startup`, {
            method: 'PATCH',
            headers: this.headers,
            body: {
                startup: data.startup,
                environment: data.environment,
                egg: data.egg,
                image: data.image,
                skip_scripts: data.skip_scripts !== undefined ? data.skip_scripts : false
            }
        })
    }

    /**
     * Comprehensive server update method that updates all aspects of the server
     * @param id Server ID
     * @param data Complete server data
     */
    async updateServer(id: string, data: any) {
        // Split the update into different API calls as required
        const results: any = {};

        // Update details if relevant fields are present
        if (data.name || data.userId || data.external_id || data.description) {
            console.log('Updating server details:', data);
            results.details = await this.updateServerDetails(id, {
                name: data.name,
                user: data.userId,
                external_id: data.external_id,
                description: data.description
            });
        }

        // Update build if relevant fields are present
        if (data.limits || data.feature_limits || data.allocation) {
            results.build = await this.updateServerBuild(id, {
                allocation: data.allocation,
                memory: data.limits?.memory,
                swap: data.limits?.swap,
                io: data.limits?.io,
                cpu: data.limits?.cpu,
                disk: data.limits?.disk,
                threads: data.limits?.threads,
                feature_limits: data.feature_limits
            });
        }

        // Update startup if relevant fields are present
        if (data.startup || data.environment || data.eggId || data.dockerImage) {
            results.startup = await this.updateServerStartup(id, {
                startup: data.startup,
                environment: data.environment,
                egg: data.eggId,
                image: data.dockerImage,
                skip_scripts: data.skip_scripts
            });
        }

        return results;
    }

    async deleteServer(id: string) {
        return $fetch(`${process.env.PTERODACTYL_URL}/api/application/servers/${id}`, {
            method: 'DELETE',
            headers: this.headers
        })
    }

    async getNests() {
        return $fetch(`${process.env.PTERODACTYL_URL}/api/application/nests`, {
            headers: this.headers
        })
    }

    async getEggs(nestId: string | number | undefined) {
        const id = nestId ? parseInt(nestId as string) : 1;
        return $fetch(`${process.env.PTERODACTYL_URL}/api/application/nests/${id}/eggs`, {
            headers: this.headers
        });
    }

    /**
     * Get Nodes
     * @returns Nodes
     */
    async getNodes() {
        return $fetch(`${process.env.PTERODACTYL_URL}/api/application/nodes`, {
            headers: this.headers
        })
    }

    /**
     * Get Users
     * @returns Users
     */
    async getUsers() {
        return $fetch(`${process.env.PTERODACTYL_URL}/api/application/users`, {
            headers: this.headers
        })
    }

    async getCompatibleUsers() {
        try {
            // Get users from our database
            const localUsers = await prisma.user.findMany({
                select: {
                    id: true,
                    email: true,
                    name: true,
                    firstName: true,
                    lastName: true,
                    image: true
                }
            });

            // Format to match Pterodactyl structure
            return {
                object: "list",
                data: localUsers.map((user: { id: any; email: string; name: any; firstName: any; lastName: any; image: any; }) => ({
                    object: "user",
                    attributes: {
                        id: user.id,
                        email: user.email,
                        name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email.split('@')[0],
                        image: user.image,
                    }
                }))
            };
        } catch (error) {
            console.error('Error fetching users:', error);
            throw error;
        }
    }
}