FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PULSE_DB_PATH=/data/pulse-edge.db \
    PULSE_MODE=offline

WORKDIR /app
COPY pulse_edge.py /app/pulse_edge.py
COPY edge_server.py /app/edge_server.py
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt
RUN mkdir -p /data
EXPOSE 5000
CMD ["python", "edge_server.py"]
