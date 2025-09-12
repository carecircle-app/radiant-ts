param([string]$Url = "https://carecircle-app.com/")
cmd /c "curl -s -D - -o NUL $Url" | Select-String -Pattern 'HTTP/|location:|x-vercel-'
