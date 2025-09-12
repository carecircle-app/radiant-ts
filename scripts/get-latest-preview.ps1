param([int]$Take = 30)
$rx = 'https://radiant-[a-z0-9]+-carecircle\.vercel\.app'
$lines = cmd /c "npx vercel ls radiant-ts --next $Take"
$match = ($lines | Select-String -Pattern "$rx.*Preview" | Select-Object -First 1)
if (-not $match) {
  Write-Error "No Preview deployment found."
  exit 1
}
$u = ([regex]::Match($match.Line,$rx)).Value
$u
