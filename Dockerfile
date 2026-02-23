# ---- Build ----
FROM node:24-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- Production ----
FROM node:24-alpine AS runner

WORKDIR /usr/src/app

# Production deps only
COPY package*.json ./
RUN npm ci --omit=dev

# Built output only (no source or devDependencies)
COPY --from=builder /usr/src/app/dist ./dist

EXPOSE 8080

# Node-based healthcheck (no curl) so image stays minimal
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:'+(process.env.PORT||8080)+'/health/live',r=>{r.on('data',()=>{});r.on('end',()=>process.exit(r.statusCode===200?0:1));}).on('error',()=>process.exit(1))"

CMD [ "node", "dist/app.js" ]
