FROM python:3.11-slim
WORKDIR /app

# Tesseract OCR + langues FR/EN pour extraction dates PDF
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        tesseract-ocr \
        tesseract-ocr-fra \
        tesseract-ocr-eng \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./backend/
COPY scripts/ ./scripts/

# Geocache pré-rempli (adresses Nominatim + distances OSRM)
# → distances disponibles immédiatement sans attendre le géocodage
RUN mkdir -p outputs
COPY outputs/geocache.json ./outputs/geocache.json

CMD ["python3", "backend/payroll_api.py"]
