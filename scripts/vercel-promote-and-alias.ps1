param(
  [Parameter(Mandatory=$true)][string]$PreviewUrl,
  [string]$Domain = "carecircle-app.com",
  [string[]]$Needles = @("Coordinate care with confidence","Start Lite","Go Elite")
)

Write-Host "Waiting for preview to be ready:" $PreviewUrl -ForegroundColor Cyan
$ready = $false
do {
  try {
    $r = Invoke-WebRequest -UseBasicParsing "$PreviewUrl/?bust=$(Get-Random)" -Headers @{ "Cache-Control"="no-cache" }
    $hasNeedle = $Needles | Where-Object { $r.Content -match [regex]::Escape($_) } | ForEach-Object { $true } | Select-Object -First 1
    $ready = ($r.StatusCode -eq 200) -and ($hasNeedle)
    if (-not $ready) { throw "warming" }
  } catch {
    Start-Sleep 5
  }
} until ($ready)

Write-Host "Preview looks ready; aliasing → $Domain" -ForegroundColor Green
cmd /c "npx vercel alias set $PreviewUrl $Domain"
