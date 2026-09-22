# PT-210 Bluetooth Thermal Print Bridge (58mm)

A lightweight .NET 8 background service that allows web applications (like DSAMS) to print directly to a **GOOJPRT PT-210 58mm Bluetooth Thermal Printer** using Windows Bluetooth Serial Port Profile (SPP).

---

## Features
- **Zero COM Port Hard-Coding**: Automatically scans Windows WMI & `System.IO.Ports` to detect the paired Bluetooth COM port (e.g. `COM4`, `COM5`, `COM7`).
- **Multi-PC Portability**: Saves configuration locally on each workstation (`printersettings.json`).
- **Cloud & Local Ready**: Enabled with full CORS so web clients hosted remotely (e.g. `https://dsams.school.edu`) or locally can send print commands directly to `http://127.0.0.1:9101`.
- **Thread-Safe**: Uses `SemaphoreSlim` to prevent concurrent write collisions on the Bluetooth serial port.
- **ESC/POS Formatting**: Cleanly formats 58mm receipts with school headers, double-height bold fonts, dashed lines, and signature lines.

---

## Requirements
- Windows 10 or Windows 11
- .NET 8 Runtime (or SDK)
- GOOJPRT PT-210 Bluetooth Printer

---

## First-Time Setup on a New Computer

### Step 1: Pair the Printer via Bluetooth
1. Turn on the **GOOJPRT PT-210** printer.
2. Open Windows **Settings $\rightarrow$ Bluetooth & Devices $\rightarrow$ Add Device $\rightarrow$ Bluetooth**.
3. Select **PT210_AE81** (or similar).
4. Enter PIN if prompted (usually `0000` or `1234`).
5. Windows will create an outgoing Bluetooth Serial Port (e.g. COM4, COM5, COM7).

### Step 2: Start the Print Bridge
1. Open the folder `c:\laragon\www\DSAMS\tools\PT210PrintBridge`.
2. Double-click **`start-bridge.bat`** (or run `dotnet run -c Release` in terminal).
3. The bridge will start at `http://127.0.0.1:9101` and automatically detect the active Bluetooth port.

### Step 3: Test from DSAMS
1. Open DSAMS in your browser (e.g. Admin or DSA Admission Slip page).
2. Click **"PT-210 Printer"** at the top right of the table.
3. Click **"Print Test Slip"**.
4. The test receipt will print immediately!

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Check if bridge is running and get active port |
| `GET` | `/printers` | List all detected COM ports with Bluetooth identification |
| `POST` | `/setup/printer` | Set active COM port (`{"port": "COM4"}`) |
| `POST` | `/print-test` | Print a test slip |
| `POST` | `/print/admission-slip` | Print an admission slip with student and clearance details |
