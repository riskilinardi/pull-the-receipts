FROM python:3.12-slim
RUN useradd -m -u 1000 user
USER user
ENV PATH="/home/user/.local/bin:$PATH"
WORKDIR /app

# Install dependencies. On HF Spaces, only /tmp is writable. Model caches and Chroma will be stored there.
ENV HF_HOME=/tmp/hf_cache \
    CHROMA_PATH=/tmp/chroma

COPY --chown=user pyproject.toml .
RUN pip install --no-cache-dir .

COPY --chown=user rag/ ./rag/
COPY --chown=user api/ ./api/
COPY --chown=user seed/ ./seed/

RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('BAAI/bge-small-en-v1.5')"

EXPOSE 7860

CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "7860"]