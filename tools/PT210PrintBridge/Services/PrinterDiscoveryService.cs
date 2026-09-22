using System.IO.Ports;
using System.Management;
using System.Text.Json;
using System.Text.RegularExpressions;
using PT210PrintBridge.Models;

namespace PT210PrintBridge.Services;

public class PrinterDiscoveryService
{
    private readonly string _configFilePath;
    private PrinterConfig? _currentConfig;
    private readonly ILogger<PrinterDiscoveryService> _logger;

    public PrinterDiscoveryService(ILogger<PrinterDiscoveryService> logger)
    {
        _logger = logger;
        var appData = AppDomain.CurrentDomain.BaseDirectory;
        _configFilePath = Path.Combine(appData, "printersettings.json");
        LoadOrAutoDetect();
    }

    public PrinterConfig GetCurrentConfig()
    {
        if (_currentConfig == null || string.IsNullOrWhiteSpace(_currentConfig.Port))
        {
            LoadOrAutoDetect();
        }
        return _currentConfig ?? new PrinterConfig();
    }

    public List<DetectedPortInfo> EnumeratePorts()
    {
        var result = new List<DetectedPortInfo>();
        var systemPorts = SerialPort.GetPortNames().Distinct().OrderBy(p => p).ToList();
        var wmiInfo = GetWmiSerialPortDetails();

        foreach (var port in systemPorts)
        {
            var match = wmiInfo.FirstOrDefault(w => w.PortName.Equals(port, StringComparison.OrdinalIgnoreCase));
            var desc = match?.Description ?? "Standard Serial Port";
            var devId = match?.DeviceId ?? string.Empty;

            bool isBluetooth = desc.Contains("Bluetooth", StringComparison.OrdinalIgnoreCase) ||
                               devId.Contains("BTHENUM", StringComparison.OrdinalIgnoreCase);

            bool isOutgoingBluetooth = isBluetooth && !devId.Contains("000000000000");

            bool isLikely = isOutgoingBluetooth || (isBluetooth && (
                desc.Contains("PT210", StringComparison.OrdinalIgnoreCase) ||
                desc.Contains("PT-210", StringComparison.OrdinalIgnoreCase) ||
                desc.Contains("GOOJPRT", StringComparison.OrdinalIgnoreCase) ||
                devId.Contains("AE81", StringComparison.OrdinalIgnoreCase)
            ));

            result.Add(new DetectedPortInfo
            {
                PortName = port,
                Description = desc,
                DeviceId = devId,
                IsBluetooth = isBluetooth,
                IsLikelyPT210 = isLikely
            });
        }

        return result;
    }

    public PrinterConfig SaveConfig(SetupPrinterRequest req)
    {
        var config = new PrinterConfig
        {
            Port = req.Port.Trim().ToUpperInvariant(),
            PrinterName = string.IsNullOrWhiteSpace(req.PrinterName) ? "PT210_AE81" : req.PrinterName.Trim(),
            BaudRate = req.BaudRate > 0 ? req.BaudRate : 9600,
            DataBits = 8,
            Parity = "None",
            StopBits = "One",
            Handshake = "None",
            AutoDetected = false,
            LastConfiguredAt = DateTime.UtcNow
        };

        SaveConfigFile(config);
        _currentConfig = config;
        _logger.LogInformation("Saved printer configuration for port: {Port}", config.Port);
        return config;
    }

    public void LoadOrAutoDetect()
    {
        if (File.Exists(_configFilePath))
        {
            try
            {
                var json = File.ReadAllText(_configFilePath);
                var config = JsonSerializer.Deserialize<PrinterConfig>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                if (config != null && !string.IsNullOrWhiteSpace(config.Port))
                {
                    var available = SerialPort.GetPortNames();
                    if (available.Contains(config.Port, StringComparer.OrdinalIgnoreCase))
                    {
                        _currentConfig = config;
                        _logger.LogInformation("Loaded existing config. Active port: {Port}", config.Port);
                        return;
                    }
                    _logger.LogWarning("Configured port {Port} is not currently attached. Attempting auto-detection.", config.Port);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error reading printersettings.json. Proceeding to auto-detect.");
            }
        }

        // Auto-detect Bluetooth PT-210 (prioritize outgoing ports with real device IDs over zero-MAC incoming ports)
        var ports = EnumeratePorts();
        var bestMatch = ports.FirstOrDefault(p => p.IsLikelyPT210 && !p.DeviceId.Contains("000000000000")) ??
                        ports.FirstOrDefault(p => p.IsBluetooth && !p.DeviceId.Contains("000000000000")) ??
                        ports.FirstOrDefault(p => p.IsLikelyPT210) ??
                        ports.FirstOrDefault();

        if (bestMatch != null)
        {
            var detected = new PrinterConfig
            {
                Port = bestMatch.PortName,
                PrinterName = "PT210_AE81",
                BaudRate = 9600,
                DataBits = 8,
                Parity = "None",
                StopBits = "One",
                Handshake = "None",
                AutoDetected = true,
                LastConfiguredAt = DateTime.UtcNow
            };
            SaveConfigFile(detected);
            _currentConfig = detected;
            _logger.LogInformation("Auto-detected PT210 on port: {Port} ({Desc})", detected.Port, bestMatch.Description);
        }
        else
        {
            _currentConfig = new PrinterConfig();
            _logger.LogWarning("No serial ports detected on this PC.");
        }
    }

    private void SaveConfigFile(PrinterConfig config)
    {
        try
        {
            var json = JsonSerializer.Serialize(config, new JsonSerializerOptions { WriteIndented = true });
            File.WriteAllText(_configFilePath, json);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to save {Path}", _configFilePath);
        }
    }

    private List<DetectedPortInfo> GetWmiSerialPortDetails()
    {
        var list = new List<DetectedPortInfo>();
        if (!OperatingSystem.IsWindows()) return list;

        try
        {
            using var searcher = new ManagementObjectSearcher(
                "SELECT Name, DeviceID, Caption, Description FROM Win32_PnPEntity WHERE Caption LIKE '%(COM%' OR Description LIKE '%(COM%'");
            foreach (var item in searcher.Get())
            {
                var caption = item["Caption"]?.ToString() ?? string.Empty;
                var desc = item["Description"]?.ToString() ?? caption;
                var devId = item["DeviceID"]?.ToString() ?? string.Empty;

                var match = Regex.Match(caption, @"\((COM\d+)\)", RegexOptions.IgnoreCase);
                if (match.Success)
                {
                    var portName = match.Groups[1].Value.ToUpperInvariant();
                    list.Add(new DetectedPortInfo
                    {
                        PortName = portName,
                        Description = caption,
                        DeviceId = devId,
                        IsBluetooth = caption.Contains("Bluetooth", StringComparison.OrdinalIgnoreCase) ||
                                      devId.Contains("BTHENUM", StringComparison.OrdinalIgnoreCase),
                        IsLikelyPT210 = false
                    });
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "WMI Serial port query encountered an issue. Falling back to port names.");
        }

        return list;
    }
}
