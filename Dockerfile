FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY backend ./backend
ENV FRONTEND_ORIGIN=http://localhost:3000 \
    MAX_UPLOAD_MB=20 \
    DATA_DIR=backend/data
EXPOSE 8000
CMD ["uvicorn", "backend.api:app", "--host", "0.0.0.0", "--port", "8000"]
