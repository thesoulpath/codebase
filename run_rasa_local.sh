#!/bin/bash
cd "/Users/albertosaco/Downloads/Full-Page Scroll Website/rasa"
echo "Starting Rasa locally..."
/opt/anaconda3/envs/rasa-env/bin/python -m rasa run --enable-api --cors "*" --port 5005
