import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";
import { admin } from "better-auth/plugins"
import { stripe } from "@better-auth/stripe"
import Stripe from "stripe"
 
const prisma = new PrismaClient();
const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!)
export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql", // or "mysql", "postgresql", ...etc
    }),
    emailAndPassword: {
        enabled: true,
    },
    socialProviders: {
        github: {
            clientId: process.env.GH_ID || "",
            clientSecret: process.env.GH_SECRET || "",
        },
    },
    plugins: [
        admin(),
        stripe({
            stripeClient,
            stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
            createCustomerOnSignUp: false,
        })
    ],
    trustedOrigins: [
        "http://localhost:3000",
        "http://10.1.0.2:3000",
    ]
});