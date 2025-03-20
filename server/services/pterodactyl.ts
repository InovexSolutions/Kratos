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
        return $fetch(`${process.env.PTERODACTYL_URL}/api/application/servers`, {
            method: 'POST',
            headers: this.headers,
            body: {
                name: data.name,
                user: data.userId,
                egg: data.eggId,
                docker_image: data.dockerImage,
                startup: data.startup,
                environment: data.environment,
                limits: {
                    memory: 1024,
                    swap: 0,
                    disk: 1024,
                    io: 500,
                    cpu: 100
                },
                feature_limits: {
                    databases: 5,
                    backups: 1
                }
            }
        })
    }

    async updateServer(id: string, data: any) {
        return $fetch(`${process.env.PTERODACTYL_URL}/api/application/servers/${id}`, {
            method: 'PATCH',
            headers: this.headers,
            body: data
        })
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

    async getEggs() {
        return $fetch(`${process.env.PTERODACTYL_URL}/api/application/nests/1/eggs`, {
            headers: this.headers
        })
    }

    // Add this method to your PterodactylService class

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
          data: localUsers.map(user => ({
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