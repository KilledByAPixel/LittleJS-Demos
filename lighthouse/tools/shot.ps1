# One muted, small headless Edge screenshot of the demo, for a quick visual check.
#   powershell -File lighthouse/tools/shot.ps1 <outPng> [budgetMs] [query]
# Sweeps any leftover instance from an earlier run first and kills its own when done,
# so a crash or timeout never leaves headless browsers grinding in the background.
param([string]$out, [int]$budget = 6000, [string]$query = '')

$profileDir = "$env:TEMP\lighthouseshot-profile"
function Sweep
{
    Get-CimInstance Win32_Process -Filter "Name='msedge.exe'" |
        Where-Object { $_.CommandLine -like '*lighthouseshot-profile*' } |
        ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
}

Sweep
$page = 'file:///' + ((Resolve-Path "$PSScriptRoot\..\index.html").Path -replace '\\','/') + $query
$edge = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
$p = Start-Process -FilePath $edge -PassThru -ArgumentList @('--headless=new', '--mute-audio',
    '--window-size=960,540', "--user-data-dir=$profileDir", "--screenshot=$out",
    "--virtual-time-budget=$budget", $page)
if (-not $p.WaitForExit(60000)) { 'timed out' }
Sweep
Start-Sleep -Milliseconds 500
Remove-Item -Recurse -Force $profileDir -ErrorAction SilentlyContinue
"leftover instances: " + @(Get-CimInstance Win32_Process -Filter "Name='msedge.exe'" |
    Where-Object { $_.CommandLine -like '*lighthouseshot-profile*' }).Count
