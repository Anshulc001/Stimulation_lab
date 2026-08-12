$json = $input | ConvertFrom-Json
$fp = $json.tool_input.file_path

if ($fp -notmatch '\.(tsx?|jsx?|css|html)$') { exit 0 }

Set-Location 'e:\ethical hacking\Stimulation_lab'
$out = npm run build 2>&1 | Out-String

if ($LASTEXITCODE -ne 0) {
    $escaped = $out.Trim() -replace '\\', '\\\\' -replace '"', '\"' -replace "`r`n|`n", '\n'
    Write-Output "{`"hookSpecificOutput`":{`"hookEventName`":`"PostToolUse`",`"additionalContext`":`"BUILD FAILED - fix before finishing:\n$escaped`"}}"
}
