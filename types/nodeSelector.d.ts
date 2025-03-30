// types/nodeSelector.d.ts
export interface Node {
    id: string
    attributes: {
      location_id: number
      memory: number
      disk: number
      cpu: number
        // WIP
    }
  }
  
  export interface NodeSelectionResult {
    nodeId: string
    score: number
  }