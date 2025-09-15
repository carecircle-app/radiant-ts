$ErrorActionPreference = 'Stop'

function Ensure-Dir([string]$p){ [IO.Directory]::CreateDirectory($p) | Out-Null }
function Write-Utf8NoBom([string]$path,[string]$content){
  $dir = Split-Path $path -Parent
  Ensure-Dir $dir
  $enc = New-Object System.Text.UTF8Encoding($false)
  [IO.File]::WriteAllText($path, $content, $enc)
}

$root  = (Get-Location).Path
$ts    = Get-Date -Format 'yyyyMMdd-HHmmss'
$bak   = Join-Path $root "vbank\fix-20250913d\$ts"
Ensure-Dir $bak

# Use explicit relative path instead of GetRelativePath (works on WinPS 5.x)
$gRel  = "src\app\globals.css"
$gPath = Join-Path $root $gRel
$dst   = Join-Path $bak  $gRel

# Backup if exists
if (Test-Path -LiteralPath $gPath) {
  Ensure-Dir (Split-Path -LiteralPath $dst -Parent)
  Copy-Item -LiteralPath $gPath -Destination $dst -Force
  Write-Host " Backed up globals.css  $dst" -ForegroundColor Green
} else {
  Ensure-Dir (Split-Path -LiteralPath $gPath -Parent)
  Write-Host " globals.css not found; will create new" -ForegroundColor Yellow
}

# Canonical content: Tailwind directives + @layer components
$content = @'
@tailwind base;
@tailwind components;
@tailwind utilities;

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

Write-Utf8NoBom $gPath $content
Write-Host " globals.css rewritten with @layer components" -ForegroundColor Green
