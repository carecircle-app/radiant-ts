# CareCircle-Fix-ContainerImports.ps1
$ErrorActionPreference = 'Stop'
$root   = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

$stamp  = Get-Date -Format 'yyyyMMdd-HHmmss'
$bakDir = Join-Path $root "vbank\backups\$stamp\container-imports"
New-Item -ItemType Directory -Force -Path $bakDir | Out-Null

# Regex: replace `import { Container } from "@/components/container";`
# with    `import Container from "@/components/container";`
$rx = [regex]'(?m)^\s*import\s*\{\s*Container\s*\}\s*from\s*(["''])@/components/container\1\s*;'

$changed = @()
Get-ChildItem -Recurse .\src -Include *.tsx,*.ts -File | ForEach-Object {
  $t = Get-Content $_.FullName -Raw
  if ($rx.IsMatch($t)) {
    $rel = Resolve-Path $_.FullName -Relative
    Copy-Item $_.FullName (Join-Path $bakDir ($_.Name + '.bak')) -Force
    $new = $rx.Replace($t, { param($m) 'import Container from ' + $m.Groups[1].Value + '@/components/container' + $m.Groups[1].Value + ';' })
    Set-Content $_.FullName $new -Encoding UTF8
    $changed += $rel
  }
}

"Patched files:`n" + ($changed -join "`n") | Write-Host

# Build
npm run build
