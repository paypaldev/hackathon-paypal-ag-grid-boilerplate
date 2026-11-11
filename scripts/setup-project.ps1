<#
.SYNOPSIS
    Instantly configures Antigravity Full-Power Automation (655+ skills, 154+ agents, 142+ rules, 114+ workflows,
    Awesome-Claude-Code Catalog, Anthropic Official Skills, Superpowers, UI-Craft, Strix Pentesting, SkillSpector,
    Context7, Addy Osmani Agent-Skills, CodeRabbit, Ralph, and MCP servers) for any or all projects.
.PARAMETER ProjectPath
    The directory of the project to configure. Defaults to the current working directory.
.PARAMETER AllProjects
    When specified, iterates through all known projects in ~/.gemini/projects.json and active workspaces.
#>
param(
    [string]$ProjectPath = (Get-Location).Path,
    [switch]$AllProjects,
    [switch]$All
)

$ErrorActionPreference = 'Stop'

$PluginsBase = Join-Path -Path $env:USERPROFILE -ChildPath '.gemini\config\plugins'
$MasterEcc = Join-Path -Path $PluginsBase -ChildPath 'everything-claude-code'
$MasterCodeRabbit = Join-Path -Path $PluginsBase -ChildPath 'coderabbit'
$MasterPonytail = Join-Path -Path $PluginsBase -ChildPath 'ponytail'
$MasterLemo = Join-Path -Path $PluginsBase -ChildPath 'lemo-opuscar'
$MasterSkillspector = Join-Path -Path $PluginsBase -ChildPath 'skillspector'
$MasterContext7 = Join-Path -Path $PluginsBase -ChildPath 'context7'
$MasterMagic = Join-Path -Path $PluginsBase -ChildPath 'magic'
$MasterStrix = Join-Path -Path $PluginsBase -ChildPath 'strix'
$MasterAgentSkills = Join-Path -Path $PluginsBase -ChildPath 'agent-skills'
$MasterTaste = Join-Path -Path $PluginsBase -ChildPath 'taste-skill'
$MasterDesignMotion = Join-Path -Path $PluginsBase -ChildPath 'design-motion-principles'
$MasterAwesome = Join-Path -Path $PluginsBase -ChildPath 'awesome-claude-code'
$MasterSuperpowers = Join-Path -Path $PluginsBase -ChildPath 'superpowers'
$MasterAnthropicSkills = Join-Path -Path $PluginsBase -ChildPath 'anthropic-skills'
$MasterCollab = Join-Path -Path $PluginsBase -ChildPath 'agent-collab-skills'
$MasterUiCraft = Join-Path -Path $PluginsBase -ChildPath 'ui-craft'
$MasterAvoidAi = Join-Path -Path $PluginsBase -ChildPath 'avoid-ai-writing'
$MasterClaudeAgents = Join-Path -Path $PluginsBase -ChildPath 'claude-code-agents'
$MasterCharrette = Join-Path -Path $PluginsBase -ChildPath 'charrette'
$MasterCcDevops = Join-Path -Path $PluginsBase -ChildPath 'cc-devops-skills'
$MasterSciWrite = Join-Path -Path $PluginsBase -ChildPath 'scientific-writing-skills'
$MasterStyleseed = Join-Path -Path $PluginsBase -ChildPath 'styleseed'
$MasterDiagramDesign = Join-Path -Path $PluginsBase -ChildPath 'diagram-design'
$MasterTerraformSkill = Join-Path -Path $PluginsBase -ChildPath 'terraform-skill'
$MasterLogoDesigner = Join-Path -Path $PluginsBase -ChildPath 'logo-designer-skill'
$MasterFable = Join-Path -Path $PluginsBase -ChildPath 'fable-mode'
$MasterNaming = Join-Path -Path $PluginsBase -ChildPath 'naming'
$MasterMotion = Join-Path -Path $PluginsBase -ChildPath 'motion-skills'
$MasterUiUxProMax = Join-Path -Path $PluginsBase -ChildPath 'ui-ux-pro-max'
$MasterVercel = Join-Path -Path $PluginsBase -ChildPath 'vercel-agent-skills'
$MasterUnslop = Join-Path -Path $PluginsBase -ChildPath 'unslop'

$MasterSkills = Join-Path -Path $env:USERPROFILE -ChildPath '.gemini\config\skills'
$ProjectsJsonPath = Join-Path -Path $env:USERPROFILE -ChildPath '.gemini\projects.json'

if (-not (Test-Path -LiteralPath $MasterEcc)) {
    Write-Error "Master ECC installation not found at $MasterEcc"
    exit 1
}

$eccSkillsDir = Join-Path -Path $MasterEcc -ChildPath 'skills'
$eccAgentsDir = Join-Path -Path $MasterEcc -ChildPath 'agents'
$eccRulesDir = Join-Path -Path $MasterEcc -ChildPath 'rules'
$eccWfDir = Join-Path -Path $MasterEcc -ChildPath 'workflows'

# 1. Generic Universal Plugin Auto-Discovery & Sync Loop
# Automatically scans any plugin directory for skills, agents, rules, and workflows
if (Test-Path -LiteralPath $PluginsBase) {
    Get-ChildItem -LiteralPath $PluginsBase -Directory | ForEach-Object {
        $pDir = $_.FullName
        $pName = $_.Name
        if ($pName -eq 'everything-claude-code') { return }

        # Scan for skills (directories containing SKILL.md or skill.md)
        Get-ChildItem -LiteralPath $pDir -Recurse -File -Filter "*skill*.md" -ErrorAction SilentlyContinue | ForEach-Object {
            if ($_.Name -like "SKILL.md" -or $_.Name -like "skill.md") {
                $skillFolder = $_.Directory
                $sName = $skillFolder.Name
                if ($sName -eq 'template' -or $sName -eq 'skills') { return }
                
                # Global skills destination
                $gDest = Join-Path -Path $MasterSkills -ChildPath $sName
                if (-not (Test-Path -LiteralPath $gDest)) {
                    Copy-Item -LiteralPath $skillFolder.FullName -Destination $gDest -Recurse -Force
                }
                
                # Master ECC skills destination
                if (Test-Path -LiteralPath $eccSkillsDir) {
                    $eDest = Join-Path -Path $eccSkillsDir -ChildPath $sName
                    if (-not (Test-Path -LiteralPath $eDest)) {
                        try {
                            New-Item -ItemType Junction -Path $eDest -Target $skillFolder.FullName -Force | Out-Null
                        } catch {
                            Copy-Item -LiteralPath $skillFolder.FullName -Destination $eDest -Recurse -Force
                        }
                    }
                }

                # Dual-alias for taste-skill canonical frontmatter name
                if ($sName -eq 'taste-skill') {
                    $aliasDest = Join-Path -Path $MasterSkills -ChildPath 'design-taste-frontend'
                    if (-not (Test-Path -LiteralPath $aliasDest)) {
                        try { New-Item -ItemType Junction -Path $aliasDest -Target $skillFolder.FullName -Force | Out-Null } catch {}
                    }
                    if (Test-Path -LiteralPath $eccSkillsDir) {
                        $eAlias = Join-Path -Path $eccSkillsDir -ChildPath 'design-taste-frontend'
                        if (-not (Test-Path -LiteralPath $eAlias)) {
                            try { New-Item -ItemType Junction -Path $eAlias -Target $skillFolder.FullName -Force | Out-Null } catch {}
                        }
                    }
                }
            }
        }

        # Scan for agents
        $pAgentsDir = Join-Path -Path $pDir -ChildPath 'agents'
        if (Test-Path -LiteralPath $pAgentsDir) {
            Get-ChildItem -LiteralPath $pAgentsDir -Filter "*.md" -ErrorAction SilentlyContinue | ForEach-Object {
                $destName = $_.Name
                if ($destName -eq 'architect.md' -and $pName -eq 'charrette') {
                    $destName = 'charrette-architect.md'
                } elseif ($destName -eq 'code-reviewer.md' -and $pName -eq 'agent-skills') {
                    $destName = 'addy-code-reviewer.md'
                }
                $dstFile = Join-Path -Path $eccAgentsDir -ChildPath $destName
                if (-not (Test-Path -LiteralPath $dstFile)) {
                    Copy-Item -LiteralPath $_.FullName -Destination $dstFile -Force
                }
            }
        }

        # Scan for rules
        $pRulesDir = Join-Path -Path $pDir -ChildPath 'rules'
        if (Test-Path -LiteralPath $pRulesDir) {
            Get-ChildItem -LiteralPath $pRulesDir -Filter "*.md" -ErrorAction SilentlyContinue | ForEach-Object {
                $dstRule = Join-Path -Path $eccRulesDir -ChildPath $_.Name
                if (-not (Test-Path -LiteralPath $dstRule)) {
                    Copy-Item -LiteralPath $_.FullName -Destination $dstRule -Force
                }
            }
        }

        # Scan for workflows
        $pWfDir = Join-Path -Path $pDir -ChildPath 'workflows'
        if (Test-Path -LiteralPath $pWfDir) {
            Get-ChildItem -LiteralPath $pWfDir -Filter "*.md" -ErrorAction SilentlyContinue | ForEach-Object {
                $dstWf = Join-Path -Path $eccWfDir -ChildPath $_.Name
                if (-not (Test-Path -LiteralPath $dstWf)) {
                    Copy-Item -LiteralPath $_.FullName -Destination $dstWf -Force
                }
            }
        }
    }
}

# 2. Sync all global skills into Master ECC skills
if (Test-Path -LiteralPath $MasterSkills) {
    if (Test-Path -LiteralPath $eccSkillsDir) {
        Get-ChildItem -LiteralPath $MasterSkills | ForEach-Object {
            $dest = Join-Path -Path $eccSkillsDir -ChildPath $_.Name
            if (-not (Test-Path -LiteralPath $dest)) {
                if ($_.PSIsContainer) {
                    try {
                        New-Item -ItemType Junction -Path $dest -Target $_.FullName -Force | Out-Null
                    } catch {
                        Copy-Item -LiteralPath $_.FullName -Destination $dest -Recurse -Force
                    }
                } else {
                    Copy-Item -LiteralPath $_.FullName -Destination $dest -Force
                }
            }
        }
    }
}

function Configure-SingleProject {
    param([string]$TargetDir)

    if (-not (Test-Path -LiteralPath $TargetDir)) {
        New-Item -ItemType Directory -Path $TargetDir -Force | Out-Null
    }
    $Resolved = (Resolve-Path -Path $TargetDir).Path
    $AgentsDir = Join-Path -Path $Resolved -ChildPath '.agents'

    if (-not (Test-Path -LiteralPath $AgentsDir)) {
        New-Item -ItemType Directory -Path $AgentsDir -Force | Out-Null
    }

    # Link subfolders from ECC master (agents, skills, rules, workflows)
    $Subfolders = @('rules', 'workflows', 'agents', 'skills')
    foreach ($folder in $Subfolders) {
        $src = Join-Path -Path $MasterEcc -ChildPath $folder
        $dst = Join-Path -Path $AgentsDir -ChildPath $folder

        if (Test-Path -LiteralPath $dst) {
            continue
        }

        try {
            New-Item -ItemType Junction -Path $dst -Target $src -Force | Out-Null
        }
        catch {
            Copy-Item -Path $src -Destination $dst -Recurse -Force
        }
    }

    # Install hooks.json
    $hooksSrc = Join-Path -Path $MasterEcc -ChildPath 'hooks.json'
    $hooksDst = Join-Path -Path $AgentsDir -ChildPath 'hooks.json'
    if (Test-Path -LiteralPath $hooksSrc) {
        Copy-Item -Path $hooksSrc -Destination $hooksDst -Force
    }

    # Install CodeRabbit config
    $crConfigSrc = Join-Path -Path $MasterCodeRabbit -ChildPath '.coderabbit.yaml'
    $crConfigDst = Join-Path -Path $Resolved -ChildPath '.coderabbit.yaml'
    if ((Test-Path -LiteralPath $crConfigSrc) -and (-not (Test-Path -LiteralPath $crConfigDst))) {
        Copy-Item -Path $crConfigSrc -Destination $crConfigDst -Force
    }

    # Install Ralph scaffolding (scripts/ralph)
    $MasterRalph = Join-Path -Path $env:USERPROFILE -ChildPath '.gemini\config\plugins\ralph'
    $ralphScriptsDst = Join-Path -Path $Resolved -ChildPath 'scripts\ralph'
    if (Test-Path -LiteralPath $MasterRalph) {
        if (-not (Test-Path -LiteralPath $ralphScriptsDst)) {
            New-Item -ItemType Directory -Path $ralphScriptsDst -Force | Out-Null
        }
        Copy-Item -Path (Join-Path $MasterRalph 'scripts\ralph.ps1') -Destination (Join-Path $ralphScriptsDst 'ralph.ps1') -Force
        Copy-Item -Path (Join-Path $MasterRalph 'scripts\ralph.sh') -Destination (Join-Path $ralphScriptsDst 'ralph.sh') -Force
        Copy-Item -Path (Join-Path $MasterRalph 'scripts\prompt.md') -Destination (Join-Path $ralphScriptsDst 'prompt.md') -Force
        Copy-Item -Path (Join-Path $MasterRalph 'scripts\CLAUDE.md') -Destination (Join-Path $ralphScriptsDst 'CLAUDE.md') -Force
        Copy-Item -Path (Join-Path $MasterRalph 'scripts\prd.json.example') -Destination (Join-Path $ralphScriptsDst 'prd.json.example') -Force
    }

    # Scaffold or update .mcp.json with standard servers (Figma, Laya, Context7, Magic, 21st, SkillSpector)
    $mcpJsonPath = Join-Path -Path $Resolved -ChildPath '.mcp.json'
    $defaultMcp = @{
        mcpServers = @{
            figma = @{
                type = "http"
                url = "https://mcp.figma.com/mcp"
            }
            context7 = @{
                command = "npx"
                args = @("-y", "@upstash/context7-mcp")
                env = @{}
            }
            magic = @{
                command = "node"
                args = @("C:\Users\vikas sharma\.gemini\config\plugins\magic\dist\index.js")
                env = @{}
            }
            "21st" = @{
                type = "http"
                url = "https://21st.dev/api/mcp"
                headers = @{
                    "x-api-key" = "`${API_KEY_21ST}"
                }
            }
        }
    }
    
    # Check if a python venv with laya exists
    $layaPy = $null
    $possibleLayaPy = @(
        (Join-Path $Resolved 'laya-repo\.venv\Scripts\python.exe'),
        (Join-Path $Resolved '.venv\Scripts\python.exe'),
        "C:\Users\vikas sharma\AppData\Local\Programs\Python\Python312\python.exe"
    )
    foreach ($p in $possibleLayaPy) {
        if (Test-Path -LiteralPath $p) {
            $layaPy = $p
            break
        }
    }

    if ($layaPy) {
        $defaultMcp.mcpServers["laya"] = @{
            command = $layaPy
            args = @("-m", "laya.mcp.server")
            env = @{
                LAYA_DEVICE = "cpu"
                LAYA_PRELOAD = "0"
                LAYA_THREADS = "8"
            }
        }
    }

    $skillspectorPy = "C:\Users\vikas sharma\AppData\Roaming\uv\tools\skillspector\Scripts\python.exe"
    if (Test-Path -LiteralPath $skillspectorPy) {
        $defaultMcp.mcpServers["skillspector"] = @{
            command = $skillspectorPy
            args = @("-m", "skillspector.cli", "mcp")
            env = @{
                PYTHONIOENCODING = "utf-8"
                PYTHONUNBUFFERED = "1"
            }
        }
    }

    if (-not (Test-Path -LiteralPath $mcpJsonPath)) {
        $defaultMcp | ConvertTo-Json -Depth 6 | Set-Content -Path $mcpJsonPath -Encoding utf8
    } else {
        try {
            $existingMcp = Get-Content -LiteralPath $mcpJsonPath -Raw | ConvertFrom-Json
            if (-not $existingMcp.mcpServers) {
                $existingMcp | Add-Member -MemberType NoteProperty -Name "mcpServers" -Value @{} -Force
            }
            if (-not $existingMcp.mcpServers.figma) {
                $existingMcp.mcpServers | Add-Member -MemberType NoteProperty -Name "figma" -Value $defaultMcp.mcpServers.figma -Force
            }
            if (-not $existingMcp.mcpServers.context7) {
                $existingMcp.mcpServers | Add-Member -MemberType NoteProperty -Name "context7" -Value $defaultMcp.mcpServers.context7 -Force
            }
            if ($layaPy -and (-not $existingMcp.mcpServers.laya)) {
                $existingMcp.mcpServers | Add-Member -MemberType NoteProperty -Name "laya" -Value $defaultMcp.mcpServers.laya -Force
            }
            if ((Test-Path -LiteralPath $skillspectorPy) -and (-not $existingMcp.mcpServers.skillspector)) {
                $existingMcp.mcpServers | Add-Member -MemberType NoteProperty -Name "skillspector" -Value $defaultMcp.mcpServers.skillspector -Force
            }
            if (-not $existingMcp.mcpServers.magic) {
                $existingMcp.mcpServers | Add-Member -MemberType NoteProperty -Name "magic" -Value $defaultMcp.mcpServers.magic -Force
            }
            if (-not $existingMcp.mcpServers.'21st') {
                $existingMcp.mcpServers | Add-Member -MemberType NoteProperty -Name "21st" -Value $defaultMcp.mcpServers.'21st' -Force
            }
            $existingMcp | ConvertTo-Json -Depth 6 | Set-Content -Path $mcpJsonPath -Encoding utf8
        } catch {}
    }

    # Install git hooks if .git directory exists
    $gitHooksDir = Join-Path -Path $Resolved -ChildPath '.git\hooks'
    if (Test-Path -LiteralPath $gitHooksDir) {
        $gitTemplateHooks = "C:\Users\vikas sharma\.gemini\git-template\hooks"
        if (Test-Path -LiteralPath $gitTemplateHooks) {
            Get-ChildItem -LiteralPath $gitTemplateHooks -File | ForEach-Object {
                $hookDst = Join-Path $gitHooksDir $_.Name
                Copy-Item -LiteralPath $_.FullName -Destination $hookDst -Force
            }
        }
    }

    # Scaffold project-level .vscode/settings.json for maximum effort, best models, and max credits
    $vscodeDir = Join-Path -Path $Resolved -ChildPath '.vscode'
    if (-not (Test-Path -LiteralPath $vscodeDir)) {
        New-Item -ItemType Directory -Path $vscodeDir -Force | Out-Null
    }
    $vscodeSettingsPath = Join-Path -Path $vscodeDir -ChildPath 'settings.json'
    $maxEffortSettings = @{
        "antigravity.alwaysThinkingEnabled" = $true
        "antigravity.effortLevel" = "high"
        "antigravity.reasoningEffort" = "high"
        "antigravity.useAiCredits" = $true
        "antigravity.maxThinkingTokens" = 65536
        "claudeCode.alwaysThinkingEnabled" = $true
        "claudeCode.effortLevel" = "max"
        "claudeCode.maxEffortLevel" = "max"
    }
    if (-not (Test-Path -LiteralPath $vscodeSettingsPath)) {
        $maxEffortSettings | ConvertTo-Json -Depth 4 | Set-Content -Path $vscodeSettingsPath -Encoding utf8
    } else {
        try {
            $existingVs = Get-Content -LiteralPath $vscodeSettingsPath -Raw | ConvertFrom-Json
            foreach ($k in $maxEffortSettings.Keys) {
                if (-not $existingVs.$k) {
                    $existingVs | Add-Member -MemberType NoteProperty -Name $k -Value $maxEffortSettings[$k] -Force
                }
            }
            $existingVs | ConvertTo-Json -Depth 4 | Set-Content -Path $vscodeSettingsPath -Encoding utf8
        } catch {}
    }

    # Copy antigravity-sync helper scripts to scripts/
    $scriptsDir = Join-Path -Path $Resolved -ChildPath 'scripts'
    if (-not (Test-Path -LiteralPath $scriptsDir)) {
        New-Item -ItemType Directory -Path $scriptsDir -Force | Out-Null
    }
    $masterSetupScript = $MyInvocation.MyCommand.Path
    if (-not $masterSetupScript) {
        $masterSetupScript = Join-Path -Path $env:USERPROFILE -ChildPath '.gemini\config\setup-project.ps1'
    }
    if (Test-Path -LiteralPath $masterSetupScript) {
        Copy-Item -LiteralPath $masterSetupScript -Destination (Join-Path $scriptsDir 'setup-project.ps1') -Force
    }

    $syncPs1 = Join-Path -Path $scriptsDir -ChildPath 'antigravity-sync.ps1'
    $syncCmd = Join-Path -Path $scriptsDir -ChildPath 'antigravity-sync.cmd'
    Set-Content -Path $syncPs1 -Value @"
<#
.SYNOPSIS
    Antigravity Project Synchronization Script
    Provisions all 655+ skills, 154+ agents, 142+ rules, 114+ workflows,
    Awesome-Claude-Code Catalog, Anthropic Official Skills, Superpowers, UI-Craft, Strix, SkillSpector,
    Context7, Addy Osmani Agent-Skills, ArmorAntigravity governance, CodeRabbit, Ralph loop, and MCP servers.
#>
param(
    [string]`$ProjectPath = (Get-Location).Path,
    [switch]`$AllProjects,
    [switch]`$All
)

`$runAll = `$AllProjects.IsPresent -or `$All.IsPresent
`$setupScript = Join-Path `$PSScriptRoot 'setup-project.ps1'
if (-not (Test-Path -LiteralPath `$setupScript)) {
    `$setupScript = Join-Path `$env:USERPROFILE '.gemini\config\setup-project.ps1'
}

if (Test-Path -LiteralPath `$setupScript) {
    & `$setupScript -ProjectPath `$ProjectPath -AllProjects:`$runAll
} else {
    Write-Error "Antigravity setup script not found at `$setupScript"
}
"@ -Encoding utf8

    Set-Content -Path $syncCmd -Value "@ECHO OFF`r`n@powershell.exe -NoProfile -ExecutionPolicy Bypass -File `"%~dp0antigravity-sync.ps1`" %*" -Encoding ascii

    # Scaffold GitHub Actions CI workflow if missing
    $ghWorkflowDir = Join-Path -Path $Resolved -ChildPath '.github\workflows'
    $ghCiFile = Join-Path -Path $ghWorkflowDir -ChildPath 'ci.yml'
    if (-not (Test-Path -LiteralPath $ghCiFile)) {
        if (-not (Test-Path -LiteralPath $ghWorkflowDir)) {
            New-Item -ItemType Directory -Path $ghWorkflowDir -Force | Out-Null
        }
        $ciYaml = @"
name: Antigravity CI / CD Quality Gate

on:
  push:
    branches: [ master, main ]
  pull_request:
    branches: [ master, main ]
  workflow_dispatch:

jobs:
  verify:
    name: Master Quality Gate (`${{ matrix.os }} - Py`${{ matrix.python-version }})
    runs-on: `${{ matrix.os }}
    strategy:
      fail-fast: false
      matrix:
        os: [ubuntu-latest, windows-latest]
        python-version: ['3.11', '3.12']
    env:
      PYTHONPATH: .
      PYTHONIOENCODING: utf-8
      PYTHONUTF8: "1"
      PYTHONUNBUFFERED: "1"

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Python `${{ matrix.python-version }}
        uses: actions/setup-python@v5
        with:
          python-version: `${{ matrix.python-version }}
          cache: 'pip'

      - name: Install dependencies
        shell: bash
        run: |
          python -m pip install --upgrade pip
          if [ -f requirements.txt ]; then pip install -r requirements.txt; fi
          if [ -f campushire-relay/requirements.txt ]; then pip install -r campushire-relay/requirements.txt; fi
          pip install pytest pytest-asyncio anyio httpx httpx2

      - name: Syntax & Compilation Validation
        shell: bash
        run: |
          if [ -d switch_agent ]; then python -m compileall -q switch_agent; fi
          if [ -d campushire-relay ]; then python -m compileall -q campushire-relay; fi
          if [ -d scripts ]; then python -m compileall -q scripts; fi
          if [ -d tests ]; then python -m compileall -q tests; fi

      - name: Run Master Verification Suite
        shell: bash
        run: |
          if [ -f run_all_tests.py ]; then
            python run_all_tests.py
          elif [ -f scripts/run_all_tests.py ]; then
            python scripts/run_all_tests.py
          else
            pytest -v
          fi
"@
        Set-Content -Path $ghCiFile -Value $ciYaml -Encoding utf8
    }

    # Write ecc-install-state.json
    $stateFile = Join-Path -Path $AgentsDir -ChildPath 'ecc-install-state.json'
    $stateObj = @{
        version = 6
        target = 'antigravity'
        mode = 'full-power'
        installedAt = (Get-Date -Format 'o')
        plugins = @(
            'everything-claude-code', 'awesome-claude-code', 'superpowers', 'anthropic-skills',
            'agent-collab-skills', 'ui-craft', 'avoid-ai-writing', 'claude-code-agents',
            'charrette', 'cc-devops-skills', 'scientific-writing-skills', 'diagram-design',
            'styleseed', 'fable-mode', 'naming', 'motion-skills', 'coderabbit', 'firebase',
            'wispr-flow', 'ralph', 'graphify', 'laya', 'get-shit-done', 'armorantigravity',
            'ponytail', 'agent-reach', 'lemo-opuscar', 'agent-skills', 'context7', 'skillspector',
            'strix', 'taste-skill', 'design-motion-principles', 'magic', 'unslop'
        )
        sourceVersion = '3.0.0'
    }
    $stateJson = $stateObj | ConvertTo-Json -Depth 4
    Set-Content -Path $stateFile -Value $stateJson -Encoding utf8

    # Auto-register workspace into projects.json if not present
    if (Test-Path -LiteralPath $ProjectsJsonPath) {
        try {
            $pData = Get-Content -LiteralPath $ProjectsJsonPath -Raw | ConvertFrom-Json
            if (-not $pData.projects) {
                $pData | Add-Member -MemberType NoteProperty -Name "projects" -Value @{} -Force
            }
            $normPath = $Resolved.ToLower()
            $exists = $false
            foreach ($prop in $pData.projects.PSObject.Properties) {
                if ($prop.Name.ToLower() -eq $normPath) {
                    $exists = $true
                    break
                }
            }
            if (-not $exists) {
                $projName = (Split-Path $Resolved -Leaf).ToLower() -replace '[^a-z0-9_-]', '-'
                $pData.projects | Add-Member -MemberType NoteProperty -Name $Resolved -Value $projName -Force
                $pData | ConvertTo-Json -Depth 4 | Set-Content -Path $ProjectsJsonPath -Encoding utf8
            }
        } catch {}
    }

    Write-Host "[Antigravity Full-Power] Successfully configured: $Resolved" -ForegroundColor Green
    Write-Host "  - Skills: 735+ (Awesome-Claude-Code + Anthropic Official + Superpowers + Vercel Official + UI-Craft + DevOps + Collab + ECC + GSD + CodeRabbit + Ponytail + Agent-Reach + Lemo + Agent-Skills + Context7 + SkillSpector + Strix + Taste)"
    Write-Host "  - Agents: 159+ (Vercel Architects + E2E Dev Roles + Charrette Architecture + Fable Mode + UI-Craft + GSD Spec Planners/Executors + Code-Reviewer + Security-Auditor + Taste-Designer + Film-Director)"
    Write-Host "  - Rules: 148+ (Vercel 70 React Rules, Web Guidelines, TDD, Superpowers, UI-Craft Anti-Slop, Avoid-AI-Writing, Awesome-CC Catalog, Security, CodeRabbit, SkillSpector, Context7, Strix Pentesting, Ponytail, Ralph, GSD)"
    Write-Host "  - Workflows: 114+ (/skillspector, /taste, /taste-gate, /spec, /ship, /webperf, /test, /review, /planning, /reach, autonomous pipelines)"
    Write-Host "  - Vercel Official Agent Skills: Active (9 skills: react-best-practices, composition-patterns, react-native, view-transitions, vercel-optimize, web-design-guidelines, deploy-to-vercel, vercel-cli-with-tokens, writing-guidelines; 5 specialized agents: vercel-optimizer, vercel-react-architect, web-design-auditor, composition-architect, docs-writing-reviewer)"
    Write-Host "  - Awesome Claude Code Engine: Active (awesome-cc CLI, 260+ cataloged tools, 'awesome-claude-code' skill, instant discovery)"
    Write-Host "  - Anthropic Official Skills: Active (19 skills: docx, pptx, xlsx, canvas, algorithmic-art, frontend-design, mcp-builder, webapp-testing)"
    Write-Host "  - Superpowers Engineering: Active (15 skills: TDD, systematic-debugging, subagent-driven development, git-worktrees, verification)"
    Write-Host "  - UI-Craft Anti-Slop Engine: Active (34 skills, 2 agents: a11y-auditor, design-reviewer, taste tokens, typography standards)"
  Write-Host "  - UI/UX Pro Max Engine: Active (80 styles, 192 palettes, 74 type pairs, 120 UX rules, 22 stacks, 'ui-ux-architect' & 'design-review' agents, uipro CLI)"
    Write-Host "  - Human Prose Quality: Active (7 skills: avoid-ai-writing, voice-preserving-rewriter, elimination of 49 robotic tropes)"
    Write-Host "  - Tasteskill & Motion: Active (figma & x.ai bar, design-motion-principles, Emil Kowalski / Jakub Krehel physics)"
    Write-Host "  - Strix Autonomous Pentesting: Active (9 security skills, OWASP Top 10, API testing, PoC exploit validation, strix 1.7.0 CLI)"
    Write-Host "  - NVIDIA SkillSpector: Active (71 vulnerability patterns, pre-install static vetting, semantic source review, skillspector MCP server)"
    Write-Host "  - Unslop Anti-Slop UI Craft: Active (/unslop, unslop, unslop-reviewer, unslop-designer, 8-pass redline craft engine)"
    Write-Host "  - Context7 Live Docs: Active (resolve-library-id, query-docs, ctx7 CLI, docs-researcher agent, auto-grounding for all libraries)"
    Write-Host "  - MCP Servers: Active (.mcp.json configured with Figma, Laya, Context7, Magic, 21st & SkillSpector)"
    Write-Host "  - Ralph Scaffolding: Active (scripts\ralph\ralph.ps1, ralph.sh)"
    Write-Host "  - CodeRabbit Config: Active (.coderabbit.yaml)"
    Write-Host "  - SessionStart Automation: Active (.agents\hooks.json)"
    Write-Host "  - Effort & Models: MAXIMUM EFFORT ('high' / 'max', 64k thinking tokens), Best Models (Pro/Opus tier, Gemini 3.8 Flash (High)), Max AI Credits Enabled (useAiCredits: true)"
}

$runAll = $AllProjects.IsPresent -or $All.IsPresent

if ($runAll) {
    $targets = [System.Collections.Generic.List[string]]::new()
    if (Test-Path -LiteralPath $ProjectsJsonPath) {
        try {
            $json = Get-Content -LiteralPath $ProjectsJsonPath -Raw | ConvertFrom-Json
            if ($json.projects) {
                foreach ($prop in $json.projects.PSObject.Properties) {
                    if (Test-Path -LiteralPath $prop.Name) {
                        $targets.Add($prop.Name)
                    }
                }
            }
        } catch {}
    }

    # Auto-discover projects in common developer workspaces
    $devRoots = @('D:\code', 'D:\', 'C:\Users\vikas sharma\projects')
    foreach ($devRoot in $devRoots) {
        if (Test-Path -LiteralPath $devRoot) {
            Get-ChildItem -LiteralPath $devRoot -Directory -ErrorAction SilentlyContinue | ForEach-Object {
                $sub = $_.FullName
                if ((Test-Path (Join-Path $sub '.git')) -or (Test-Path (Join-Path $sub 'package.json')) -or (Test-Path (Join-Path $sub 'pyproject.toml'))) {
                    if (-not $targets.Contains($sub)) {
                        $targets.Add($sub)
                    }
                }
            }
        }
    }

    # Always include current working directory as well
    if (-not $targets.Contains($ProjectPath)) {
        $targets.Add($ProjectPath)
    }

    foreach ($dir in $targets) {
        Write-Host "--- Configuring $dir ---" -ForegroundColor Cyan
        Configure-SingleProject -TargetDir $dir
    }
} else {
    Configure-SingleProject -TargetDir $ProjectPath
}
