# Stage 1 - Build React frontend
FROM node:20-alpine AS frontend-build

WORKDIR /app/frontend

COPY frontend/package*.json ./

RUN npm ci

COPY frontend/ ./

RUN npm run build

# Stage 2 - Build Spring Boot backend
FROM maven:3.9-eclipse-temurin-17 AS backend-build

WORKDIR /app/backend

COPY backend/pom.xml ./

RUN mvn dependency:go-offline

COPY backend/src ./src

COPY --from=frontend-build /app/frontend/dist ./src/main/resources/static

RUN mvn clean package -DskipTests

# Stage 3 - Runtime
FROM eclipse-temurin:17-jre

WORKDIR /app

COPY --from=backend-build /app/backend/target/*.jar app.jar

EXPOSE 10000

CMD ["sh", "-c", "java -Dserver.port=${PORT:-10000} -jar app.jar"]
