# Kairo: imagem única com API + front-end embutido.
# docker build -t kairo . && docker run -p 8080:8080 kairo

# 1) Front-end (Angular)
FROM node:22-alpine AS front
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
RUN npm run build

# 2) API (Spring Boot) com o build do front em /static
FROM eclipse-temurin:21-jdk AS back
WORKDIR /app/backend
COPY backend/.mvn .mvn
COPY backend/mvnw backend/pom.xml ./
# mvnw pode vir com CRLF de um checkout no Windows
RUN sed -i 's/\r$//' mvnw && chmod +x mvnw && ./mvnw -q -B dependency:go-offline
COPY backend/src src
COPY --from=front /app/frontend/dist/frontend/browser src/main/resources/static
RUN ./mvnw -q -B -DskipTests package

# 3) Imagem final, só com o JRE
FROM eclipse-temurin:21-jre
WORKDIR /app
RUN useradd --system --uid 1001 kairo
COPY --from=back /app/backend/target/order-management-api-*.jar app.jar
USER kairo
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
