@echo off
title Stop DSAMS PT-210 Print Bridge
echo Stopping DSAMS PT-210 Print Bridge...
taskkill /F /IM PT210PrintBridge.exe 2>nul
echo Done.

