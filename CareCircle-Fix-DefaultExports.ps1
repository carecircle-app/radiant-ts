# CareCircle-Fix-DefaultExports.ps1
$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $repoRoot

$file = Join-Path $repoRoot 'src/app/page.tsx'
if (-not (Test-Path $file)) { throw "File not found: $file" }

# Backup
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$bakDir = Join-Path $repoRoot "vbank\backups\$stamp"
New-Item -ItemType Directory -Force -Path $bakDir | Out-Null
Copy-Item $file (Join-Path $bakDir 'page.tsx.bak') -Force

# Read file
$c = Get-Content $file -Raw

# 1) Prefer Home() as the default: convert any "export default function <NotHome>" to "export function <NotHome>"
$c = [regex]::Replace($c, 'export\s+default\s+function\s+(?!Home\b)', 'export function ')

# 2) If any other 'export default' tokens remain (e.g., default const/class elsewhere),
#    keep the first one and drop 'default' from all later ones.
$matches = [regex]::Matches($c, 'export\s+default')
if ($matches.Count -gt 1) {
  $start = $matches[0].Index + $matches[0].Length
  $tail  = $c.Substring($start)
  $tailFixed = [regex]::Replace($tail, 'export\s+default', 'export ')
  $c = $c.Substring(0, $start) + $tailFixed
}

# Save changes
Set-Content $file $c -Encoding UTF8

# Show a quick check
Get-ChildItem -Recurse .\src\app -Filter page.tsx | ForEach-Object {
  $n = (Select-String -Path $_.FullName -Pattern 'export\s+default\s+function' -AllMatches).Matches.Count
  "{0} default-func-exports -> {1}" -f $n, $_.FullName
}

# Build
npm run build
