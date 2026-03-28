FROM node:20-slim

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy application code
COPY . .

# Expose Vite port
EXPOSE 5173

# Run Vite in host mode
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
