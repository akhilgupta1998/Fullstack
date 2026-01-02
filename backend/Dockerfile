FROM node:20-alpine

WORKDIR /app

# Copy only package files first (better caching)
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy the rest of the source
COPY . .

EXPOSE 5000

CMD ["node", "index.js"]
