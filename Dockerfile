FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ ./backend/
COPY scripts/ ./scripts/
# Geocache pré-rempli (1500+ adresses Nominatim + distances OSRM)
# → distances disponibles immédiatement sans attendre le géocodage
RUN mkdir -p outputs
COPY outputs/geocache.json ./outputs/geocache.json
CMD ["python3", "backend/payroll_api.py"]
