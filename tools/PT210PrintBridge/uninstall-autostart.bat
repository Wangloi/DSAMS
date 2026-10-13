@echo off
title Uninstall DSAMS PT-210 Print Bridge Auto-Start
echo Removing DSAMS PT-210 Print Bridge from Windows Startup...
set SHORTCUT_PATH=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\DSAMS-PT210-PrintBridge.lnk

if exist "%SHORTCUT_PATH%" (
    del "%SHORTCUT_PATH%"
    echo [OK] Startup shortcut removed.
) else (
    echo [INFO] Startup shortcut was not found.
)

taskkill /F /IM PT210PrintBridge.exe 2>nul
echo PT-210 Print Bridge stopped.

