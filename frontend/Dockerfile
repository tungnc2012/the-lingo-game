FROM node:22-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy source code
COPY . .

EXPOSE 5173

# Run vite dev server, host 0.0.0.0 is needed for docker port mapping
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
