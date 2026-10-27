FROM python:3.11-slim-bookworm
RUN apt-get update && apt-get install -y --no-install-recommends g++ && rm -rf /var/lib/apt/lists/*
COPY worker/sandbox.py /opt/sandbox.py
WORKDIR /work
USER 65534:65534
