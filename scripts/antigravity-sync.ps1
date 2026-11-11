<#
.SYNOPSIS
    Antigravity Project Synchronization Script
    Provisions all 655+ skills, 154+ agents, 142+ rules, 114+ workflows,
    Awesome-Claude-Code Catalog, Anthropic Official Skills, Superpowers, UI-Craft, Strix, SkillSpector,
    Context7, Addy Osmani Agent-Skills, ArmorAntigravity governance, CodeRabbit, Ralph loop, and MCP servers.
#>
param(
    [string]$ProjectPath = (Get-Location).Path,
    [switch]$AllProjects,
    [switch]$All
)

$runAll = $AllProjects.IsPresent -or $All.IsPresent
$setupScript = Join-Path $PSScriptRoot 'setup-project.ps1'
if (-not (Test-Path -LiteralPath $setupScript)) {
    $setupScript = Join-Path $env:USERPROFILE '.gemini\config\setup-project.ps1'
}

if (Test-Path -LiteralPath $setupScript) {
    & $setupScript -ProjectPath $ProjectPath -AllProjects:$runAll
} else {
    Write-Error "Antigravity setup script not found at $setupScript"
}
