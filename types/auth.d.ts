declare module 'bcrypt' {
    export function hash(password: string, saltRounds: number): Promise<string>
    export function compare(password: string, hash: string): Promise<boolean>
}

declare module 'h3' {
    interface H3EventContext {
        user?: User
    }
}

interface User {
    id: string
    email: string
    firstName: string
    lastName: string
    isAdmin: boolean
    stripeCustomerId?: string
    invoiceNinjaClientId?: string
}

interface JwtPayload {
    userId: string
    isAdmin: boolean
    exp: number
}