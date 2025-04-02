// services/NodeSelector.ts
import { PterodactylService } from './pterodactyl.service'
import type { Node } from '~/types/pterodactyl'

interface HostRequirements {
  cpu: number // 100 = 1 core
  memory: number // MB
  disk: number   // MB
  location: number // Location ID
}

export class NodeSelector {
  private pterodactyl: PterodactylService

  constructor() {
    this.pterodactyl = new PterodactylService()
  }

  async findOptimalNode(requirements: HostRequirements): Promise<{ nodeId: number; allocationId: number }> {
    // Fetch nodes from Pterodactyl API
    const response = await this.pterodactyl.getNodes() as { data: { attributes: Node; id: number }[] }
    console.log(`Fetched ${response.data.length} nodes from Pterodactyl`)
    console.log(`Requirements: CPU=${requirements.cpu}, Memory=${requirements.memory}MB, Disk=${requirements.disk}MB, Location=${requirements.location}`)
    console.log('Calculating scores for each node...')
    // Filter nodes by location if specified
    let nodes = response.data.map(item => item.attributes)
    console.log(`Fetched ${nodes.length} nodes from Pterodactyl`)
    console.log(`Response data: ${JSON.stringify(response.data)}`)
    console.log(`Nodes: ${JSON.stringify(nodes)}`)

    
    if (requirements.location) {
      nodes = nodes.filter(node => node.location_id === requirements.location)
    }
    console.log(`Filtered nodes location: ${JSON.stringify(nodes)}`)
    // Filter out nodes in maintenance mode
    nodes = nodes.filter(node => node.maintenance_mode === false)
    console.log(`Filtered nodes maintenance_mode: ${JSON.stringify(nodes)}`)
    
    if (nodes.length === 0) {
      throw new Error('No available nodes found matching the criteria')
    }
    
    // Calculate scores for each node
    const scoredNodes = await Promise.all(nodes.map(async node => {
      const score = this.calculateNodeScore(node, requirements)
      
      // Only include nodes that have enough resources and available allocations
      if (score <= 0) {
        return null
      }
      
      try {
        console.log(`Fetching available allocations for node ${node.id}...`)
        // Check if the node has available allocations
        const allocations = await this.pterodactyl.getAvailableAllocations(node.id)
        if (!allocations.length) {
          return null
        }
        console.log(`Found ${allocations.length} available allocations for node ${node.id}`)
        console.log(`Allocations: ${JSON.stringify(allocations)}`)
        return {
          nodeId: node.id,
          allocationId: allocations[0].id,
          score
        }
      } catch (error) {
        console.error(`Failed to get allocations for node ${node.id}:`, error)
        return null
      }
    }))

    console.log(`Scored nodes: ${JSON.stringify(scoredNodes)}`)
    
    // Filter out null entries and sort by score (highest first)
    const validNodes = scoredNodes.filter(node => node !== null)
                                  .sort((a, b) => b.score - a.score)
    
    if (validNodes.length === 0) {
      throw new Error('No nodes with sufficient resources and available allocations found')
    }
    
    // Return the node with the highest score
    return {
      nodeId: validNodes[0].nodeId,
      allocationId: validNodes[0].allocationId
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private calculateNodeScore(node: any, requirements: HostRequirements): number {
    // Calculate total available memory considering overallocation
    const totalMemory = node.memory * (1 + node.memory_overallocate / 100)
    const usedMemory = node.allocated_resources?.memory || 0
    const availableMemory = totalMemory - usedMemory
    
    // Calculate total available disk considering overallocation
    const totalDisk = node.disk * (1 + node.disk_overallocate / 100)
    const usedDisk = node.allocated_resources?.disk || 0
    const availableDisk = totalDisk - usedDisk

    // Check if the node meets the minimum requirements
    if (availableMemory < requirements.memory || availableDisk < requirements.disk) {
      return -1
    }
    
    // Calculate score based on available resources relative to requirements
    // We normalize each resource to be between 0 and 1, where 1 is best (more available)
    const memoryScore = availableMemory / requirements.memory
    const diskScore = availableDisk / requirements.disk

    // We give more weight to the resource that's most constrained
    const score = Math.min(memoryScore, diskScore) * 0.7 + 
                 (memoryScore + diskScore) / 2 * 0.3
    
    console.log(`Node ${node.id} (${node.name}) score calculation:`)
    console.log(`- Memory: ${availableMemory}MB available of ${totalMemory}MB total (${node.memory_overallocate}% overallocation)`)
    console.log(`- Disk: ${availableDisk}MB available of ${totalDisk}MB total (${node.disk_overallocate}% overallocation)`)
    console.log(`- Required: ${requirements.memory}MB memory, ${requirements.disk}MB disk`)
    console.log(`- Score: ${score.toFixed(2)}`)
    
    return score
  }
}