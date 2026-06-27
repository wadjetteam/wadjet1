param(
  [string]$ApiPort = "5000",
  [string]$FrontendPort = "5173"
)

Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  WADJET GRC - Starting All Services" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Kill any existing node processes on our ports
Get-Process -Name "node" -ErrorAction SilentlyContinue | ForEach-Object {
  try {
    $_.Kill()
    Write-Host "  ✓ Killed stale process (PID $($_.Id))" -ForegroundColor DarkGray
  } catch {}
}
Start-Sleep -Seconds 2

# Start API Server
Write-Host "  Starting API Server on port $ApiPort ..." -NoNewline
$apiJob = Start-Job -ScriptBlock {
  param($dir, $port)
  Set-Location $dir
  $env:PORT = $port
  pnpm --filter @workspace/api-server run dev
} -ArgumentList $rootDir, $ApiPort

Start-Sleep -Seconds 8

# Check if API started
$apiTest = $null
try {
  $apiTest = Invoke-WebRequest -Uri "http://localhost:$ApiPort/api/risks" -TimeoutSec 3 -ErrorAction Stop
} catch {}
if ($apiTest -and $apiTest.StatusCode -eq 200) {
  $count = ($apiTest.Content | ConvertFrom-Json).risks.Count
  Write-Host "  ✓ API running on port $ApiPort ($count risks seeded)" -ForegroundColor Green
} else {
  Write-Host "  ✗ API failed to start. Check port $ApiPort" -ForegroundColor Red
}

# Start Frontend (Vite)
Write-Host "  Starting Frontend on port $FrontendPort ..." -NoNewline
$env:PORT = $FrontendPort
$env:BASE_PATH = "/"
$viteProcess = Start-Process -NoNewWindow -FilePath "pnpm" -ArgumentList "--filter @workspace/wadjet-grc run dev" -WorkingDirectory $rootDir -PassThru -RedirectStandardOutput "$rootDir\vite.log" -RedirectStandardError "$rootDir\vite.err.log"

Start-Sleep -Seconds 5

$feTest = $null
try {
  $feTest = Invoke-WebRequest -Uri "http://localhost:$FrontendPort/" -TimeoutSec 3 -ErrorAction Stop
} catch {}
if ($feTest -and $feTest.StatusCode -eq 200) {
  Write-Host "  ✓ Frontend running on http://localhost:$FrontendPort" -ForegroundColor Green
} else {
  Write-Host "  ? Frontend may still be starting..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "───────────────────────────────────────────" -ForegroundColor Cyan
Write-Host "  Frontend: http://localhost:$FrontendPort" -ForegroundColor White
Write-Host "  API:      http://localhost:$ApiPort/api" -ForegroundColor White
Write-Host "───────────────────────────────────────────" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Press Ctrl+C to stop all services" -ForegroundColor DarkGray

# Keep script running until user presses Ctrl+C
try {
  while ($true) {
    Start-Sleep -Seconds 5
    # Check if processes are still running
    if ($apiJob.State -eq "Failed" -or $apiJob.State -eq "Completed") {
      Write-Host "  ⚠ API server stopped unexpectedly" -ForegroundColor Yellow
      break
    }
    if ($viteProcess.HasExited) {
      Write-Host "  ⚠ Frontend stopped unexpectedly" -ForegroundColor Yellow
      break
    }
  }
} finally {
  Write-Host "  Stopping all services..." -ForegroundColor Yellow
  Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
  Write-Host "  ✓ All services stopped" -ForegroundColor Green
}
