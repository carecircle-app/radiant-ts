# scripts/diagnose-vercel.ps1
# Single-pass Vercel connection/build diagnostics for a Next.js (App Router) repo.
# Backtick-free output to avoid PowerShell parsing issues.

$ErrorActionPreference = "Continue"

# Ensure we run from repo root even if called from /scripts
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location (Resolve-Path (Join-Path $here ".."))

# Output file
$outDir = "diagnostics"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$log = Join-Path $outDir "vercel_diagnose_$stamp.md"

function WriteLine([string]$text = "") { Add-Content -Path $log -Value $text }
function Section([string]$title) { WriteLine ""; WriteLine "# $title"; WriteLine "" }
function Run([string]$cmd) {
  WriteLine "COMMAND: $cmd"
  try {
    $out = Invoke-Expression $cmd 2>&1 | Out-String
  } catch {
    $out = $_ | Out-String
  }
  WriteLine "OUTPUT:"
  WriteLine ($out.TrimEnd())
  WriteLine "-----"
  WriteLine ""
}

WriteLine "Vercel Diagnose Report"
WriteLine "Log file: $log"
WriteLine ("Timestamp: {0}" -f (Get-Date))
WriteLine ""

Section "Repo & Runtime"
Run "node -v"
Run "npm -v"
Run "git --version"
Run "git status -sb"
Run "git remote -v"
Run "git log -1 --oneline"

Section "package.json sanity"
if (Test-Path "package.json") {
  try {
    $pkg = Get-Content package.json -Raw | ConvertFrom-Json
    WriteLine "## scripts"
    foreach ($kv in $pkg.scripts.GetEnumerator()) {
      WriteLine ("* {0}: {1}" -f $kv.Key, $kv.Value)
    }
    if ($pkg.engines) {
      WriteLine ""
      WriteLine "## engines"
      WriteLine (($pkg.engines | ConvertTo-Json -Depth 5))
    }
    if ($pkg.scripts."prebuild") {
      WriteLine ""
      WriteLine "Note: prebuild script detected (ok for Vercel)."
    }
  } catch {
    WriteLine ("Could not parse package.json: {0}" -f $_.Exception.Message)
  }
} else {
  WriteLine "package.json not found."
}

Section "Vercel CLI & Link Status"
Run "vercel --version"
Run "vercel whoami"
if (Test-Path ".vercel\project.json") {
  WriteLine "Found .vercel/project.json (project is linked)."
  Run "type .vercel\project.json"
} else {
  WriteLine "No .vercel/project.json → project not linked locally."
  WriteLine "Next step after report: run 'vercel link' once (interactive), then re-run this script."
}

Section "Pull Vercel env/settings cache (development)"
Run "vercel pull --yes --environment=development"
if (Test-Path ".vercel\.env.development.local") {
  WriteLine "Pulled cache file exists: .vercel/.env.development.local"
} else {
  WriteLine "Did not find .vercel/.env.development.local (login/link may be needed)."
}

Section ".env.local required keys (masked)"
$need = @(
 "NEXT_PUBLIC_APP_BASE_URL",
 "STRIPE_SECRET_KEY",
 "STRIPE_WEBHOOK_SECRET",
 "STRIPE_PRICE_LITE_MONTHLY",
 "STRIPE_PRICE_ELITE_MONTHLY",
 "STRIPE_PRICE_DONATION_ONE_TIME"
)
if (Test-Path ".env.local") {
  $lines = Get-Content ".env.local"
  foreach ($k in $need) {
    $val = ($lines | Where-Object { $_ -match "^$k=" }) -replace "^$k=", ""
    if ($val) {
      if ($val.Length -gt 10) {
        $masked = $val.Substring(0,4) + "****" + $val.Substring($val.Length-4)
      } else {
        $masked = "set"
      }
      WriteLine ("* {0}: {1}" -f $k, $masked)
    } else {
      WriteLine ("* {0}: **MISSING**" -f $k)
    }
  }
} else {
  WriteLine ".env.local not found at repo root."
}

Section "Next.js file checks"
if (Test-Path "src\app\page.tsx") {
  $page = Get-Content "src\app\page.tsx" -Raw
  if ($page -match '^\s*"use client"') {
    WriteLine 'WARNING: "use client" found at top of src/app/page.tsx (should be Server Component).'
  }
  if ($page -match 'dynamic\(.+ssr\s*:\s*false') {
    WriteLine 'WARNING: dynamic(..., { ssr:false }) detected in server page.'
  }
} else {
  WriteLine "Missing src/app/page.tsx"
}

if (Test-Path "src\components\StripeCTAButtons.tsx") {
  $cta = Get-Content "src\components\StripeCTAButtons.tsx" -Raw
  if ($cta -notmatch '^\s*"use client"') {
    WriteLine 'NOTE: StripeCTAButtons.tsx lacks "use client" (expected client component).'
  }
} else {
  WriteLine "Missing src/components/StripeCTAButtons.tsx"
}

Section "Optional local Vercel build (skipped by default)"
if ($env:RUN_VERCEL_BUILD -eq "1") {
  Run "vercel build"
} else {
  WriteLine "Set env RUN_VERCEL_BUILD=1 before running this script to also try 'vercel build' locally."
}

Write-Host "Done. Report -> $log"
