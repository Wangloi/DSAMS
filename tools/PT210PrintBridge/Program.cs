using PT210PrintBridge.Models;
using PT210PrintBridge.Services;

var builder = WebApplication.CreateBuilder(args);

// Configure port 9101 on localhost
builder.WebHost.ConfigureKestrel(options =>
{
    options.ListenLocalhost(9101);
});

// Configure open CORS for local web applications (DSAMS web client / hosted site)
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Register bridge services
builder.Services.AddSingleton<PrinterDiscoveryService>();
builder.Services.AddSingleton<ThermalPrintService>();

var app = builder.Build();

app.UseCors();

// 1. GET /health
app.MapGet("/health", (PrinterDiscoveryService discovery) =>
{
    var config = discovery.GetCurrentConfig();
    var hasPort = !string.IsNullOrWhiteSpace(config.Port);

    return Results.Ok(new
    {
        status = "online",
        printer = "GOOJPRT PT-210",
        configured = hasPort,
        port = hasPort ? config.Port : "NONE",
        baudRate = config.BaudRate,
        autoDetected = config.AutoDetected,
        message = hasPort 
            ? $"Connected to {config.Port}" 
            : "No printer port configured or detected. Please pair PT-210 via Bluetooth."
    });
});

// 2. GET /printers
app.MapGet("/printers", (PrinterDiscoveryService discovery) =>
{
    var ports = discovery.EnumeratePorts();
    var activeConfig = discovery.GetCurrentConfig();

    return Results.Ok(new
    {
        currentPort = activeConfig.Port,
        printerName = activeConfig.PrinterName,
        availablePorts = ports
    });
});

// 3. POST /setup/printer
app.MapPost("/setup/printer", (SetupPrinterRequest request, PrinterDiscoveryService discovery) =>
{
    if (string.IsNullOrWhiteSpace(request.Port))
    {
        return Results.BadRequest(new { error = "Port is required (e.g. COM4, COM5, COM7)." });
    }

    var config = discovery.SaveConfig(request);
    return Results.Ok(new
    {
        message = $"Printer successfully configured on {config.Port}.",
        config
    });
});

// 4. POST /print-test
app.MapPost("/print-test", async (ThermalPrintService printService) =>
{
    Console.WriteLine($"[{DateTime.Now:HH:mm:ss}] Received Test Print request.");
    var (success, message) = await printService.PrintTestAsync();
    Console.WriteLine($"[{DateTime.Now:HH:mm:ss}] Test Print result: Success={success}, Message={message}");

    if (!success)
    {
        return Results.Json(new { success = false, message }, statusCode: 400);
    }

    return Results.Ok(new { success = true, message });
});

// 5. POST /print/admission-slip
app.MapPost("/print/admission-slip", async (AdmissionSlipRequest request, ThermalPrintService printService) =>
{
    Console.WriteLine($"[{DateTime.Now:HH:mm:ss}] Received Admission Slip print request for Student: '{request.StudentName}' (ID: {request.StudentId ?? "N/A"})");

    if (string.IsNullOrWhiteSpace(request.StudentName))
    {
        Console.WriteLine($"[{DateTime.Now:HH:mm:ss}] Rejected: StudentName was empty.");
        return Results.BadRequest(new { success = false, message = "Student name is required." });
    }

    var (success, message) = await printService.PrintAdmissionSlipAsync(request);
    Console.WriteLine($"[{DateTime.Now:HH:mm:ss}] Print result: Success={success}, Message={message}");

    if (!success)
    {
        return Results.Json(new { success = false, message }, statusCode: 400);
    }

    return Results.Ok(new { success = true, message });
});

Console.WriteLine("=================================================");
Console.WriteLine("  DSAMS PT-210 Bluetooth Thermal Print Bridge    ");
Console.WriteLine("  Listening at: http://127.0.0.1:9101            ");
Console.WriteLine("=================================================");

app.Run();
