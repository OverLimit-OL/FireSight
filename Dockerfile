FROM node:24-slim AS frontend
WORKDIR /build
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
ENV VITE_DATA_MODE=http
ENV VITE_API_BASE_URL=/
RUN npm run build
RUN VITE_DATA_MODE=demo npm run build -- --base=/demo/ --outDir=dist-demo
FROM python:3.12-slim
WORKDIR /app
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ ./backend/
COPY --from=frontend /build/dist ./frontend/dist
COPY --from=frontend /build/dist-demo ./frontend/dist-demo
ENV DATA_DIR=/data
CMD ["sh", "-c", "uvicorn backend.app:app --host 0.0.0.0 --port ${PORT:-8000} --proxy-headers"]
