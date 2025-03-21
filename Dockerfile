# Build stage
FROM node:23-slim AS builder

WORKDIR /app

# Declare build argument for DATABASE_URL
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}

# Environment setup for build
ENV NODE_ENV=development
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable


# Install pnpm
RUN corepack prepare pnpm@latest --activate

# Copy package.json and lockfile
COPY package.json pnpm-lock.yaml ./

# Copy prisma schema and migrations first
COPY prisma ./prisma/

RUN pnpm i --shamefully-hoist --frozen-lockfile

# Generate Prisma client
RUN npx prisma migrate deploy

# Copy the rest of the application
COPY . .

# Build the application
RUN pnpm run build

#################################################
# Production stage
FROM node:23-slim AS runner

WORKDIR /app

# Environment setup for production
ENV NODE_ENV=production
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Install pnpm
RUN corepack prepare pnpm@latest --activate

# Copy necessary files from builder stage
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/prisma ./prisma

# Install only production dependencies
RUN pnpm install --prod

# Set environment variables
ENV PORT=3000

ENV DATABASE_URL=${DATABASE_URL}
ENV FRONTEND_URL=${FRONTEND_URL}
ENV JWT_SECRET=${JWT_SECRET}
ENV PTERODACTYL_URL=${PTERODACTYL_URL}
ENV PTERODACTYL_API_KEY=${PTERODACTYL_API_KEY}

ENV STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
ENV STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK_SECRET}
ENV STRIPE_PUBLISHABLE_KEY=${STRIPE_PUBLISHABLE_KEY}

ENV SECRET=${SECRET}

ENV DISCORD_ID=${DISCORD_ID}
ENV DISCORD_SECRET=${DISCORD_SECRET}
ENV GH_ID=${GH_ID}
ENV GH_SECRET=${GH_SECRET}


# Expose port
EXPOSE 3000

# Run the application
CMD ["node", ".output/server/index.mjs"]