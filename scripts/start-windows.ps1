param([switch]$NoOpen)
$ErrorActionPreference = 'Stop'
$taskProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $taskProjectRoot
try {
$taskNode = $null
$taskExistingNode = Get-Command node -ErrorAction SilentlyContinue
if ($taskExistingNode) {
  $taskMajor = [int]((& $taskExistingNode.Source --version).TrimStart('v').Split('.')[0])
  if ($taskMajor -ge 22) { $taskNode = $taskExistingNode.Source }
}
if (-not $taskNode) {
  $taskCacheRoot = Join-Path $taskProjectRoot '.mfh-runtime'
  New-Item -ItemType Directory -Force -Path $taskCacheRoot | Out-Null
  $taskCachedNodes = Get-ChildItem -LiteralPath $taskCacheRoot -Directory -Filter 'node-v*' | Sort-Object Name -Descending
  foreach ($taskCandidate in $taskCachedNodes) {
    $taskExecutable = Join-Path $taskCandidate.FullName 'node.exe'
    if (Test-Path -LiteralPath $taskExecutable) {
      $taskMajor = [int]((& $taskExecutable --version).TrimStart('v').Split('.')[0])
      if ($taskMajor -ge 22) { $taskNode = $taskExecutable; break }
    }
  }
  if (-not $taskNode) {
    Write-Host 'Preparing Memory for Human. Downloading official Node.js LTS for this folder...'
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    $taskArch = if ($env:PROCESSOR_ARCHITECTURE -eq 'ARM64') { 'arm64' } else { 'x64' }
    $taskReleases = Invoke-RestMethod -Uri 'https://nodejs.org/dist/index.json'
    $taskRelease = $taskReleases | Where-Object { $_.lts -and ($_.files -contains "win-$taskArch-zip") -and ([int]$_.version.TrimStart('v').Split('.')[0] -ge 22) } | Select-Object -First 1
    if (-not $taskRelease) { throw 'No supported Node.js LTS download found. Ask your AI to install Node.js 22 or later.' }
    $taskArchiveName = "node-$($taskRelease.version)-win-$taskArch.zip"
    $taskArchivePath = Join-Path $taskCacheRoot $taskArchiveName
    $taskDownloadBase = "https://nodejs.org/dist/$($taskRelease.version)"
    Invoke-WebRequest -UseBasicParsing -Uri "$taskDownloadBase/$taskArchiveName" -OutFile $taskArchivePath
    $taskChecksums = (Invoke-WebRequest -UseBasicParsing -Uri "$taskDownloadBase/SHASUMS256.txt").Content
    $taskLine = ($taskChecksums -split "`n") | Where-Object { $_.TrimEnd() -match ('\s+' + [regex]::Escape($taskArchiveName) + '$') } | Select-Object -First 1
    if (-not $taskLine) { throw 'The official download checksum is missing.' }
    $taskExpected = ($taskLine.Trim() -split '\s+')[0]
    $taskActual = (Get-FileHash -LiteralPath $taskArchivePath -Algorithm SHA256).Hash
    if ($taskActual -ne $taskExpected) { throw 'The download did not pass verification. Please retry.' }
    Expand-Archive -LiteralPath $taskArchivePath -DestinationPath $taskCacheRoot -Force
    $taskNode = Join-Path $taskCacheRoot "node-$($taskRelease.version)-win-$taskArch\node.exe"
  }
}
if ($NoOpen) { & $taskNode (Join-Path $taskProjectRoot 'server.mjs') }
else { & $taskNode (Join-Path $taskProjectRoot 'server.mjs') --open }
exit $LASTEXITCODE
} catch {
  Write-Host '暂时没能打开回忆录。请把仓库和 docs/ai-handoff.md 交给自己的 AI 帮忙。'
  Write-Host 'Could not start. Ask your AI to read docs/translations/AI-HANDOFF.en.md and help you.'
  Write-Host 'No se pudo iniciar. Pide a tu IA que lea docs/translations/AI-HANDOFF.es.md y te ayude.'
  exit 1
}
