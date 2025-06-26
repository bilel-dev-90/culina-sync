# /culina-sync/backend-sql/Dockerfile

# Nutze ein offizielles Java 17 Runtime als Basis-Image
FROM openjdk:17-slim

# Setze das Arbeitsverzeichnis im Container auf /app
WORKDIR /app

# Kopiere die gebaute .jar Datei aus dem Gradle Build-Verzeichnis in den Container
# Gradle baut die JAR-Datei normalerweise in build/libs/
COPY build/libs/*.jar app.jar

# Dieser Befehl wird ausgeführt, wenn der Container startet
ENTRYPOINT ["java", "-jar", "app.jar"]