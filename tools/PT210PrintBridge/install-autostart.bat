@echo off
title Install DSAMS PT-210 Print Bridge Auto-Start
echo ===================================================
echo   Installing DSAMS PT-210 Print Bridge Auto-Start
echo ===================================================

set SCRIPT_DIR=%~dp0
set TARGET_VBS=%SCRIPT_DIR%start-bridge-silent.vbs
set STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
set SHORTCUT_PATH=%STARTUP_FOLDER%\DSAMS-PT210-PrintBridge.lnk

echo Creating Windows Startup shortcut...
powershell -NoProfile -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%SHORTCUT_PATH%'); $s.TargetPath = 'wscript.exe'; $s.Arguments = '\"%TARGET_VBS%\"'; $s.WorkingDirectory = '%SCRIPT_DIR%'; $s.Description = 'DSAMS PT-210 Thermal Print Bridge'; $s.Save()"

if exist "%SHORTCUT_PATH%" (
    echo [SUCCESS] Shortcut created in Startup folder:
    echo           %SHORTCUT_PATH%
) else (
    echo [ERROR] Failed to create shortcut.
    pause
    exit /b 1
)

echo.
echo Starting PT-210 Print Bridge silently in the background...
taskkill /F /IM PT210PrintBridge.exe 2>nul
wscript.exe "%TARGET_VBS%"
ping 127.0.0.1 -n 3 >nul

powershell -NoProfile -Command "try { $res = Invoke-RestMethod -Uri 'http://127.0.0.1:9101/health' -TimeoutSec 3; Write-Host '[SUCCESS] Bridge is online on port:' $res.port } catch { Write-Host '[INFO] Bridge started in background.' }"

echo.
echo ===================================================
echo  Auto-Start installed successfully!
echo  The bridge will now start automatically whenever
echo  Windows boots up.
echo ===================================================

