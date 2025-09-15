# === CareCircle: Fix globals.css by adding @layer components (safe append + backups) ===
$ErrorActionPreference = 'Stop'

# Helpers
function Ensure-Dir([string]$p){ [IO.Directory]::CreateDirectory($p) | Out-Null }
function Write-Utf8NoBom([string]$path,[string]$content){
  $dir = Split-Path $path -Parent
  Ensure-Dir $dir
  $enc = New-Object System.Text.UTF8Encoding($false)
  [IO.File]::WriteAllText($path, $content, $enc)
}

# Paths
$root   = (Get-Location).Path
$ts     = Get-Date -Format 'yyyyMMdd-HHmmss'
$bakDir = Join-Path $root "vbank\fix-20250913\$ts"
Ensure-Dir $bakDir

$gPath  = Join-Path $root "src\app\globals.css"

# Backup if exists
if (Test-Path -LiteralPath $gPath) {
  $rel   = [IO.Path]::GetRelativePath($root, (Resolve-Path -LiteralPath $gPath).Path)
  $dst   = Join-Path $bakDir $rel
  Ensure-Dir (Split-Path -LiteralPath $dst -Parent)
  Copy-Item -LiteralPath $gPath -Destination $dst -Force
  Write-Host "✓ Backed up globals.css -> $dst" -ForegroundColor Green
} else {
  # Ensure the folder exists even if file doesn't
  Ensure-Dir (Split-Path -LiteralPath $gPath -Parent)
  Write-Host "• globals.css did not exist; will create it" -ForegroundColor Yellow
}

# Read current text (if any)
$cur = if (Test-Path -LiteralPath $gPath) { Get-Content -LiteralPath $gPath -Raw } else { "" }

# Ensure base Tailwind directives exist
$needsBase = ($cur -notmatch '(?m)^\s*@tailwind\s+base;')
$needsComp = ($cur -notmatch '(?m)^\s*@tailwind\s+components;')
$needsUtil = ($cur -notmatch '(?m)^\s*@tailwind\s+utilities;')

$header = ""
if ($needsBase) { $header += "@tailwind base;`r`n" }
if ($needsComp){ $header += "@tailwind components;`r`n" }
if ($needsUtil){ $header += "@tailwind utilities;`r`n" }

# The @layer components block we need to register custom classes that @apply custom colors (bg-brand, ring-accent)
$layerBlock = @'
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
'@

# If a components layer with .btn-primary already exists, skip; otherwise append
$hasLayerBtn = ($cur -match '(?s)@layer\s+components\s*{[^}]*\.btn-primary[^}]*}')
if (-not $hasLayerBtn) {
  if ($cur) {
    # Keep existing content and append our block at the end
    $new = $cur.TrimEnd() + "`r`n"
  } else {
    $new = ""
  }
  if ($header) { $new = $header + $new }
  $new += "`r`n" + $layerBlock + "`r`n"
  Write-Utf8NoBom $gPath $new
  Write-Host "✓ globals.css updated (added @layer components block)" -ForegroundColor Green
} else {
  if ($header) {
    $new = $header + $cur
    Write-Utf8NoBom $gPath $new
    Write-Host "• globals.css already had @layer components; added missing @tailwind directives" -ForegroundColor DarkGray
  } else {
    Write-Host "• globals.css already contains required @layer; no change" -ForegroundColor DarkGray
  }
}

Write-Host "`nDone. Next step: restart dev server to recompile Tailwind." -ForegroundColor Cyan
