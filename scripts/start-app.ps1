# Starts Gym Tracker: Quarkus API + web UI (+ optional Expo).
# Usage:
#   .\scripts\start-app.ps1
#   .\scripts\start-app.ps1 -NoExpo
#   .\scripts\start-app.ps1 -SkipBrowser

param(
    [switch]$NoExpo,
    [switch]$SkipBrowser,
    [int]$WebPort = 3000,
    [int]$ExpoPort = 8082,
    [int]$ApiPort = 8080
)

$ErrorActionPreference = "Stop"
$GymRoot = Split-Path -Parent $PSScriptRoot
$BackendDir = Join-Path $GymRoot "backend"
$WebDir = Join-Path $GymRoot "web"
$FrontendDir = Join-Path $GymRoot "frontend"

function Test-PortListening([int]$Port) {
    $conn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    return $null -ne $conn
}

function Wait-ForApi([string]$Url, [int]$TimeoutSec = 120) {
    $deadline = (Get-Date).AddSeconds($TimeoutSec)
    Write-Host "Waiting for API at $Url ..."
    while ((Get-Date) -lt $deadline) {
        try {
            $r = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 3
            if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 500) {
                return $true
            }
        } catch {
            Start-Sleep -Seconds 2
        }
    }
    return $false
}

function Start-ServiceWindow([string]$Title, [string]$WorkingDir, [string]$Command) {
  Start-Process powershell -WorkingDirectory $WorkingDir -ArgumentList @(
    "-NoExit",
    "-Command",
    "`$host.UI.RawUI.WindowTitle = '$Title'; $Command"
  ) | Out-Null
}

Write-Host ""
Write-Host "Gym Tracker - starting services" -ForegroundColor Cyan
Write-Host "  Root: $GymRoot"
Write-Host ""

if (-not (Test-Path $BackendDir)) {
    throw "Backend folder not found: $BackendDir"
}
if (-not (Test-Path $WebDir)) {
    throw "Web folder not found: $WebDir"
}

# --- Backend (Quarkus) ---
if (Test-PortListening $ApiPort) {
    Write-Host "[API] Port $ApiPort already in use - assuming backend is running." -ForegroundColor Yellow
} else {
    Write-Host "[API] Starting Quarkus on http://localhost:$ApiPort ..."
    Start-ServiceWindow "Gym Tracker API" $BackendDir "mvn -B quarkus:dev"
}

# --- Web UI ---
if (Test-PortListening $WebPort) {
    Write-Host "[Web] Port $WebPort already in use - assuming web UI is running." -ForegroundColor Yellow
} else {
    Write-Host "[Web] Starting static UI on http://localhost:$WebPort ..."
    Start-ServiceWindow "Gym Tracker Web" $WebDir "npx --yes serve . -l $WebPort"
}

# --- Expo (optional) ---
if (-not $NoExpo) {
    if (-not (Test-Path $FrontendDir)) {
        Write-Host "[Expo] frontend/ not found - skipping." -ForegroundColor Yellow
    } elseif (Test-PortListening $ExpoPort) {
        Write-Host "[Expo] Port $ExpoPort already in use - assuming Expo is running." -ForegroundColor Yellow
    } else {
        Write-Host "[Expo] Starting Expo web UI on http://localhost:$ExpoPort ..."
        $expoCmd = "`$env:EXPO_ROUTER_DISABLE_RN_NAVIGATION_CHECK='1'; npx expo start --web --port $ExpoPort"
        Start-ServiceWindow "Gym Tracker Expo" $FrontendDir $expoCmd
    }
}

# --- Wait for API then open browser ---
$apiOk = Wait-ForApi "http://localhost:$ApiPort/api/workouts"
if ($apiOk) {
    Write-Host "[API] Ready." -ForegroundColor Green
} else {
    Write-Host "[API] Timed out - check the 'Gym Tracker API' window for Maven/Java errors." -ForegroundColor Red
}

if (-not $SkipBrowser) {
    Start-Sleep -Seconds 2
    Write-Host "[Web] Opening browser ..."
    Start-Process "http://localhost:$WebPort"
}

Write-Host ""
Write-Host "Running:" -ForegroundColor Green
Write-Host "  API (Swagger)  http://localhost:$ApiPort/q/swagger-ui"
Write-Host "  Web app        http://localhost:$WebPort"
if (-not $NoExpo) {
    Write-Host "  Expo           http://localhost:$ExpoPort"
}
Write-Host ""
Write-Host "Close the PowerShell windows titled 'Gym Tracker *' to stop each service."
Write-Host ""
