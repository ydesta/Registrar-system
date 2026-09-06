param(
  [Parameter(Mandatory = $false)]
  [string]$To = "nijew50606@robustq.com",

  [Parameter(Mandatory = $false)]
  [string]$SettingsPath = ""
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($SettingsPath)) {
  $scriptDir = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Path }
  if (-not $scriptDir) { $scriptDir = "d:\Personal\Registrar-system\SecureAuth.API\scripts" }
  $SettingsPath = Join-Path $scriptDir "..\appsettings.Development.json"
}

if (-not (Test-Path $SettingsPath)) {
  throw "Settings file not found: $SettingsPath"
}

$settings = Get-Content $SettingsPath -Raw | ConvertFrom-Json
$email = $settings.EmailConfiguration

if (-not $email -or -not $email.SmtpServer -or -not $email.Username -or -not $email.Password) {
  throw "EmailConfiguration is incomplete in $SettingsPath"
}

Write-Host "SMTP Server : $($email.SmtpServer)"
Write-Host "Port        : $($email.Port)"
Write-Host "From        : $($email.From)"
Write-Host "Username    : $($email.Username)"
Write-Host "To          : $To"
Write-Host ""

$csCode = @"
using System;
using System.Threading.Tasks;
using MailKit.Net.Smtp;
using MimeKit;

public class Program
{
    public static async Task<int> Main()
    {
        var smtpServer = Environment.GetEnvironmentVariable("SMTP_SERVER");
        var port = int.Parse(Environment.GetEnvironmentVariable("SMTP_PORT") ?? "465");
        var from = Environment.GetEnvironmentVariable("SMTP_FROM");
        var username = Environment.GetEnvironmentVariable("SMTP_USERNAME");
        var password = Environment.GetEnvironmentVariable("SMTP_PASSWORD");
        var to = Environment.GetEnvironmentVariable("SMTP_TO");

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress("HiLCoE Registrar", from));
        message.To.Add(MailboxAddress.Parse(to));
        message.Subject = "HiLCoE Registrar - SMTP Test";
        message.Body = new TextPart("plain")
        {
            Text = $"SMTP test from HiLCoE Registrar at {DateTime.UtcNow:u} UTC"
        };

        using var client = new SmtpClient();
        client.Timeout = 30000;
        client.ServerCertificateValidationCallback = (s, c, h, e) => true;

        var socketOptions = port == 465
            ? MailKit.Security.SecureSocketOptions.SslOnConnect
            : MailKit.Security.SecureSocketOptions.StartTls;

        Console.WriteLine($"Connecting to {smtpServer}:{port}...");
        await client.ConnectAsync(smtpServer, port, socketOptions);
        client.AuthenticationMechanisms.Remove("XOAUTH2");
        Console.WriteLine("Authenticating...");
        await client.AuthenticateAsync(username, password);
        Console.WriteLine($"Sending to {to}...");
        await client.SendAsync(message);
        await client.DisconnectAsync(true);
        Console.WriteLine("SEND_OK");
        return 0;
    }
}
"@

$tempDir = Join-Path $env:TEMP ("hilcoe-smtp-test-" + [guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Path $tempDir | Out-Null

try {
  Set-Location $tempDir
  dotnet new console -n SmtpTest -f net9.0 --force | Out-Null
  Set-Location (Join-Path $tempDir "SmtpTest")
  dotnet add package MailKit --version 4.8.0 | Out-Null
  Set-Content -Path "Program.cs" -Value $csCode -Encoding UTF8

  $env:SMTP_SERVER = [string]$email.SmtpServer
  $env:SMTP_PORT = [string]$email.Port
  $env:SMTP_FROM = [string]$email.From
  $env:SMTP_USERNAME = [string]$email.Username
  $env:SMTP_PASSWORD = [string]$email.Password
  $env:SMTP_TO = $To

  dotnet run
}
catch {
  Write-Host "SEND_FAIL"
  Write-Host $_.Exception.Message
  if ($_.Exception.InnerException) {
    Write-Host ("INNER: " + $_.Exception.InnerException.Message)
  }
  exit 1
}
finally {
  Remove-Item Env:SMTP_PASSWORD -ErrorAction SilentlyContinue
  Set-Location $PSScriptRoot
  Remove-Item -Recurse -Force $tempDir -ErrorAction SilentlyContinue
}
