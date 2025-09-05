# This Dockerfile redirects to the optimized version
# Render should use render.yaml configuration instead
FROM node:18-alpine AS node-deps

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

FROM python:3.8-alpine AS python-deps

WORKDIR /app
COPY rasa/requirements.txt ./
RUN apk add --no-cache build-base linux-headers && \
    pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir rasa==3.6.21 tensorflow spacy && \
    python -m spacy download en_core_web_sm && \
    apk del build-base linux-headers

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
