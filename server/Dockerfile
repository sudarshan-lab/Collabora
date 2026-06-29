# Backend container for Cloud Run
FROM node:20-slim

WORKDIR /app

# Install deps first for better layer caching
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source
COPY . .

# Cloud Run sets PORT (defaults to 8080); index.js reads it.
ENV NODE_ENV=production
EXPOSE 8080

CMD ["node", "index.js"]
