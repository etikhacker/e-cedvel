param([switch]$SendTest)
$ErrorActionPreference = 'Stop'
$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
$nodePath = if ($nodeCommand) { $nodeCommand.Source } else { 'D:\e-cedvel\tools\node-v22.23.4-win-x64\node.exe' }
if (-not (Test-Path -LiteralPath $nodePath)) { throw 'Node.js 22 is required.' }
Write-Host 'Enter the SAME Gmail App Password stored in Vercel. No file or chat copy is needed.'
if ($SendTest) { Write-Host 'One test email will be sent ONLY to e.cedvel.qruptap@gmail.com.' }
else { Write-Host 'Authentication only: no email will be sent.' }
$securePassword = Read-Host 'Gmail App Password (hidden)' -AsSecureString
$passwordPointer = [IntPtr]::Zero
$process = $null
try {
  $startInfo = New-Object System.Diagnostics.ProcessStartInfo
  $startInfo.FileName = $nodePath
  $startInfo.WorkingDirectory = Split-Path -Parent $PSScriptRoot
  $mode = if ($SendTest) { '--send-authorized-test' } else { '--authenticate-only' }
  $startInfo.Arguments = "--conditions=react-server --import tsx scripts/verify-gmail-smtp.ts $mode"
  $startInfo.UseShellExecute = $false
  $startInfo.RedirectStandardInput = $true
  $startInfo.CreateNoWindow = $true
  $process = New-Object System.Diagnostics.Process
  $process.StartInfo = $startInfo
  $passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
  if (-not $process.Start()) { throw 'Could not start SMTP verification.' }
  $process.StandardInput.Write([Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPointer))
  $process.StandardInput.Close()
  $process.WaitForExit()
  if ($process.ExitCode -ne 0) { throw 'SMTP verification did not pass. Credentials were not logged.' }
} finally {
  if ($passwordPointer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer) }
  $securePassword.Dispose()
  if ($process) { $process.Dispose() }
}
