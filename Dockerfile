FROM python:3.12-slim

WORKDIR /app

COPY src /app/src

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

ENTRYPOINT ["python", "-m", "src.github_action"]
