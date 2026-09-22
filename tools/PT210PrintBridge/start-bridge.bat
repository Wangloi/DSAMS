@echo off
title DSAMS PT-210 Print Bridge
echo Starting DSAMS PT-210 Bluetooth Print Bridge on http://127.0.0.1:9101...
cd /d "%~dp0"
dotnet run -c Release
pause
