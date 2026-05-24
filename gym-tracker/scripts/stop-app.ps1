# Stops Gym Tracker dev servers by port (API 8080, Web 3000, Expo 8082).
param(
    [int]$WebPort = 3000,
    [int]$ExpoPort = 8082,
    [int]$ApiPort = 8080
)

function Stop-Port([int]$Port) {
    $pids = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
        Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($procId in $pids) {
        if ($procId -and $procId -ne 0) {
            Write-Host "Stopping PID $procId (port $Port) ..."
            Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
        }
    }
}

Write-Host "Stopping Gym Tracker services ..."
Stop-Port $ApiPort
Stop-Port $WebPort
Stop-Port $ExpoPort
Write-Host "Done."
