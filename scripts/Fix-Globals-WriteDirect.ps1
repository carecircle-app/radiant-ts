$ErrorActionPreference = 'Stop'

function Ensure-Dir([string]$p){
  if (![string]::IsNullOrWhiteSpace($p)) {
    [System.IO.Directory]::CreateDirectory($p) | Out-Null
  }
}
function Write-Utf8NoBom([string]$path,[string]$content){
  $dir = [System.IO.Path]::GetDirectoryName($path)
  Ensure-Dir $dir
  $enc = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($path, $content, $enc)
}

$root  = (Get-Location).Path
$ts    = Get-Date -Format 'yyyyMMdd-HHmmss'
$bak   = Join-Path $root "vbank\fix-20250913e\$ts"
Ensure-Dir $bak

$gRel  = "src\app\globals.css"
$gPath = Join-Path $root $gRel
$dst   = Join-Path $bak  $gRel

# Backup if exists
if (Test-Path -LiteralPath $gPath) {
  Ensure-Dir ([System.IO.Path]::GetDirectoryName($dst))
  Copy-Item -LiteralPath $gPath -Destination $dst -Force
  Write-Host " Backed up globals.css  $dst" -ForegroundColor Green
} else {
  Ensure-Dir ([System.IO.Path]::GetDirectoryName($gPath))
  Write-Host " globals.css not found; will create new" -ForegroundColor Yellow
}

# Canonical content per Tailwind guidance: directives + @layer components
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
