# ==========================================
# Stage 1: Build the React + Vite Frontend
# ==========================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app/vajra-frontend

# Install node dependencies
COPY vajra-frontend/package*.json ./
RUN npm ci || npm install

# Copy frontend source and build production bundle
COPY vajra-frontend/ ./
RUN npm run build

# ==========================================
# Stage 2: Production Python Backend
# ==========================================
FROM python:3.11-slim
WORKDIR /app

# Prevent python from writing pyc files and buffering stdout
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source, data samples and models
COPY app/ ./app
COPY scripts/ ./scripts

# Copy compiled frontend from Stage 1 into the location main.py serves from
COPY --from=frontend-builder /app/vajra-frontend/dist ./vajra-frontend/dist

# Port configuration (Render / Railway set $PORT automatically)
ENV PORT=8001
EXPOSE 8001

# Start Uvicorn application
CMD python -m uvicorn app.main:app --host 0.0.0.0 --port ${PORT}
