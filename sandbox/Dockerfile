FROM sandbox-env

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install system dependencies if required (e.g., build-essential)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Install Data Science tools
RUN pip install --no-cache-dir --default-timeout=1000 \
    pandas \
    numpy \
    pyarrow \
    scikit-learn \
    scipy \
    joblib \
    lazypredict \
    sentence-transformers \
    xgboost \
    lightgbm \
    catboost \
    matplotlib \
    seaborn

WORKDIR /app
COPY executor.py .

# Command to run by default if not overridden
CMD ["python", "executor.py"]
