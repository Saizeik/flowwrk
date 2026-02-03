<#
Loads a `.env` file into the current PowerShell session (process scope).
Place a `.env` file in `backend/` (or in repo root) and run this script before starting the backend:

  cd backend
  .\env-dev.ps1
  mvn -f backend/pom.xml spring-boot:run

This script does NOT persist variables permanently and is safe for local development.
#>

$scriptDir = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Definition }
# Ensure $scriptDir is a single string (not an array)
if ($scriptDir -is [System.Array]) { $scriptDir = $scriptDir[0] }
$envPaths = @()
$envPaths += [System.IO.Path]::Combine($scriptDir, ".env")
$envPaths += [System.IO.Path]::Combine($scriptDir, "..", ".env")

$envFile = $envPaths | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $envFile) {
    Write-Error "No .env file found in 'backend/' or project root. Create one from .env.example and try again."
    exit 1
}

Write-Host "Loading environment variables from: $envFile"

Get-Content $envFile | ForEach-Object {
    $line = $_.Trim()
    if (-not $line) { return }
    if ($line -match '^[#;]') { return }
    $parts = $line -split '=', 2
    if ($parts.Count -lt 2) { return }
    $name = $parts[0].Trim()
    $value = $parts[1].Trim()
    if ($value -match '^"(.*)"$') { $value = $matches[1] }
    elseif ($value -match "^'(.*)'$") { $value = $matches[1] }
    # Set for this process (current shell)
    [System.Environment]::SetEnvironmentVariable($name, $value, 'Process')
    Write-Host "Loaded $name"
}

Write-Host "Done. Environment variables available in this shell only. Run: mvn -f backend/pom.xml spring-boot:run"
