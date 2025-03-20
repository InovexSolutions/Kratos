// services/NodeSelector.ts
import { prisma } from "~/server/lib/prisma"

interface HostRequirements {
  cpu: number // 100 = 1 core
  memory: number // MB
  disk: number   // MB
  location: string
}

export class NodeSelector {
  async findOptimalHost(requirements: HostRequirements): Promise<string | null> {
    const viableHosts = await prisma.host.findMany({
      where: {
        dataCenter: { name: requirements.location },
        status: 'AVAILABLE',
        spec: {
          path: ['cpu'],
          gte: requirements.cpu / 100
        }
      },
      include: { dataCenter: true }
    });
    console.log('Viable hosts:', viableHosts);

    const scoredHosts = viableHosts.map(host => ({
      host,
      score: this.calculateHostScore(host, requirements)
    })).filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score);
    
    console.log('Scored hosts:', scoredHosts);

    return scoredHosts[0]?.host.id || null;
  }

  private calculateHostScore(host: any, req: HostRequirements): number {
    const spec = host.spec as Record<string, number>;
    // console.log('Host spec:', spec);
    const allocated = host.allocated as Record<string, number>;
    // console.log('Host allocated:', allocated);
    const availableMemory = spec.ram - (allocated.ram || 0);
    // console.log('Available memory:', availableMemory);
    const availableDisk = spec.storage - (allocated.storage || 0);
    // console.log('Available disk:', availableDisk);

    return Math.min(
      availableMemory - req.memory / 1024,
      availableDisk - req.disk / 1024,
      spec.cpu - req.cpu / 100
    );
  }
}