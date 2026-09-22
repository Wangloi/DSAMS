using System.Text.Json.Serialization;

namespace PT210PrintBridge.Models;

public class PrinterConfig
{
    [JsonPropertyName("printerName")]
    public string PrinterName { get; set; } = "PT210_AE81";

    [JsonPropertyName("port")]
    public string Port { get; set; } = "";

    [JsonPropertyName("baudRate")]
    public int BaudRate { get; set; } = 9600;

    [JsonPropertyName("dataBits")]
    public int DataBits { get; set; } = 8;

    [JsonPropertyName("parity")]
    public string Parity { get; set; } = "None";

    [JsonPropertyName("stopBits")]
    public string StopBits { get; set; } = "One";

    [JsonPropertyName("handshake")]
    public string Handshake { get; set; } = "None";

    [JsonPropertyName("autoDetected")]
    public bool AutoDetected { get; set; } = false;

    [JsonPropertyName("lastConfiguredAt")]
    public DateTime LastConfiguredAt { get; set; } = DateTime.UtcNow;
}

public class DetectedPortInfo
{
    [JsonPropertyName("portName")]
    public string PortName { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;

    [JsonPropertyName("deviceId")]
    public string DeviceId { get; set; } = string.Empty;

    [JsonPropertyName("isBluetooth")]
    public bool IsBluetooth { get; set; }

    [JsonPropertyName("isLikelyPT210")]
    public bool IsLikelyPT210 { get; set; }
}

public class SetupPrinterRequest
{
    [JsonPropertyName("port")]
    public string Port { get; set; } = string.Empty;

    [JsonPropertyName("printerName")]
    public string? PrinterName { get; set; }

    [JsonPropertyName("baudRate")]
    public int BaudRate { get; set; } = 9600;
}

public class AdmissionSlipRequest
{
    private string? _studentName;
    private string? _studentId;
    private string? _program;
    private string? _caseText;
    private string? _reasonText;
    private string? _date;
    private string? _validUntil;
    private string? _status;
    private string? _deanName;
    private string? _slipId;

    [JsonPropertyName("student_name")]
    public string? StudentNameSnake { get => _studentName; set => _studentName = value; }

    [JsonPropertyName("studentName")]
    public string? StudentName { get => _studentName; set => _studentName = value; }

    [JsonPropertyName("student_id")]
    public string? StudentIdSnake { get => _studentId; set => _studentId = value; }

    [JsonPropertyName("studentId")]
    public string? StudentId { get => _studentId; set => _studentId = value; }

    [JsonPropertyName("program")]
    public string? Program { get => _program; set => _program = value; }

    [JsonPropertyName("program_year_level")]
    public string? ProgramYearLevel { get => _program; set => _program = value; }

    [JsonPropertyName("programYear")]
    public string? ProgramYear { get => _program; set => _program = value; }

    [JsonPropertyName("case_text")]
    public string? CaseTextSnake { get => _caseText; set => _caseText = value; }

    [JsonPropertyName("caseText")]
    public string? CaseText { get => _caseText; set => _caseText = value; }

    [JsonPropertyName("reason_text")]
    public string? ReasonTextSnake { get => _reasonText; set => _reasonText = value; }

    [JsonPropertyName("reasonText")]
    public string? ReasonText { get => _reasonText; set => _reasonText = value; }

    [JsonPropertyName("date")]
    public string? Date { get => _date; set => _date = value; }

    [JsonPropertyName("date_issued")]
    public string? DateIssued { get => _date; set => _date = value; }

    [JsonPropertyName("valid_until")]
    public string? ValidUntilSnake { get => _validUntil; set => _validUntil = value; }

    [JsonPropertyName("validUntil")]
    public string? ValidUntil { get => _validUntil; set => _validUntil = value; }

    [JsonPropertyName("status")]
    public string? Status { get => _status; set => _status = value; }

    [JsonPropertyName("dean_name")]
    public string? DeanNameSnake { get => _deanName; set => _deanName = value; }

    [JsonPropertyName("deanName")]
    public string? DeanName { get => _deanName; set => _deanName = value; }

    [JsonPropertyName("slip_id")]
    public string? SlipIdSnake { get => _slipId; set => _slipId = value; }

    [JsonPropertyName("slipId")]
    public string? SlipId { get => _slipId; set => _slipId = value; }

    [JsonPropertyName("id")]
    public object? Id { get => _slipId; set => _slipId = value?.ToString(); }
}
