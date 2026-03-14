FROM node:20-alpine
WORKDIR /app

# Install server deps
COPY server/package*.json ./
RUN npm install --production

# Copy server code
COPY server/ ./

# Copy frontend one level up so path __dirname/../frontend resolves correctly
RUN mkdir -p /frontend
COPY frontend/ /frontend/

EXPOSE 3001
CMD ["node", "index.js"]
