param([string]$Url = "https://carecircle-app.com")

$r = Invoke-WebRequest -UseBasicParsing $Url -Headers @{ "Cache-Control"="no-cache" }
$ttl = ([regex]::Match($r.Content,'<title>([^<]+)</title>',"IgnoreCase")).Groups[1].Value
"Status: {0}" -f $r.StatusCode
"X-Vercel-Id: {0}" -f ($r.Headers["x-vercel-id"] -join ", ")
"X-Vercel-Cache: {0}" -f ($r.Headers["x-vercel-cache"] -join ", ")
"Title: {0}" -f $ttl
if ($r.Content -match "Coordinate care with confidence") { "Hero: FOUND" } else { "Hero: NOT FOUND" }
