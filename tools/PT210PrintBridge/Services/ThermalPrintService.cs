using System.IO.Ports;
using System.Text;
using PT210PrintBridge.Models;

namespace PT210PrintBridge.Services;

public class ThermalPrintService
{
    private static readonly SemaphoreSlim PrintLock = new(1, 1);
    private readonly PrinterDiscoveryService _discoveryService;
    private readonly ILogger<ThermalPrintService> _logger;

    public ThermalPrintService(PrinterDiscoveryService discoveryService, ILogger<ThermalPrintService> logger)
    {
        _discoveryService = discoveryService;
        _logger = logger;
    }

    public async Task<(bool Success, string Message)> PrintTestAsync()
    {
        var config = _discoveryService.GetCurrentConfig();
        if (string.IsNullOrWhiteSpace(config.Port))
        {
            return (false, "PT-210 Bluetooth printer was not detected. Please make sure the printer is powered on and paired with Windows.");
        }

        var bytes = BuildTestReceiptBytes(config.Port);
        return await SendRawBytesAsync(config, bytes, "Test receipt");
    }

    public async Task<(bool Success, string Message)> PrintAdmissionSlipAsync(AdmissionSlipRequest req)
    {
        var config = _discoveryService.GetCurrentConfig();
        if (string.IsNullOrWhiteSpace(config.Port))
        {
            return (false, "PT-210 Bluetooth printer was not detected. Please make sure the printer is powered on and paired with Windows.");
        }

        var bytes = BuildAdmissionSlipBytes(req);
        return await SendRawBytesAsync(config, bytes, $"Admission Slip #{req.SlipId ?? "N/A"}");
    }

    private async Task<(bool Success, string Message)> SendRawBytesAsync(PrinterConfig config, byte[] data, string jobName)
    {
        bool lockAcquired = false;
        try
        {
            // Acquire lock with 6 second timeout to prevent concurrent port collisions
            lockAcquired = await PrintLock.WaitAsync(TimeSpan.FromSeconds(6));
            if (!lockAcquired)
            {
                return (false, $"PT-210 detected on {config.Port}, but the port is currently busy processing another print job.");
            }

            // Verify port exists in system
            var availablePorts = SerialPort.GetPortNames();
            if (!availablePorts.Contains(config.Port, StringComparer.OrdinalIgnoreCase))
            {
                return (false, $"PT-210 Bluetooth printer was not detected on {config.Port}. Please make sure the printer is powered on and paired with Windows.");
            }

            return await Task.Run(() =>
            {
                using var port = new SerialPort(config.Port)
                {
                    BaudRate = config.BaudRate > 0 ? config.BaudRate : 9600,
                    DataBits = config.DataBits > 0 ? config.DataBits : 8,
                    Parity = Parity.None,
                    StopBits = StopBits.One,
                    Handshake = Handshake.None,
                    DtrEnable = true,
                    RtsEnable = true,
                    WriteTimeout = 5000,
                    ReadTimeout = 3000
                };

                try
                {
                    port.Open();
                }
                catch (UnauthorizedAccessException)
                {
                    return (false, $"PT-210 detected on {config.Port}, but the port is currently in use by another process.");
                }
                catch (Exception ex)
                {
                    return (false, $"Could not open {config.Port}: {ex.Message}. Make sure the PT-210 Bluetooth printer is connected and powered on.");
                }

                try
                {
                    _logger.LogInformation("Sending {Count} bytes to {Port} for job: {Job}", data.Length, config.Port, jobName);
                    
                    // Synchronous write on dedicated thread to prevent Windows Bluetooth SPP async hang
                    port.Write(data, 0, data.Length);
                    
                    // Small delay for printer buffer to receive all bytes before closing
                    Thread.Sleep(300);

                    return (true, $"Printed successfully on {config.Port}");
                }
                catch (TimeoutException)
                {
                    return (false, $"Write timed out on {config.Port}. Please check that the PT-210 printer is turned on and paired.");
                }
                catch (Exception ex)
                {
                    return (false, $"Error transmitting data to {config.Port}: {ex.Message}");
                }
                finally
                {
                    try { if (port.IsOpen) port.Close(); } catch { }
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error printing on {Port}", config.Port);
            return (false, $"Print error on {config.Port}: {ex.Message}");
        }
        finally
        {
            if (lockAcquired)
            {
                PrintLock.Release();
            }
        }
    }

    private byte[] BuildTestReceiptBytes(string portName)
    {
        var ms = new MemoryStream();
        using var writer = new BinaryWriter(ms, Encoding.GetEncoding("ASCII"));

        // Initialize printer
        writer.Write(new byte[] { 0x1B, 0x40 });

        // Center align
        writer.Write(new byte[] { 0x1B, 0x61, 0x01 });

        // Bold + Double height
        writer.Write(new byte[] { 0x1B, 0x45, 0x01 });
        writer.Write(new byte[] { 0x1D, 0x21, 0x11 });
        writer.Write(Encoding.ASCII.GetBytes("ST. RITA'S COLLEGE\nOF BALINGASAG\n"));

        // Reset text size
        writer.Write(new byte[] { 0x1D, 0x21, 0x00 });
        writer.Write(new byte[] { 0x1B, 0x45, 0x00 });
        writer.Write(Encoding.ASCII.GetBytes("Higher Education Department\n\n"));

        // Line
        writer.Write(Encoding.ASCII.GetBytes("--------------------------------\n"));
        
        // Bold Title
        writer.Write(new byte[] { 0x1B, 0x45, 0x01 });
        writer.Write(Encoding.ASCII.GetBytes("PT-210 BLUETOOTH TEST\n"));
        writer.Write(new byte[] { 0x1B, 0x45, 0x00 });
        writer.Write(Encoding.ASCII.GetBytes("--------------------------------\n"));

        // Left align
        writer.Write(new byte[] { 0x1B, 0x61, 0x00 });
        writer.Write(Encoding.ASCII.GetBytes("Bluetooth : OK\n"));
        writer.Write(Encoding.ASCII.GetBytes($"Port      : {portName}\n"));
        writer.Write(Encoding.ASCII.GetBytes("Status    : Printing\n"));
        writer.Write(Encoding.ASCII.GetBytes($"Date/Time : {DateTime.Now:yyyy-MM-dd HH:mm:ss}\n"));
        writer.Write(Encoding.ASCII.GetBytes("--------------------------------\n"));

        // Center
        writer.Write(new byte[] { 0x1B, 0x61, 0x01 });
        writer.Write(Encoding.ASCII.GetBytes("GOOJPRT PT-210 Ready\n\n\n\n"));

        return ms.ToArray();
    }

    private byte[] BuildAdmissionSlipBytes(AdmissionSlipRequest req)
    {
        var ms = new MemoryStream();
        using var writer = new BinaryWriter(ms, Encoding.GetEncoding("ASCII"));

        // ESC @ - Initialize
        writer.Write(new byte[] { 0x1B, 0x40 });

        // Center Align
        writer.Write(new byte[] { 0x1B, 0x61, 0x01 });

        // Bold
        writer.Write(new byte[] { 0x1B, 0x45, 0x01 });
        writer.Write(Encoding.ASCII.GetBytes("ST. RITA'S COLLEGE\nOF BALINGASAG, INC.\n"));
        writer.Write(new byte[] { 0x1B, 0x45, 0x00 });
        writer.Write(Encoding.ASCII.GetBytes("Balingasag, Misamis Oriental\n"));
        writer.Write(Encoding.ASCII.GetBytes("HIGHER EDUCATION DEPARTMENT\n"));

        // Dashed Divider
        writer.Write(Encoding.ASCII.GetBytes("--------------------------------\n"));

        // Title (Bold, Center)
        writer.Write(new byte[] { 0x1B, 0x45, 0x01 });
        writer.Write(new byte[] { 0x1D, 0x21, 0x01 }); // Double height
        writer.Write(Encoding.ASCII.GetBytes("ADMISSION SLIP\n"));
        writer.Write(new byte[] { 0x1D, 0x21, 0x00 }); // Normal size
        writer.Write(new byte[] { 0x1B, 0x45, 0x00 });
        writer.Write(Encoding.ASCII.GetBytes("--------------------------------\n"));

        // Left Align details
        writer.Write(new byte[] { 0x1B, 0x61, 0x00 });

        void WriteField(string label, string? value)
        {
            var val = string.IsNullOrWhiteSpace(value) ? "—" : value.Trim();
            writer.Write(new byte[] { 0x1B, 0x45, 0x01 }); // Bold
            writer.Write(Encoding.ASCII.GetBytes($"{label}: \n"));
            writer.Write(new byte[] { 0x1B, 0x45, 0x00 }); // Unbold
            writer.Write(Encoding.ASCII.GetBytes($"  {val}\n"));
        }

        WriteField("NAME", req.StudentName);
        if (!string.IsNullOrWhiteSpace(req.StudentId))
        {
            WriteField("STUDENT ID", req.StudentId);
        }
        WriteField("PROGRAM/YR", req.Program);
        WriteField("CASE", req.CaseText);
        WriteField("REASON", req.ReasonText);
        WriteField("DATE ISSUED", req.Date ?? DateTime.Now.ToString("yyyy-MM-dd"));
        WriteField("VALID UNTIL", req.ValidUntil);
        WriteField("STATUS", req.Status ?? "APPROVED");

        writer.Write(Encoding.ASCII.GetBytes("--------------------------------\n"));

        // Center Signature section
        writer.Write(new byte[] { 0x1B, 0x61, 0x01 });
        writer.Write(Encoding.ASCII.GetBytes("\n\n_______________________________\n"));
        writer.Write(Encoding.ASCII.GetBytes("Signature over Printed Name\n\n"));

        var dean = (req.DeanName ?? "Rey John N. Bongcas").Trim().ToUpperInvariant();
        writer.Write(new byte[] { 0x1B, 0x45, 0x01 });
        writer.Write(Encoding.ASCII.GetBytes($"{dean}\n"));
        writer.Write(new byte[] { 0x1B, 0x45, 0x00 });
        writer.Write(Encoding.ASCII.GetBytes("Dean of Student Affairs\n"));

        if (!string.IsNullOrWhiteSpace(req.SlipId))
        {
            writer.Write(Encoding.ASCII.GetBytes($"\n[SLIP REF: #{req.SlipId}]\n"));
        }

        writer.Write(Encoding.ASCII.GetBytes($"Printed: {DateTime.Now:yyyy-MM-dd HH:mm}\n"));

        // Feed paper
        writer.Write(Encoding.ASCII.GetBytes("\n\n\n\n"));

        return ms.ToArray();
    }
}
