# Use official Node.js LTS image
FROM node:18-alpine

# Set working directory inside the container
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy all source code
COPY . .

# Build the NestJS app (if using TypeScript)
RUN npm run build

# Expose the API port
EXPOSE 3000

# Command to start the app
CMD ["npm", "run", "start:prod"]
