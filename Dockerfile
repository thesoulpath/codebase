# Use Python 3.8 as base image
FROM python:3.8-slim

# Install Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY rasa/requirements.txt ./rasa/

# Install Node.js dependencies
RUN npm install

# Install Python dependencies
RUN pip install --no-cache-dir -r rasa/requirements.txt
RUN pip install --no-cache-dir rasa==3.6.21 tensorflow spacy
RUN python -m spacy download en_core_web_sm

# Copy application code
COPY . .

# Train Rasa model
RUN cd rasa && rasa train

# Make startup script executable
RUN chmod +x start-servers.sh

# Expose ports
EXPOSE 3000 5005

# Start both servers
CMD ["./start-servers.sh"]
