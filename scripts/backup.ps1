# scripts/backup.ps1 — safe backup, skips missing files/patterns
$ErrorActionPreference = "Stop"

# Destination zip (one level up)
$dest = Join-Path (Resolve-Path "..").Path "radiant-ts-backup.zip"

# Include directories and file patterns (wildcards allowed)
$include = @(
  "src", "public", "prisma", "scripts",
  "package.json", "package-lock.json", "tsconfig.json",
  "next.config.*", "postcss.config.*", "tailwind.config.*", "eslint.config.*",
  "README.md", ".gitignore", ".env.example"
)

# Build a list of existing items (expand wildcards, skip missing)
$items = New-Object System.Collections.Generic.List[string]
foreach ($p in $include) {
  if ($p -like "*`**") {
    # wildcard pattern: expand to files if they exist
    Get-ChildItem -Path $p -File -ErrorAction SilentlyContinue | ForEach-Object {
      $items.Add($_.FullName)
    }
  } else {
    if (Test-Path -LiteralPath $p) {
      $items.Add((Resolve-Path -LiteralPath $p).Path)
    }
  }
}

if ($items.Count -eq 0) {
  Write-Host "Nothing to back up (no matching files/dirs)." -ForegroundColor Yellow
  exit 0
}

# Remove any existing archive
if (Test-Path $dest) { Remove-Item $dest -Force }

# Create the archive
Compress-Archive -Path $items -DestinationPath $dest -CompressionLevel Optimal -Force

# Report
$fi = Get-Item $dest
Write-Host ("Backup written to {0} ({1:N0} bytes)" -f $fi.FullName, $fi.Length) -ForegroundColor Green
