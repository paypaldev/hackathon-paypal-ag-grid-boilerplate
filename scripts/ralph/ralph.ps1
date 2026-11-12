<#
.SYNOPSIS
    Ralph Loop Runner for Windows PowerShell.
    Executes autonomous AI coding iterations until all user stories in prd.json are complete.
.PARAMETER Tool
    Coding tool to invoke: 'claude', 'amp', or 'antigravity'. Default is 'claude'.
.PARAMETER MaxIterations
    Maximum number of iterations to run. Default is 10.
#>
param(
    [string]$Tool = "claude",
    [int]$MaxIterations = 10,
    [string]$PromptFile = ""
)

$ErrorActionPreference = "Stop"
$ScriptDir = $PSScriptRoot
if (-not $ScriptDir) {
    $ScriptDir = (Get-Location).Path
}

$PrdFile = Join-Path $ScriptDir "prd.json"
$ProgressFile = Join-Path $ScriptDir "progress.txt"
$ArchiveDir = Join-Path $ScriptDir "archive"
$LastBranchFile = Join-Path $ScriptDir ".last-branch"

# Determine prompt file
if ([string]::IsNullOrWhiteSpace($PromptFile)) {
    if ($Tool -eq "claude") {
        $PromptFile = Join-Path $ScriptDir "CLAUDE.md"
        if (-not (Test-Path $PromptFile)) {
            $PromptFile = Join-Path $ScriptDir "prompt.md"
        }
    } else {
        $PromptFile = Join-Path $ScriptDir "prompt.md"
    }
}

# Archive previous run if branch changed
if ((Test-Path $PrdFile) -and (Test-Path $LastBranchFile)) {
    try {
        $prdContent = Get-Content $PrdFile -Raw | ConvertFrom-Json
        $currentBranch = $prdContent.branchName
        $lastBranch = (Get-Content $LastBranchFile -Raw).Trim()

        if ($currentBranch -and $lastBranch -and ($currentBranch -ne $lastBranch)) {
            $date = (Get-Date).ToString("yyyy-MM-dd")
            $folderName = $lastBranch -replace '^ralph/', ''
            $archiveFolder = Join-Path $ArchiveDir "$date-$folderName"

            Write-Host "Archiving previous run: $lastBranch" -ForegroundColor Yellow
            New-Item -ItemType Directory -Path $archiveFolder -Force | Out-Null
            if (Test-Path $PrdFile) { Copy-Item $PrdFile $archiveFolder -Force }
            if (Test-Path $ProgressFile) { Copy-Item $ProgressFile $archiveFolder -Force }
            Write-Host "   Archived to: $archiveFolder" -ForegroundColor Gray

            # Reset progress file
            Set-Content -Path $ProgressFile -Value @(
                "# Ralph Progress Log",
                "Started: $((Get-Date).ToString())",
                "---"
            ) -Encoding utf8
        }
    } catch {
        Write-Warning "Could not parse previous branch info: $_"
    }
}

# Track current branch
if (Test-Path $PrdFile) {
    try {
        $prdContent = Get-Content $PrdFile -Raw | ConvertFrom-Json
        if ($prdContent.branchName) {
            Set-Content -Path $LastBranchFile -Value $prdContent.branchName.Trim() -Encoding utf8
        }
    } catch {}
}

# Initialize progress file if needed
if (-not (Test-Path $ProgressFile)) {
    Set-Content -Path $ProgressFile -Value @(
        "# Ralph Progress Log",
        "Started: $((Get-Date).ToString())",
        "---"
    ) -Encoding utf8
}

Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host " Starting Ralph (PowerShell) - Tool: $Tool - Max iterations: $MaxIterations" -ForegroundColor Cyan
Write-Host "===============================================================" -ForegroundColor Cyan

for ($i = 1; $i -le $MaxIterations; $i++) {
    Write-Host ""
    Write-Host "---------------------------------------------------------------" -ForegroundColor Green
    Write-Host "  Ralph Iteration $i of $MaxIterations ($Tool)" -ForegroundColor Green
    Write-Host "---------------------------------------------------------------" -ForegroundColor Green

    $output = ""
    if ($Tool -eq "amp") {
        if (-not (Get-Command amp -ErrorAction SilentlyContinue)) {
            Write-Error "Amp CLI is not found in PATH."
            exit 1
        }
        $output = Get-Content $PromptFile -Raw | amp --dangerously-allow-all 2>&1
    } elseif ($Tool -eq "claude") {
        if (-not (Get-Command claude -ErrorAction SilentlyContinue)) {
            Write-Error "Claude CLI is not found in PATH."
            exit 1
        }
        $output = Get-Content $PromptFile -Raw | claude --dangerously-skip-permissions --print 2>&1
    } else {
        Write-Host "Tool '$Tool' selected. Ensure your Antigravity agent or IDE session is active on this workspace."
        exit 0
    }

    # Print output
    $output | ForEach-Object { Write-Host $_ }

    # Check for completion signal
    if ($output -match "<promise>COMPLETE</promise>") {
        Write-Host ""
        Write-Host "===============================================================" -ForegroundColor Green
        Write-Host "  Ralph completed all tasks!" -ForegroundColor Green
        Write-Host "  Completed at iteration $i of $MaxIterations" -ForegroundColor Green
        Write-Host "===============================================================" -ForegroundColor Green
        exit 0
    }

    Write-Host "Iteration $i complete. Continuing..." -ForegroundColor Yellow
    Start-Sleep -Seconds 2
}

Write-Host ""
Write-Host "Ralph reached max iterations ($MaxIterations) without completing all tasks." -ForegroundColor Red
Write-Host "Check $ProgressFile for status." -ForegroundColor Yellow
exit 1
