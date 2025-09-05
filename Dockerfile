# This Dockerfile redirects to the optimized version
# Render should use render.yaml configuration instead
FROM node:18-alpine AS node-deps

WORKDIR /app
COPY package*.json ./
COPY prisma/ ./prisma/
RUN npm ci --only=production && npm cache clean --force

FROM python:3.10-slim AS python-deps

WORKDIR /app
# Aggressive cache busting - force complete rebuild
RUN echo "Build timestamp: $(date)" > /tmp/build_info.txt
RUN echo "Python version: $(python --version)" > /tmp/python_info.txt
RUN apt-get update && apt-get install -y build-essential && \
    pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir spacy==3.6.1 && \
    pip install --no-cache-dir rasa==3.6.21 && \
    python -m spacy download en_core_web_sm && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

FROM node:18-alpine

# Copy Python runtime
COPY --from=python-deps /usr/local /usr/local
COPY --from=python-deps /root/.cache/pip /root/.cache/pip

# Copy Node.js dependencies
COPY --from=node-deps /app/node_modules ./node_modules
COPY package*.json ./

# Install minimal runtime dependencies
RUN apk add --no-cache curl bash

# Set working directory
WORKDIR /app

# Copy application code
COPY . .

# Train Rasa model (optional - can be done at runtime)
RUN cd rasa && rasa train || echo "Rasa training failed, will train at runtime"

# Make startup script executable
RUN chmod +x start-servers.sh

# Expose ports
EXPOSE 3000 5005

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Start both servers
CMD ["./start-servers.sh"]
