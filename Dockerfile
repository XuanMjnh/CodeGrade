FROM node:22-bookworm-slim AS client
WORKDIR /client
COPY frontend/package*.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
RUN npm run build

FROM maven:3.9.11-eclipse-temurin-21 AS build
WORKDIR /build
COPY backend/pom.xml ./
COPY backend/src ./src
COPY --from=client /client/dist ./src/main/resources/static
RUN --mount=type=cache,target=/root/.m2 mvn -B -DskipTests package

FROM client AS frontend-test
COPY scripts/verify_certificate.cjs scripts/receipt-verification.test.cjs /checks/
CMD ["npm","test"]

FROM maven:3.9.11-eclipse-temurin-21 AS backend-test
WORKDIR /workspace/backend
COPY backend/pom.xml ./
COPY backend/src ./src
CMD ["mvn","-B","-Dexperiment.output=/results/fairness-rerun.json","test"]

FROM python:3.11-slim-bookworm AS tools-test
WORKDIR /workspace
COPY scripts/requirements.txt /tmp/requirements.txt
RUN apt-get update && apt-get install -y --no-install-recommends g++ && rm -rf /var/lib/apt/lists/* \
    && pip install --no-cache-dir -r /tmp/requirements.txt
COPY scripts ./scripts
COPY backend/src/main/resources ./backend/src/main/resources
ENV PYTHONDONTWRITEBYTECODE=1
CMD ["python","scripts/benchmark_ws.py","--url","ws://server:8080/ws","--output","/results/network-rerun.json"]

FROM eclipse-temurin:21-jre-jammy AS server
WORKDIR /app
COPY --from=build /build/target/codegrade-network-5.5.2.jar /app/app.jar
USER 10001:10001
EXPOSE 8080
ENTRYPOINT ["java","-XX:MaxRAMPercentage=70","-jar","/app/app.jar"]

FROM docker:27-cli AS dockercli
FROM eclipse-temurin:21-jre-jammy AS worker
WORKDIR /app
COPY --from=dockercli /usr/local/bin/docker /usr/local/bin/docker
COPY --from=build /build/target/codegrade-network-5.5.2.jar /app/app.jar
ENTRYPOINT ["java","-XX:MaxRAMPercentage=70","-jar","/app/app.jar","--worker"]
