// file: ~/next-auth.d.ts
import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  /* Returned by `useAuth`, `getSession` and `getServerSession` */
  interface Session extends DefaultSession {
    user: {
      id: string
      name: string
      avatar: string
      role: 'admin' | 'manager' | 'user'
    }
  }

  interface JWT {
    sessionToken?: string
  }
}