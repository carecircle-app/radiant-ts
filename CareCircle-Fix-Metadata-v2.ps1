# CareCircle-Fix-Metadata-v2.ps1
$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $repoRoot

$pageHome   = Join-Path $repoRoot 'src/app/page.tsx'
$pageCompany= Join-Path $repoRoot 'src/app/company/page.tsx'

if (-not (Test-Path $pageHome)) { throw "Home page not found: $pageHome" }

# --- Backup ---
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$bakDir = Join-Path $repoRoot "vbank\backups\$stamp"
New-Item -ItemType Directory -Force -Path $bakDir | Out-Null
Copy-Item $pageHome "$bakDir\page.tsx.bak" -Force
if (Test-Path $pageCompany) { Copy-Item $pageCompany "$bakDir\company.page.tsx.bak" -Force }

# --- Remove the stray Company metadata from HOME page ---
# (matches short form like: export const metadata = { title: "Company — CareCircle" }; )
$content = Get-Content $pageHome -Raw
$pattern = '(?s)export\s+const\s+metadata\s*=\s*\{\s*title\s*:\s*"Company[^"]*"\s*\};\s*'
$fixed   = [regex]::Replace($content, $pattern, '')
$fixed   = $fixed -replace "(`r`n){3,}", "`r`n`r`n"
Set-Content $pageHome $fixed -Encoding UTF8

# --- Ensure company page uses default import for Container (if present) ---
if (Test-Path $pageCompany) {
  (Get-Content $pageCompany -Raw) `
    -replace 'import\s+\{\s*Container\s*\}\s+from\s+"@/components/container";', 'import Container from "@/components/container";' `
  | Set-Content $pageCompany -Encoding UTF8
}

# --- Build ---
npm run build
