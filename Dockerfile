# Stage 0: Base Image for Dependencies (using a specific Node.js version)
FROM node:20-alpine AS deps
WORKDIR /app

# Copy dependency manifests and install them
COPY package.json yarn.lock* package-lock.json* ./
RUN if [ -f yarn.lock ]; then yarn install --frozen-lockfile; else npm install --frozen-lockfile; fi

# Stage 1: Builder Stage - Build the Next.js application
FROM node:20-alpine AS builder
WORKDIR /app

# Copy node_modules from the deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy all project files (excluding those in .dockerignore)
COPY . .

# Build the Next.js application
# `npm run build` will generate optimized production build in .next
RUN npm run build

# Stage 2: Runner Stage - Run the Next.js application in production
FROM node:20-alpine AS runner
WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Create a non-root user for security
# Next.js 12+ recommends a non-root user for security and better filesystem permissions
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

# Copy essential Next.js build output
# Including static assets and server code
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next

COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/next.config.js ./next.config.js

# If there's a custom server.js, copy it


# Next.js app listens on port 3000 by default
EXPOSE 3000

# Start the Next.js production server
CMD ["npm", "start"]