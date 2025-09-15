$ErrorActionPreference = 'Stop'

function Ensure-Dir([string]$p){
  if (![string]::IsNullOrWhiteSpace($p)) {
    [System.IO.Directory]::CreateDirectory($p) | Out-Null
  }
}

# target file
$root = (Get-Location).Path
$landing = Join-Path $root 'scripts\CareCircle-Landing.ps1'

if (!(Test-Path -LiteralPath $landing)) {
  throw 'scripts\CareCircle-Landing.ps1 not found.'
}

# 2) Backup
$ts = Get-Date -Format 'yyyyMMdd-HHmmss'
$bakDir = Join-Path $root "vbank\patch-landing\$ts"
Ensure-Dir $bakDir
$dst = Join-Path $bakDir 'CareCircle-Landing.ps1'
Copy-Item -LiteralPath $landing -Destination $dst -Force
Write-Host "✓ Backup → $dst" -ForegroundColor Green

# 3) Read and patch the Write-Utf8NoBom function
$text = Get-Content -LiteralPath $landing -Raw

# Regex to find function definition (tolerant of whitespace/newlines)
$pattern = '(?ms)function\s+Write-Utf8NoBom\s*\(\s*\[string\]\\s*,\s*\[string\]\\s*\)\s*\{.*?\}'

$replacement = @'
function Write-Utf8NoBom([string],[string]){
   = [System.IO.Path]::GetDirectoryName()
  if (![string]::IsNullOrWhiteSpace()) {
    [System.IO.Directory]::CreateDirectory() | Out-Null
  }
   = New-Object System.Text.UTF8Encoding(False)
  [System.IO.File]::WriteAllText(, , )
}
'@

if ([regex]::IsMatch(, (?ms)^\s*\.(btn|btn-primary|btn-ghost|card)\s*\{.*?\}\s*)) {
   = [regex]::Replace(, (?ms)^\s*\.(btn|btn-primary|btn-ghost|card)\s*\{.*?\}\s*, , 1)
  Write-Host " Patched existing Write-Utf8NoBom()" -ForegroundColor Green
} else {
  # If not found, inject below the Ensure-Dir helper (or at file top as fallback)
  if ( -match '(?ms)function\s+Ensure-Dir\s*\([^)]+\)\s*\{.*?\}') {
     = [regex]::Replace(, '(?ms)(function\s+Ensure-Dir\s*\([^)]+\)\s*\{.*?\}\s*)', "$1
", 1)
    Write-Host " Inserted Write-Utf8NoBom() below Ensure-Dir()" -ForegroundColor DarkGray
  } else {
     =  + "
" + 
    Write-Host " Inserted Write-Utf8NoBom() at file top" -ForegroundColor DarkGray
  }
}

Set-Content -LiteralPath $landing -Value $text -Encoding UTF8
Write-Host " CareCircle-Landing.ps1 updated" -ForegroundColor Green
