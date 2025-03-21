// import GithubProvider from 'next-auth/providers/github'
// import CredentialsProvider from 'next-auth/providers/credentials'
import { NuxtAuthHandler } from '#auth'
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "~/server/lib/prisma"
// import { prisma } from "@/prisma"
import DiscordProvider from 'next-auth/providers/discord'
import GithubProvider from 'next-auth/providers/github'
import CredentialsProvider from "next-auth/providers/credentials";

export default NuxtAuthHandler({
    // A secret string you define, to ensure correct encryption
      secret: process.env.SECRET,
    // secret: useRuntimeConfig().authSecret,
    // pages: {
        // signIn: '/api/auth/signIn',
        // signOut: '/api/auth/signOut',
        // error: '/api/auth/error',
        // verifyRequest: '/api/auth/verify-request',
        // newUser: '/api/auth/new-user'
    // },
    adapter: PrismaAdapter(prisma) as any,
    providers: [
        // @ts-expect-error Use .default here for it to work during SSR.
        GithubProvider.default({
          clientId: process.env.GH_ID!,
          clientSecret: process.env.GH_SECRET!
        }),
        DiscordProvider.default
        ({
            clientId: process.env.DISCORD_ID!, // Your Discord application ID
            clientSecret: process.env.DISCORD_SECRET! // Your Discord application secret
        }),
        // CredentialsProvider.default({
            // credentials: {
                // email: { label: 'Email', type: 'email', placeholder: '' },
                // password: { label: 'Password', type: 'password' }
            // },
            // async authorize(credentials: { email: any }, req: any) {
                // const user = await prisma.user.findFirst({
                    // where: {
                        // email: credentials.email
                    // }
                // })
                // if (user // && user.password === credentials.password
                // ) {
                    // return user
                // } else {
                    // return null
                // }
            // }
        // }),
        /*
        CredentialsProvider({
            credentials: {
                email: { label: 'Email', type: 'email', placeholder: '' },
                password: { label: 'Password', type: 'password' }
            },
            authorize: async (credentials, req) => {
              */
    ],
    callbacks: {
        /* on before signin */
        async signIn({ user, account, profile, email, credentials }) {
            return true
        },
        /* on redirect to another url */
        async redirect({ url, baseUrl }) {
            return baseUrl
        },
        /* on session retrival */
        async session({ session, user, token }) {
            // Add custom session properties
            if (session.user) {
                session.user.id = user?.id || token.sub as string
                // Add any other custom user properties you need
            }
            // Token we injected into the JWT callback above.
            if (token) {
                const token2 = token.sessionToken
                // Fetch data OR add previous data from the JWT callback.
                const additionalUserData = await $fetch<{ name: string, avatar: string, role: string }>(`/api/session/${token2}`)
                
                
                return {
                    ...session,
                    user: {
                        name: additionalUserData.name,
                        avatar: additionalUserData.avatar,
                        role: additionalUserData.role
                    }
                }
            }
            return session
            
            // return session
        },
        // async session({ session, user, token }) {
            // const token2 = token.sessionToken
// 
            // //Fetch data OR add previous data from the JWT callback.
            // const additionalUserData: { name: string, avatar: string, role: string } = await $fetch(`/api/session/${token2}`)
// 
            // return {
                // ...session,
                // user: {
                    // name: additionalUserData.name,
                    // avatar: additionalUserData.avatar,
                    // role: additionalUserData.role
                // }
            // }
        // },
        /* on JWT token creation or mutation */
        async jwt({ token, user, account, profile, isNewUser }) {
            // Add custom JWT properties
            if (account) {
                token.sessionToken = account.session_token
            }
            if (user) {
              token.sub = user.id
            }
            return token
        }
    },
    events: {
        async signIn(message) { /* on successful sign in */ },
        async signOut(message) { /* on signout */ },
        async createUser(message) { /* user created */ },
        async updateUser(message) { /* user updated - e.g. their email was verified */ },
        async linkAccount(message) { /* account (e.g. GitHub) linked to a user */ },
        async session(message) { /* session is active */ },
    },
})