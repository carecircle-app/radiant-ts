param(
  [string]$Root = (Get-Location).Path
)

Set-Location $Root
$OUT = Join-Path $Root "CARE_STATUS_REPORT.txt"
if (Test-Path $OUT) { Remove-Item $OUT -Force }

function W($text="") { Add-Content -Path $OUT -Value $text }
function Section($title) { W("`n# $title"); W(("-" * (2 + $title.Length))) }

$now = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
W("CareCircle Project Status Report")
W("Generated: $now")
W("Root: $Root")
W("")

# Git summary
Section "Git"
$branch = (& git rev-parse --abbrev-ref HEAD 2>$null)
$remote = (& git remote -v 2>$null) -join "`n"
$last10 = (& git log --oneline -n 10 2>$null) -join "`n"
$tags = (& git tag --list --sort=-creatordate 2>$null) -join "`n"
$status = (& git status --porcelain=v1 2>$null) -join "`n"
W("Branch: $branch")
W("Remote(s):`n$remote")
W("")
W("Recent commits:`n$last10")
W("")
W("Tags:`n$tags")
W("")
W("Uncommitted changes (if any):`n$status")

# Changes since tag v0.1.0-landing (if exists)
$tagExists = ($tags -match "v0.1.0-landing")
if ($tagExists) {
  Section "Diff since v0.1.0-landing"
  $diffnames = (& git diff --name-status v0.1.0-landing..HEAD 2>$null) -join "`n"
  W($diffnames)
}

# Key files and routes
Section "Key Files"
$files = @(
  "src/app/page.tsx",
  "src/app/api/stripe/checkout/route.ts",
  "src/app/studio/[[...tool]]/page.tsx",
  "src/app/studio/page.tsx"
)
foreach ($f in $files) {
  $exists = Test-Path $f
  W(("{0,-45} {1}" -f $f, ($(if ($exists) {"OK"} else {"missing"}))))
}

Section "App Routes (page.tsx files)"
$routes = Get-ChildItem -Path "src/app" -Recurse -Filter "page.tsx" -ErrorAction SilentlyContinue |
          ForEach-Object { $_.FullName.Replace($Root, "").TrimStart("\") }
W(($routes -join "`n"))

# package.json summary
Section "package.json"
try {
  $pkg = Get-Content "package.json" -Raw | ConvertFrom-Json
  W("name: " + $pkg.name)
  W("version: " + $pkg.version)
  W("")
  W("scripts:")
  $pkg.scripts.PSObject.Properties | ForEach-Object { W("  " + $_.Name + ": " + $_.Value) }
  W("")
  W("dependencies (selected):")
  $selected = "next","react","react-dom","stripe","prisma","@prisma/client","sanity","next-sanity"
  foreach ($k in $selected) {
    $v = $pkg.dependencies.$k
    if ($v) { W(("  {0,-18} {1}" -f $k, $v)) }
  }
  W("")
  W("devDependencies (selected):")
  $dsel = "typescript","eslint","eslint-config-next","tailwindcss"
  foreach ($k in $dsel) {
    $v = $pkg.devDependencies.$k
    if ($v) { W(("  {0,-18} {1}" -f $k, $v)) }
  }
} catch {
  W("Could not parse package.json: " + $_.Exception.Message)
}

# Env template + presence (no secrets shown)
Section ".env files"
$hasEnv = Test-Path ".env"
$hasEnvLocal = Test-Path ".env.local"
$hasExample = Test-Path ".env.example"
W(("Found .env:       {0}" -f ($(if ($hasEnv) {"yes"} else {"no"}))))
W(("Found .env.local: {0}" -f ($(if ($hasEnvLocal) {"yes"} else {"no"}))))
W(("Found .env.example: {0}" -f ($(if ($hasExample) {"yes"} else {"no"}))))
if ($hasExample) {
  W("")
  W(".env.example contents:")
  W((Get-Content ".env.example"))
}

Section "Notes"
W(" Keep /api/stripe/checkout as-is (idempotency, URLs clean).")
W(" Plans expected by API: lite, elite, donation, donation-monthly.")
W(" Keep only src/app/studio/[[...tool]]/page.tsx (avoid duplicate /studio/page.tsx).")
W(" Dev: npm run dev  (binds to 127.0.0.1:3000 if you set it in package.json).")
W(" Do NOT commit .env / .env.local (use .env.example).")

Write-Host "Report written to: $OUT" -ForegroundColor Green
notepad $OUT
