declare interface PterodactylConfig {
    host: string
    apiKey: string
}

declare interface ServerCreateParams {
    nest: number
    egg: number
    memory: number
    swap: number
    disk: number
    io: number
    cpu: number
    location: number
    databases: number
    backups: number
    allocation_limit: number
    allocation: {
        default: number
    }
    location: number
    port_range?: string
    port_array?: string
    servername?: string
}

interface PterodactylServerResponse {
    object: string;
    attributes: {
        id: number;
        uuid: string;
        identifier: string;
        status: string;
        allocation: number;
        limits: {
            memory: number;
            swap: number;
            disk: number;
            io: number;
            cpu: number;
        };
        // Add other necessary fields from the response
    };
}

declare interface PterodactylServer {
    id: number
    identifier: string,
    name?: string,
    status?: string
    allocation?: {
        ip: string
        port: number
    }
}

// types/pterodactyl.d.ts
export interface Node {
    location_id: number
    maintenance_mode: boolean
    id: number;
    attributes: {
        memory: number;
        disk: number;
        memory_overallocate: number;
        disk_overallocate: number;
        allocated_resources: {
            memory: number;
            disk: number;
        };
        location_id: number;
        maintenance_mode: boolean;
        reserved_resources?: {
            memory: number;
            disk: number;
        };
    };
}

// Add to your PterodactylService class
interface NodeResource {
    id: number;
    location: string;
    memory: number;
    disk: number;
    memory_overallocate: number;
    disk_overallocate: number;
    allocated_resources: {
        memory: number;
        disk: number;
    };
    maintenance_mode: boolean;
}

interface Allocation {
    id: number;
    assigned: boolean;
    ip: string;
    port: number;
}

// Define interface for egg data
interface EggData {
    docker_image: string;
    startup: string;
    relationships?: {
        variables?: {
            data: Array<{
                attributes: {
                    env_variable: string;
                    default_value: string | number | boolean;
                }
            }>
        }
    };
}

interface ApiError extends Error {
    data?: unknown;
}

interface PterodactylResponse {
    attributes: EggData;
}

interface NodeWithLocation extends NodeResource {
    location: string;
}

export interface ServerRequirements {
    memory: number;
    disk: number;
}

export interface NodeSelectionResult {
    nodeId: number | null;
    locationId: number;
    score: number;
}