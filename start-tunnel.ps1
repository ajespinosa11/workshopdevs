# PowerShell Auto-Restart Script for Localtunnel
# Run this script in a separate terminal to keep the tunnel alive continuously.

Write-Host "Starting continuous tunnel auto-restart loop for subdomain: clever-roses-read..." -ForegroundColor Green

while ($true) {
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Launching localtunnel..." -ForegroundColor Cyan
    npx localtunnel --port 3000 --local-host 127.0.0.1 --subdomain clever-roses-read
    
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Localtunnel disconnected/stopped. Restarting in 5 seconds..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
}
