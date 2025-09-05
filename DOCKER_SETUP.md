# Docker Setup for SoulPath Rasa Chatbot

This document explains how the Docker setup works for the SoulPath astrology chatbot and how to run it locally.

## 🏗️ Architecture Overview

The project uses a **microservices architecture** with two separate deployments:

- **Render.com**: Rasa server (Python-based conversational AI)
- **Vercel**: Next.js frontend (React-based chat interface)

## 📁 Project Structure

```
Full-Page Scroll Website/
├── Dockerfile                 # Rasa-only Docker configuration
├── render.yaml               # Render.com deployment config
├── start-rasa.sh            # Rasa server startup script
├── rasa/                    # Rasa conversational AI project
│   ├── data/               # Training data (stories, intents, entities)
│   ├── models/             # Trained Rasa models
│   ├── actions/            # Custom actions
│   ├── config.yml          # Rasa configuration
│   └── domain.yml          # Domain definition
└── app/                    # Next.js frontend
    └── api/chat/simple/    # Chat API endpoints
```

## 🐳 Docker Configuration

### Dockerfile Breakdown

The `Dockerfile` creates a **Rasa-only container** optimized for Render.com:

```dockerfile
# Base image: Python 3.10 slim
FROM python:3.10-slim

# Install system dependencies
RUN apt-get update && apt-get install -y build-essential curl

# Install Python packages
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir spacy==3.6.1 && \
    pip install --no-cache-dir rasa==3.6.21 && \
    python -m spacy download en_core_web_sm

# Copy Rasa project and startup script
COPY rasa/ ./rasa/
COPY start-rasa.sh ./start-rasa.sh

# Set working directory
WORKDIR /app/rasa

# Make startup script executable
RUN chmod +x /app/start-rasa.sh

# Train Rasa model
RUN rasa train

# Expose port 5005
EXPOSE 5005

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5005/health || exit 1

# Start Rasa server
CMD ["/app/start-rasa.sh"]
```

### Key Components

1. **Python 3.10-slim**: Lightweight base image
2. **SpaCy 3.6.1**: Natural language processing
3. **Rasa 3.6.21**: Conversational AI framework
4. **English Language Model**: `en_core_web_sm` for NLP
5. **Port 5005**: Rasa server port
6. **Health Check**: Monitors server status

## 🚀 Startup Script (`start-rasa.sh`)

The startup script handles Rasa server initialization:

```bash
#!/bin/bash
echo "Starting Rasa server..."

# Find Rasa executable dynamically
RASA_CMD=$(which rasa)
if [ -z "$RASA_CMD" ]; then
    RASA_CMD="/usr/local/bin/rasa"
fi

# Verify Rasa is executable
if [ ! -x "$RASA_CMD" ]; then
    echo "Rasa not found, checking Python packages..."
    pip list | grep rasa
    exit 1
fi

# Train model if needed
if [ ! -d "models" ] || [ -z "$(ls -A models/*.tar.gz 2>/dev/null)" ]; then
    echo "Training Rasa model..."
    $RASA_CMD train
fi

# Start Rasa server
$RASA_CMD run --enable-api --cors "*" --debug --port 5005
```

### Script Features

- **Dynamic Path Resolution**: Finds Rasa executable automatically
- **Error Handling**: Provides debugging information if Rasa not found
- **Model Training**: Trains model if none exists
- **CORS Support**: Enables cross-origin requests for frontend
- **Debug Mode**: Provides detailed logging

## 🌐 Render.com Configuration (`render.yaml`)

```yaml
services:
  - type: web
    name: soulpath-rasa-server
    env: docker
    dockerfilePath: ./Dockerfile
    plan: starter
    healthCheckPath: /health
    envVars:
      - key: RASA_PORT
        value: 5005
      - key: OPENROUTER_API_KEY
        sync: false
```

### Configuration Details

- **Service Type**: Web service
- **Environment**: Docker
- **Health Check**: `/health` endpoint
- **Port**: 5005 (Rasa default)
- **Environment Variables**: Rasa port and API keys

## 🏠 Local Development Setup

### Prerequisites

- Docker installed
- Git repository cloned
- Python 3.10+ (for local development)

### Running Locally

#### Option 1: Docker (Recommended)

```bash
# Build the Docker image
docker build -t soulpath-rasa .

# Run the container
docker run -p 5005:5005 soulpath-rasa
```

#### Option 2: Direct Python

```bash
# Navigate to Rasa directory
cd rasa/

# Install dependencies
pip install -r requirements.txt

# Train the model
rasa train

# Start Rasa server
rasa run --enable-api --cors "*" --debug --port 5005
```

### Testing the Server

Once running, test the Rasa server:

```bash
# Health check
curl http://localhost:5005/health

# Parse a message
curl -X POST http://localhost:5005/model/parse \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello, I want to book a reading"}'

# Send a message via webhook
curl -X POST http://localhost:5005/webhooks/rest/webhook \
  -H "Content-Type: application/json" \
  -d '{"sender": "test_user", "message": "Hello"}'
```

## 🔗 Frontend Integration

The Next.js frontend connects to the Rasa server via API:

```typescript
// app/api/chat/simple/route.ts
function getRasaUrl(): string {
  if (process.env.RASA_URL) {
    return process.env.RASA_URL;
  }
  // In production, use Render.com Rasa server
  if (process.env.NODE_ENV === 'production') {
    return 'https://soulpath-rasa-server.onrender.com';
  }
  return 'http://localhost:5005';
}
```

### API Endpoints

- **Parse Intent**: `POST /model/parse`
- **Send Message**: `POST /webhooks/rest/webhook`
- **Health Check**: `GET /health`

## 🎯 Rasa Project Structure

### Training Data (`rasa/data/`)

- **`nlu.yml`**: Natural language understanding training data
- **`stories.yml`**: Conversation flow training data
- **`rules.yml`**: Business rules for conversation

### Configuration (`rasa/config.yml`)

```yaml
language: en
pipeline:
  - name: WhitespaceTokenizer
  - name: RegexFeaturizer
  - name: LexicalSyntacticFeaturizer
  - name: CountVectorsFeaturizer
  - name: CountVectorsFeaturizer
    analyzer: char_wb
    min_ngram: 1
    max_ngram: 4
  - name: DIETClassifier
    epochs: 100
  - name: EntitySynonymMapper
  - name: ResponseSelector
    epochs: 100
  - name: FallbackClassifier
    threshold: 0.3
```

### Domain (`rasa/domain.yml`)

Defines:
- **Intents**: What users can say
- **Entities**: Data to extract
- **Responses**: Bot responses
- **Actions**: Custom actions

## 🚀 Deployment Process

### 1. Render.com Deployment

```bash
# Push to GitHub
git add .
git commit -m "Update Rasa configuration"
git push origin main

# Render automatically deploys from GitHub
# Check deployment status at render.com dashboard
```

### 2. Vercel Deployment

```bash
# Deploy Next.js frontend
vercel --prod

# Set environment variables
vercel env add RASA_URL https://soulpath-rasa-server.onrender.com
```

## 🔧 Troubleshooting

### Common Issues

1. **Rasa not found**
   ```bash
   # Check Python path
   which python
   which pip
   
   # Reinstall Rasa
   pip install --upgrade rasa
   ```

2. **Model training fails**
   ```bash
   # Check training data
   rasa data validate
   
   # Train with debug
   rasa train --debug
   ```

3. **Port conflicts**
   ```bash
   # Check port usage
   lsof -i :5005
   
   # Use different port
   rasa run --port 5006
   ```

4. **CORS issues**
   ```bash
   # Enable CORS
   rasa run --enable-api --cors "*"
   ```

### Debug Commands

```bash
# Validate training data
rasa data validate

# Test NLU
rasa test nlu

# Test stories
rasa test stories

# Interactive learning
rasa interactive

# Shell for testing
rasa shell
```

## 📊 Monitoring

### Health Checks

- **Endpoint**: `GET /health`
- **Response**: Server status and version
- **Frequency**: Every 30 seconds (Render)

### Logs

- **Rasa Logs**: Application logs
- **Docker Logs**: Container logs
- **Render Logs**: Deployment logs

## 🔐 Environment Variables

### Required

- `RASA_PORT`: Server port (default: 5005)
- `OPENROUTER_API_KEY`: For enhanced responses

### Optional

- `RASA_URL`: External Rasa server URL
- `NODE_ENV`: Environment (development/production)

## 📈 Performance Optimization

### Docker Optimizations

- **Multi-stage builds**: Reduce image size
- **Layer caching**: Faster rebuilds
- **Alpine base**: Smaller images

### Rasa Optimizations

- **Model caching**: Reuse trained models
- **Response caching**: Cache common responses
- **Connection pooling**: Reuse database connections

## 🎯 Next Steps

1. **Deploy to Render**: Push changes to trigger deployment
2. **Test Integration**: Verify frontend-backend communication
3. **Monitor Performance**: Check logs and response times
4. **Scale as Needed**: Upgrade Render plan if required

## 📚 Additional Resources

- [Rasa Documentation](https://rasa.com/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [Render Documentation](https://render.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)

---

**Note**: This setup is optimized for production deployment on Render.com with a separate Next.js frontend on Vercel. For local development, you can run both services locally or use the Docker setup for the Rasa server only.
