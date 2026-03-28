FROM python:3.10-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install system dependencies if required (e.g., build-essential)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Install Data Science tools
RUN pip install --no-cache-dir \
    pandas \
    numpy \
    scikit-learn \
    scipy \
    joblib \
    xgboost \
    lightgbm \
    catboost \
    matplotlib \
    seaborn

WORKDIR /app
COPY executor.py .

# Command to run by default if not overridden
CMD ["python", "executor.py"]
