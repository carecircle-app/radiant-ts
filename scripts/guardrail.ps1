param([switch]$Fix)
$ErrorActionPreference='Stop'
function ReadJson($p){ if(-not(Test-Path $p)){ return $null } (Get-Content $p -Raw | ConvertFrom-Json) }
function ReadDotEnv($p){ $m=@{}; if(Test-Path $p){(Get-Content $p -Raw) -split "`r?`n"|%{
  if($_ -match '^\s*#' -or $_ -match '^\s*$'){return}
  if($_ -match '^\s*([^=]+)\s*=\s*(.*)\s*$'){ $m[$matches[1].Trim()]=$matches[2].Trim('"').Trim("'") } }}; $m }

$pkg = ReadJson (Join-Path $PSScriptRoot '..\package.json')
if(-not $pkg){ throw "package.json not found" }
$nextDep = $pkg.dependencies.next, $pkg.devDependencies.next | ? { $_ } | Select-Object -First 1
if(-not $nextDep){ throw "Next.js not found in dependencies" }
$ver = ($nextDep -replace '^[^\d]*','') -replace '[^\d\.].*$',''; $major=[int](($ver -split '\.')[0])
$typeModule = ($pkg.PSObject.Properties.Name -contains 'type' -and $pkg.type -eq 'module')

$cfgJs  = Join-Path $PSScriptRoot '..\next.config.js'
$cfgMjs = Join-Path $PSScriptRoot '..\next.config.mjs'
$cfgTs  = Join-Path $PSScriptRoot '..\next.config.ts'
$cfgCjs = Join-Path $PSScriptRoot '..\next.config.cjs'

function IsEsm($p){ if(-not(Test-Path $p)){return $false}; (Get-Content $p -Raw) -match 'export\s+default' }
$viol=@()
if($major -ge 15 -or $typeModule){
  if(Test-Path $cfgCjs){ $viol += "Remove next.config.cjs (unsupported for Next $major / ESM projects)." }
  if(-not (Test-Path $cfgJs -or Test-Path $cfgMjs -or Test-Path $cfgTs)){
    $viol += "Missing Next ESM config (next.config.mjs/js/ts)."
  } elseif(Test-Path $cfgJs -and -not (IsEsm $cfgJs)){
    $viol += "next.config.js must be ESM (export default …)."
  }
  if($Fix){
    if(Test-Path $cfgCjs){ Copy-Item $cfgCjs "$cfgCjs.bak.$([DateTime]::Now.ToString('yyyyMMdd-HHmmss'))"; Remove-Item $cfgCjs -Force }
    if(-not(Test-Path $cfgMjs)){
@"/** @type {import('next').NextConfig} */
const config = {
  serverExternalPackages: ['stripe','encoding'],
  webpack: (cfg, ctx) => cfg,
};
export default config;
"@ | Set-Content $cfgMjs -Encoding UTF8
    }
  }
}

# Stripe route + plan guards
$route = Join-Path $PSScriptRoot '..\src\app\api\stripe\checkout\route.ts'
if(-not (Test-Path $route)){ $viol+="Missing src/app/api/stripe/checkout/route.ts" }

$envLocal  = ReadDotEnv (Join-Path $PSScriptRoot '..\.env.local')
$envProd   = ReadDotEnv (Join-Path $PSScriptRoot '..\.vercel\.env.production.local')
function EK($k){ if($envLocal[$k]){$envLocal[$k]} elseif($envProd[$k]){$envProd[$k]} }

$must=@('STRIPE_SECRET_KEY','STRIPE_PRICE_LITE','STRIPE_PRICE_ELITE','NEXT_PUBLIC_APP_BASE_URL')
$missing=@()
foreach($k in $must){ if(-not (EK $k)){ $missing+= $k } }
if($missing.Count -gt 0){ $viol += "Missing env(s): " + ($missing -join ', ') }

# Prevent empty CTAs: require at least one client-exposed price or server fallback present
$hasAny = (EK 'NEXT_PUBLIC_STRIPE_PRICE_LITE') -or (EK 'NEXT_PUBLIC_STRIPE_PRICE_ELITE') -or (EK 'STRIPE_PRICE_LITE') -or (EK 'STRIPE_PRICE_ELITE')
if(-not $hasAny){ $viol += "No Stripe price IDs found (client or server). CTAs would be disabled." }

if($viol.Count -gt 0){
  Write-Host "GUARDRAIL VIOLATIONS:" -ForegroundColor Red
  $viol | % { Write-Host " - $_" -ForegroundColor Yellow }
  exit 1
} else {
  Write-Host "Guardrail OK — config, route, envs, CTAs ready." -ForegroundColor Green
}
