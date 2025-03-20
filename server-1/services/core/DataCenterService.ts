import { prisma } from '~/server/lib/prisma'

export class DataCenterService {
  /**
   * Get all data centers with summary statistics
   */
  // MUST CHANGE WORK IN PROGRESS
  /*
  async getAllDataCenters() {
    // Get all datacenters with hosts
    const datacenters = await prisma.dataCenter.findMany({
      include: {
        hosts: true
      }
    })

    // Enhance with stats
    return datacenters.map(dc => {
      // Calculate total and available resources
      let totalCpu = 0;
      let totalRamGB = 0;
      let totalStorageTB = 0;
      let allocatedCpu = 0;
      let allocatedRamGB = 0;
      let allocatedStorageTB = 0;
      
      // Count hosts by status
      const hostCounts = {
        AVAILABLE: 0,
        ALLOCATED: 0,
        MAINTENANCE: 0,
        RETIRED: 0,
        total: dc.hosts.length
      };

      // Process each host
      dc.hosts.forEach(host => {
        // Add to resources
        totalCpu += host.spec.cpu;
        totalRamGB += host.spec.ramGB;
        totalStorageTB += host.spec.storageTB;
        
        allocatedCpu += host.allocated.cpu;
        allocatedRamGB += host.allocated.ramGB;
        allocatedStorageTB += host.allocated.storageTB;
        
        // Count by status
        hostCounts[host.status]++;
      });

      // Return enhanced datacenter object
      return {
        ...dc,
        resources: {
          total: {
            cpu: totalCpu,
            ramGB: totalRamGB,
            storageTB: totalStorageTB
          },
          allocated: {
            cpu: allocatedCpu,
            ramGB: allocatedRamGB,
            storageTB: allocatedStorageTB
          },
          available: {
            cpu: totalCpu - allocatedCpu,
            ramGB: totalRamGB - allocatedRamGB,
            storageTB: totalStorageTB - allocatedStorageTB
          }
        },
        hostCounts
      };
    });
  }
  */

  /**
   * Get detailed information about a specific data center
   */
  // MUST CHANGE WORK IN PROGRESS
  /*
  async getDataCenter(id: string) {
    const datacenter = await prisma.dataCenter.findUnique({
      where: { id },
      include: {
        hosts: {
          include: {
            services: true,
            owner: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!datacenter) {
      throw new Error('Data center not found');
    }

    // Calculate resources like in getAllDataCenters
    let totalCpu = 0;
    let totalRamGB = 0;
    let totalStorageTB = 0;
    let allocatedCpu = 0;
    let allocatedRamGB = 0;
    let allocatedStorageTB = 0;
    
    const hostCounts = {
      AVAILABLE: 0,
      ALLOCATED: 0,
      MAINTENANCE: 0,
      RETIRED: 0,
      total: datacenter.hosts.length
    };

    datacenter.hosts.forEach(host => {
      totalCpu += host.spec.cpu;
      totalRamGB += host.spec.ramGB;
      totalStorageTB += host.spec.storageTB;
      
      allocatedCpu += host.allocated.cpu;
      allocatedRamGB += host.allocated.ramGB;
      allocatedStorageTB += host.allocated.storageTB;
      
      hostCounts[host.status]++;
    });

    return {
      ...datacenter,
      resources: {
        total: {
          cpu: totalCpu,
          ramGB: totalRamGB,
          storageTB: totalStorageTB
        },
        allocated: {
          cpu: allocatedCpu,
          ramGB: allocatedRamGB,
          storageTB: allocatedStorageTB
         },
         available: {
            cpu: totalCpu - allocatedCpu,
            ramGB: totalRamGB - allocatedRamGB,
            storageTB: totalStorageTB - allocatedStorageTB
         }
      },
      hostCounts
    };
  }
  */

  /**
   * Create a new data center
   */
  async createDataCenter(data: { name: string; location: string }) {
    // Check if datacenter with same name already exists
    const existing = await prisma.dataCenter.findUnique({
      where: { name: data.name }
    });

    if (existing) {
      throw new Error('Data center with this name already exists');
    }

    // Create new datacenter
    const datacenter = await prisma.dataCenter.create({
      data: {
        name: data.name,
        location: data.location
      }
    });

    return datacenter;
  }

  /**
   * Update an existing data center
   */
  async updateDataCenter(id: string, data: { name?: string; location?: string }) {
    // Check if datacenter exists
    const existing = await prisma.dataCenter.findUnique({
      where: { id }
    });

    if (!existing) {
      throw new Error('Data center not found');
    }

    // Check for name conflict if name is being updated
    if (data.name && data.name !== existing.name) {
      const nameConflict = await prisma.dataCenter.findUnique({
        where: { name: data.name }
      });

      if (nameConflict) {
        throw new Error('Another data center with this name already exists');
      }
    }

    // Update datacenter
    const datacenter = await prisma.dataCenter.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.location && { location: data.location })
      }
    });

    return datacenter;
  }

  /**
   * Delete a data center if it has no hosts
   */
  async deleteDataCenter(id: string) {
    // Check if datacenter has hosts
    const hostCount = await prisma.host.count({
      where: { dataCenterId: id }
    });

    if (hostCount > 0) {
      throw new Error(`Cannot delete datacenter with ${hostCount} hosts. Remove all hosts first.`);
    }

    // Delete datacenter
    await prisma.dataCenter.delete({
      where: { id }
    });

    return { success: true };
  }

  /**
   * Find suitable host for allocation based on resource requirements
   */
  async findAvailableHost(dataCenterId: string, requirements: { cpu: number; ramGB: number; storageTB: number; type: string }) {
    // Find hosts that match type and have enough resources
    const hosts = await prisma.host.findMany({
      where: {
        dataCenterId,
        status: 'AVAILABLE',
        type: requirements.type as any
      }
    });

    // Filter hosts that have enough available resources
    /*
    const suitableHosts = hosts.filter(host => {
      if (host.spec && typeof host.spec === 'object' && 'cpu' in host.spec && 'ramGB' in host.spec && 'storageTB' in host.spec) {
        const availableCpu = host.spec.cpu - host.allocated.cpu;
        const availableRamGB = host.spec.ramGB - host.allocated.ramGB;
        const availableStorageTB = host.spec.storageTB - host.allocated.storageTB;
        return (
          availableCpu >= requirements.cpu &&
          availableRamGB >= requirements.ramGB &&
          availableStorageTB >= requirements.storageTB
        );
      } else {
        throw new Error('Invalid host specification');
      }

      
    });
    */

    // Sort by most efficient fit (least wasted resources)
    /*
    suitableHosts.sort((a, b) => {
      const aWaste = 
        (a.spec.cpu - a.allocated.cpu - requirements.cpu) + 
        (a.spec.ramGB - a.allocated.ramGB - requirements.ramGB) + 
        (a.spec.storageTB - a.allocated.storageTB - requirements.storageTB);
        
      const bWaste = 
        (b.spec.cpu - b.allocated.cpu - requirements.cpu) + 
        (b.spec.ramGB - b.allocated.ramGB - requirements.ramGB) + 
        (b.spec.storageTB - b.allocated.storageTB - requirements.storageTB);
        
      return aWaste - bWaste;
    });
    */

    // return suitableHosts[0] || null;
    // MUST CHANGE
    return hosts[0] || null;
  }

  /**
   * Get usage statistics across all data centers
   */
  /*
  async getGlobalStats() {
    const datacenters = await this.getAllDataCenters();
    
    // Aggregate stats across all data centers
    const globalStats = {
      dataCenterCount: datacenters.length,
      hostCount: 0,
      resources: {
        total: {
          cpu: 0,
          ramGB: 0,
          storageTB: 0
        },
        allocated: {
          cpu: 0,
          ramGB: 0,
          storageTB: 0
        },
        utilization: {
          cpu: 0,
          ramGB: 0,
          storageTB: 0
        }
      },
      hostStatus: {
        AVAILABLE: 0,
        ALLOCATED: 0, 
        MAINTENANCE: 0,
        RETIRED: 0
      }
    };

    // Aggregate data from all data centers
    datacenters.forEach(dc => {
      globalStats.hostCount += dc.hosts.length;
      
      // Add resources
      globalStats.resources.total.cpu += dc.resources.total.cpu;
      globalStats.resources.total.ramGB += dc.resources.total.ramGB;
      globalStats.resources.total.storageTB += dc.resources.total.storageTB;
      
      globalStats.resources.allocated.cpu += dc.resources.allocated.cpu;
      globalStats.resources.allocated.ramGB += dc.resources.allocated.ramGB;
      globalStats.resources.allocated.storageTB += dc.resources.allocated.storageTB;
      
      // Add host counts
      globalStats.hostStatus.AVAILABLE += dc.hostCounts.AVAILABLE;
      globalStats.hostStatus.ALLOCATED += dc.hostCounts.ALLOCATED;
      globalStats.hostStatus.MAINTENANCE += dc.hostCounts.MAINTENANCE;
      globalStats.hostStatus.RETIRED += dc.hostCounts.RETIRED;
    });

    // Calculate utilization percentages
    if (globalStats.resources.total.cpu > 0) {
      globalStats.resources.utilization.cpu = 
        (globalStats.resources.allocated.cpu / globalStats.resources.total.cpu) * 100;
    }
    
    if (globalStats.resources.total.ramGB > 0) {
      globalStats.resources.utilization.ramGB = 
        (globalStats.resources.allocated.ramGB / globalStats.resources.total.ramGB) * 100;
    }
    
    if (globalStats.resources.total.storageTB > 0) {
      globalStats.resources.utilization.storageTB = 
        (globalStats.resources.allocated.storageTB / globalStats.resources.total.storageTB) * 100;
    }

    return globalStats;
  }
    */
}