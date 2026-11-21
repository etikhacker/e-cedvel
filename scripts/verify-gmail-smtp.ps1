param(
  [ValidateSet('success','auth-rejected','connection-refused','tls-invalid','timeout','no-output','crash','stderr-noise','wrong-exit','hang')]
  [string]$MockScenario
)
$ErrorActionPreference = 'Stop'
$resultStatus = 'SMTP_CHECK_FAILED'
$resultCode = 5
$securePassword = $null
$passwordPointer = [IntPtr]::Zero
$childProcess = $null
$childStarted = $false
$phase = 'initialization'
try {
  $workspace = Split-Path -Parent $PSScriptRoot
  $portableNode = Join-Path (Split-Path -Parent $workspace) 'tools\node-v22.23.4-win-x64\node.exe'
  $nodeCommand = Get-Command node.exe -CommandType Application -ErrorAction SilentlyContinue
  $nodePath = if (Test-Path -LiteralPath $portableNode) { $portableNode } elseif ($nodeCommand) { $nodeCommand.Source } else { $null }
  if (-not $nodePath) { throw 'NODE_UNAVAILABLE' }
  if ($MockScenario) {
    Write-Output 'SMTP_MOCK_MODE: no network, no real credentials, no email.'
    $securePassword = New-Object System.Security.SecureString
    foreach ($character in 'mockpasswordabcd'.ToCharArray()) { $securePassword.AppendChar($character) }
  } else {
    Write-Output 'Authentication only. No email will be sent. Enter the Gmail App Password in the hidden prompt only.'
    $securePassword = Read-Host 'Gmail App Password (hidden)' -AsSecureString
  }
  $startInfo = New-Object System.Diagnostics.ProcessStartInfo
  $startInfo.FileName = $nodePath
  $startInfo.WorkingDirectory = $workspace
  $mode = if ($MockScenario) { "--mock $MockScenario" } else { '--authenticate-only' }
  $startInfo.Arguments = "--import tsx scripts/verify-gmail-smtp.ts $mode"
  $startInfo.UseShellExecute = $false
  $startInfo.CreateNoWindow = $true
  $startInfo.RedirectStandardInput = $true
  $startInfo.RedirectStandardOutput = $true
  $startInfo.RedirectStandardError = $true
  $childProcess = New-Object System.Diagnostics.Process
  $childProcess.StartInfo = $startInfo
  $phase = 'process-start'
  $childStarted = $childProcess.Start()
  if (-not $childStarted) { throw 'CHILD_START_FAILED' }
  # Drain BOTH streams concurrently so neither pipe can block the other.
  $stdoutTask = $childProcess.StandardOutput.ReadToEndAsync()
  $stderrTask = $childProcess.StandardError.ReadToEndAsync()
  $phase = 'stdin'
  $passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
  $childProcess.StandardInput.Write([Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPointer))
  $childProcess.StandardInput.Close()
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer)
  $passwordPointer = [IntPtr]::Zero
  $securePassword.Dispose()
  $securePassword = $null
  $phase = 'process-wait'
  $waitMilliseconds = if ($MockScenario -eq 'hang') { 2000 } else { 45000 }
  if (-not $childProcess.WaitForExit($waitMilliseconds)) { throw 'CHILD_TIMEOUT' }
  if (-not $stdoutTask.Wait(2000) -or -not $stderrTask.Wait(2000)) { throw 'OUTPUT_TIMEOUT' }
  $phase = 'result-validation'
  # Never relay raw child stderr/stdout: runtime/provider errors could contain secrets.
  $rawResult = $stdoutTask.Result.Trim()
  if (-not $rawResult -or $rawResult.Length -gt 512) { throw 'MISSING_OR_INVALID_RESULT' }
  $reply = $rawResult | ConvertFrom-Json
  $codes = @{ SMTP_AUTHENTICATED=0; SMTP_AUTH_FAILED=2; SMTP_CONNECTION_FAILED=3; SMTP_TLS_FAILED=4; SMTP_CHECK_FAILED=5 }
  $expectedMode = if ($MockScenario) { 'mock' } else { 'real' }
  if (-not ($reply.status -is [string]) -or -not $codes.ContainsKey($reply.status) -or $reply.mode -ne $expectedMode) { throw 'INVALID_RESULT' }
  $expectedCode = $codes[$reply.status]
  if ($reply.exitCode -ne $expectedCode -or $childProcess.ExitCode -ne $expectedCode) { throw 'EXIT_CODE_MISMATCH' }
  $resultStatus = $reply.status
  $resultCode = $expectedCode
} catch {
  # Never print exception text, provider responses or credential input.
  $resultStatus = 'SMTP_CHECK_FAILED'
  $resultCode = 5
} finally {
  if ($passwordPointer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer) }
  if ($securePassword) { $securePassword.Dispose() }
  if ($childProcess) {
    if ($childStarted) {
      try { if (-not $childProcess.HasExited) { $childProcess.Kill(); [void]$childProcess.WaitForExit(2000) } } catch { }
    }
    $childProcess.Dispose()
  }
}
if ($MockScenario) { Write-Output "MOCK_RESULT: $resultStatus" } else { Write-Output $resultStatus }
if ($resultCode -eq 5) { Write-Output "SMTP_CHECK_STAGE=$phase" }
Write-Output "SMTP_EXIT_CODE=$resultCode"
$global:LASTEXITCODE = $resultCode
exit $resultCode
