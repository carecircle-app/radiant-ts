$ErrorActionPreference = "Stop"

function Ensure-Dir([string]$p){ [IO.Directory]::CreateDirectory($p) | Out-Null }
function Write-Utf8NoBom([string]$path,[string]$content){
  $dir = Split-Path $path -Parent
  Ensure-Dir $dir
  $enc = New-Object System.Text.UTF8Encoding($false)
  [IO.File]::WriteAllText($path, $content, $enc)
}

$root   = (Get-Location).Path
$ts     = Get-Date -Format "yyyyMMdd-HHmmss"
$bakDir = Join-Path $root "vbank\fix-20250913\$ts"
Ensure-Dir $bakDir

$gPath  = Join-Path $root "src\app\globals.css"

# Backup if exists
if (Test-Path -LiteralPath $gPath) {
  $rel = [IO.Path]::GetRelativePath($root, (Resolve-Path -LiteralPath $gPath).Path)
  $dst = Join-Path $bakDir $rel
  Ensure-Dir (Split-Path -LiteralPath $dst -Parent)
  Copy-Item -LiteralPath $gPath -Destination $dst -Force
  Write-Host " Backed up globals.css  $dst" -ForegroundColor Green
} else {
  Ensure-Dir (Split-Path -LiteralPath $gPath -Parent)
  Write-Host " globals.css not found; will create it" -ForegroundColor Yellow
}

$cur = if (Test-Path -LiteralPath $gPath) { Get-Content -LiteralPath $gPath -Raw } else { "" }

# Ensure @tailwind directives are present
$needsBase = ($cur -notmatch '(?m)^\s*@tailwind\s+base;')
$needsComp = ($cur -notmatch '(?m)^\s*@tailwind\s+components;')
$needsUtil = ($cur -notmatch '(?m)^\s*@tailwind\s+utilities;')
$header = ""
if ($needsBase) { $header += "@tailwind base;`r`n" }
if ($needsComp){ $header += "@tailwind components;`r`n" }
if ($needsUtil){ $header += "@tailwind utilities;`r`n" }

# Components layer block that registers btn/card classes using custom colors (

# Create/overwrite a fix script, then run it. Backs up globals.css and adds @layer components.
mkdir -Force .\scripts | Out-Null

$fix = @'
$ErrorActionPreference = "Stop"

function Ensure-Dir([string]$p){ [IO.Directory]::CreateDirectory($p) | Out-Null }
function Write-Utf8NoBom([string]$path,[string]$content){
  $dir = Split-Path $path -Parent
  Ensure-Dir $dir
  $enc = New-Object System.Text.UTF8Encoding($false)
  [IO.File]::WriteAllText($path, $content, $enc)
}

$root   = (Get-Location).Path
$ts     = Get-Date -Format "yyyyMMdd-HHmmss"
$bakDir = Join-Path $root "vbank\fix-20250913\$ts"
Ensure-Dir $bakDir

$gPath  = Join-Path $root "src\app\globals.css"

# Backup if exists
if (Test-Path -LiteralPath $gPath) {
  $rel = [IO.Path]::GetRelativePath($root, (Resolve-Path -LiteralPath $gPath).Path)
  $dst = Join-Path $bakDir $rel
  Ensure-Dir (Split-Path -LiteralPath $dst -Parent)
  Copy-Item -LiteralPath $gPath -Destination $dst -Force
  Write-Host " Backed up globals.css  $dst" -ForegroundColor Green
} else {
  Ensure-Dir (Split-Path -LiteralPath $gPath -Parent)
  Write-Host " globals.css not found; will create it" -ForegroundColor Yellow
}

$cur = if (Test-Path -LiteralPath $gPath) { Get-Content -LiteralPath $gPath -Raw } else { "" }

# Ensure @tailwind directives are present
$needsBase = ($cur -notmatch '(?m)^\s*@tailwind\s+base;')
$needsComp = ($cur -notmatch '(?m)^\s*@tailwind\s+components;')
$needsUtil = ($cur -notmatch '(?m)^\s*@tailwind\s+utilities;')
$header = ""
if ($needsBase) { $header += "@tailwind base;`r`n" }
if ($needsComp){ $header += "@tailwind components;`r`n" }
if ($needsUtil){ $header += "@tailwind utilities;`r`n" }

# Components layer block that registers btn/card classes using custom colors (bg-brand, ring-accent)
$layerBlock = @"
@layer components {
  /* buttons */
  .btn {
    @apply inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-medium transition
           focus-visible:outline-none active:scale-[.98];
  }
  .btn-primary {
    @apply bg-brand text-white hover:bg-brand-600 focus-visible:ring-2 ring-offset-2 ring-accent;
  }
  .btn-ghost {
    @apply border border-slate-300 hover:bg-slate-50 text-slate-800;
  }

  /* cards */
  .card { @apply rounded-2xl border border-slate-200 p-6 bg-white shadow-soft; }
}
"@

$hasLayerBtn = ($cur -match '(?s)@layer\s+components\s*{[^}]*\.btn-primary[^}]*}')
if (-not $hasLayerBtn) {
  if ($cur) { $cur = $cur.TrimEnd() + "`r`n" }
  if ($header) { $cur = $header + $cur }
  $cur += "`r`n$layerBlock`r`n"
  Write-Utf8NoBom $gPath $cur
  Write-Host " globals.css updated (added @layer components block)" -ForegroundColor Green
} else {
  if ($header) {
    $new = $header + $cur
    Write-Utf8NoBom $gPath $new
    Write-Host " @layer existed; added missing @tailwind directives" -ForegroundColor DarkGray
  } else {
    Write-Host " No change; @layer already present" -ForegroundColor DarkGray
  }
}

Write-Host "`nDone. Rebuild Next.js to recompile Tailwind." -ForegroundColor Cyan
