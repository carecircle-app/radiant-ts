# CareCircle-Fix-Metadata.ps1
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

$home    = Join-Path $root 'src/app/page.tsx'
$company = Join-Path $root 'src/app/company/page.tsx'

if (-not (Test-Path $home)) { throw "Home page not found: $home" }

# --- Backup ---
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$bakDir = Join-Path $root "vbank\backups\$stamp"
New-Item -ItemType Directory -Force -Path $bakDir | Out-Null
Copy-Item $home "$bakDir\page.tsx.bak"

# --- Remove stray 'Company — CareCircle' metadata from HOME page ---
# (Keep only the real landing page metadata)
$content = Get-Content $home -Raw
$fixed = $content -replace '(?s)export\s+const\s+metadata\s*=\s*\{[^}]*Company\s*[—-]\s*CareCircle[^}]*\};\s*',''
$fixed = $fixed -replace "(`r`n){3,}","`r`n`r`n"
Set-Content $home $fixed -Encoding UTF8

# --- Ensure company page uses default import for Container (if present) ---
if (Test-Path $company) {
  Copy-Item $company "$bakDir\company.page.tsx.bak"
  (Get-Content $company -Raw) `
    -replace 'import\s+\{\s*Container\s*\}\s+from\s+"@/components/container";', 'import Container from "@/components/container";' `
  | Set-Content $company -Encoding UTF8
}

# --- Build ---
npm run build
