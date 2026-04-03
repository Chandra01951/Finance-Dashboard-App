FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy application code
COPY . .

# Expose port (Render uses dynamic port, but this is fine)
EXPOSE 5000

# Start server in production mode
CMD ["npm", "start"]