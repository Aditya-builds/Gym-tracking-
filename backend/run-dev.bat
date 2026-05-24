@echo off
cd /d "%~dp0"
echo Starting Gym Tracker API on http://localhost:8080 ...
mvn quarkus:dev
if errorlevel 1 pause
