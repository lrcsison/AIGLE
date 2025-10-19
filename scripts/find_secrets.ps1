# Basic secret scanner - run from repository root
# Usage: powershell -ExecutionPolicy Bypass -File .\scripts\find_secrets.ps1

$patterns = @("AIza","AKIA","SECRET","PRIVATE_KEY","password","TOKEN","api_key","SUPABASE_KEY")

Write-Host "Scanning files for likely secrets..."
Get-ChildItem -Recurse -File -Exclude '*.git*','*.png','*.jpg','*.jpeg','*.gif','*.lock' | ForEach-Object {
    $path = $_.FullName
    try{
        $text = Get-Content -Raw -ErrorAction Stop -LiteralPath $path
        foreach($p in $patterns){
            if($text -match $p){
                Write-Host "Potential match: $p in $path" -ForegroundColor Yellow
                break
            }
        }
    } catch {
        # ignore unreadable files
    }
}

Write-Host "Scan complete."