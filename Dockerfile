FROM python:3.11-slim
WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./backend/
COPY scripts/ ./scripts/

# Dossier outputs (geocache vide au démarrage — se remplit à l'usage)
RUN mkdir -p outputs && echo '{}' > outputs/geocache.json

CMD ["python3", "backend/payroll_api.py"]
