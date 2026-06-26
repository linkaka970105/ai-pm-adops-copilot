param(
  [string]$Model = "gpt-image-2",
  [int]$Retries = 3,
  [string[]]$Only = @(),
  [int]$ReferenceWidth = 1536
)

$ErrorActionPreference = "Stop"

function Get-LocalApiKey {
  $cfg = Get-Content "$env:USERPROFILE\.cli-proxy-api\config.yaml"
  $inKeys = $false
  foreach ($line in $cfg) {
    if ($line -match '^api-keys:\s*$') {
      $inKeys = $true
      continue
    }
    if ($inKeys -and $line -match '^[^\s#]') {
      break
    }
    if ($inKeys -and $line -match '^\s*-\s*[''"]?([^''"#\s]+)') {
      return $matches[1]
    }
  }
  throw "API key not found in config"
}

function Invoke-ImageGeneration {
  param(
    [string]$Name,
    [string]$Prompt,
    [string]$OutPath
  )

  $apiKey = Get-LocalApiKey
  $baseUrl = "http://127.0.0.1:8317/v1"
  $headers = @{ Authorization = "Bearer $apiKey"; "Content-Type" = "application/json" }
  $body = @{
    model = $Model
    prompt = $Prompt
    n = 1
    size = "1024x1024"
    quality = "low"
    output_format = "png"
  } | ConvertTo-Json -Depth 20 -Compress

  for ($i = 1; $i -le $Retries; $i++) {
    try {
      Write-Host "Generating $Name attempt $i/$Retries ..."
      $sw = [Diagnostics.Stopwatch]::StartNew()
      $image = Invoke-RestMethod -Method Post -Uri "$baseUrl/images/generations" -Headers $headers -Body $body -TimeoutSec 600
      $sw.Stop()
      [IO.File]::WriteAllBytes($OutPath, [Convert]::FromBase64String($image.data[0].b64_json))
      Add-Type -AssemblyName System.Drawing -ErrorAction SilentlyContinue
      $img = [System.Drawing.Image]::FromFile($OutPath)
      $dims = "$($img.Width)x$($img.Height)"
      $img.Dispose()
      Write-Host "Saved $OutPath elapsed=$([math]::Round($sw.Elapsed.TotalSeconds,1))s dimensions=$dims bytes=$((Get-Item $OutPath).Length)"
      return
    } catch {
      Write-Warning "$Name attempt $i failed: $($_.Exception.Message)"
      if ($i -eq $Retries) {
        throw
      }
      Start-Sleep -Seconds (20 * $i)
    }
  }
}

function Invoke-ImageEdit {
  param(
    [string]$Name,
    [string]$ReferencePath,
    [string]$Prompt,
    [string]$OutPath
  )

  $apiKey = Get-LocalApiKey
  $baseUrl = "http://127.0.0.1:8317/v1"

  for ($i = 1; $i -le $Retries; $i++) {
    $client = [System.Net.Http.HttpClient]::new()
    $client.Timeout = [TimeSpan]::FromSeconds(900)
    $client.DefaultRequestHeaders.Authorization = [System.Net.Http.Headers.AuthenticationHeaderValue]::new("Bearer", $apiKey)
    $form = [System.Net.Http.MultipartFormDataContent]::new()
    try {
      $form.Add([System.Net.Http.StringContent]::new($Model), "model")
      $form.Add([System.Net.Http.StringContent]::new($Prompt), "prompt")
      $form.Add([System.Net.Http.StringContent]::new("1024x1024"), "size")
      $form.Add([System.Net.Http.StringContent]::new("low"), "quality")
      $form.Add([System.Net.Http.StringContent]::new("png"), "output_format")
      $bytes = [IO.File]::ReadAllBytes($ReferencePath)
      $fileContent = [System.Net.Http.ByteArrayContent]::new($bytes)
      $fileContent.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::Parse("image/png")
      $form.Add($fileContent, "image", "reference.png")

      Write-Host "Editing $Name attempt $i/$Retries ..."
      $sw = [Diagnostics.Stopwatch]::StartNew()
      $response = $client.PostAsync("$baseUrl/images/edits", $form).GetAwaiter().GetResult()
      $raw = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult()
      $sw.Stop()
      if (-not $response.IsSuccessStatusCode) {
        throw "HTTP $([int]$response.StatusCode): $raw"
      }
      $json = $raw | ConvertFrom-Json
      [IO.File]::WriteAllBytes($OutPath, [Convert]::FromBase64String($json.data[0].b64_json))
      Add-Type -AssemblyName System.Drawing -ErrorAction SilentlyContinue
      $img = [System.Drawing.Image]::FromFile($OutPath)
      $dims = "$($img.Width)x$($img.Height)"
      $img.Dispose()
      Write-Host "Saved $OutPath elapsed=$([math]::Round($sw.Elapsed.TotalSeconds,1))s dimensions=$dims bytes=$((Get-Item $OutPath).Length)"
      return
    } catch {
      Write-Warning "$Name attempt $i failed: $($_.Exception.Message)"
      if ($i -eq $Retries) {
        throw
      }
      Start-Sleep -Seconds (20 * $i)
    } finally {
      $form.Dispose()
      $client.Dispose()
    }
  }
}

function Export-ReferencePng {
  param(
    [string]$DrawioName,
    [string]$ReferenceName
  )
  $referencePath = Join-Path $outDir $ReferenceName
  drawio -x -f png --width $ReferenceWidth -o $referencePath (Join-Path "03_prd\assets" $DrawioName) | Out-Null
  return (Resolve-Path $referencePath).Path
}

$outDir = Join-Path (Get-Location) "03_prd\assets\gpt_image"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$commonEditInstruction = @'
请参考输入图，重新绘制为更清晰、更适合中文 PRD 的专业流程图。必须尽量保留原图结构、节点含义和流程语义，不要新增无关节点。目标是优化观感：减少线框重叠、避免箭头穿过节点、增加留白、提升层级清晰度。白色背景，扁平化 SaaS 产品文档风格，圆角矩形，细描边，正交直角箭头，文字尽量准确可读。不要 3D，不要卡通，不要复杂背景。
'@

$diagrams = @(
  @{
    Name = "workflow"
    Mode = "edit"
    Drawio = "adops_attribution_workflow.drawio"
    Reference = "adops_attribution_workflow_reference.png"
    Out = "adops_attribution_workflow_gpt_image_2.png"
    Prompt = $commonEditInstruction + "`n特别要求：表现端到端业务流程。必须保留 session_init、pre_guard、LLM route candidate、schema_guard、rule_normalizer、workflow_dispatcher、固定核查清单、RAG Query 改写、Evidence Builder、场景诊断 LLM、delivery_guard、安全交付整理、反馈/Badcase、Judge AI 离线评测。Judge AI 只能在离线治理部分。"
  },
  @{
    Name = "swimlane-edit"
    Mode = "edit"
    Drawio = "adops_attribution_swimlane.drawio"
    Reference = "adops_attribution_swimlane_reference.png"
    Out = "adops_attribution_swimlane_gpt_image_2.png"
    Prompt = $commonEditInstruction + "`n特别要求：这是 5 条泳道图。用户泳道只保留提出问题和查看诊断卡；总控节点必须位于 Copilot 总控与规则层；RAG/工具节点必须位于 RAG、数据工具与证据系统层；Judge AI 只能在最底部离线评测后台。不要把离线虚线连接到 pre_guard、LLM 路由、schema_guard 或 rule_normalizer。"
  },
  @{
    Name = "case-flow"
    Mode = "edit"
    Drawio = "adops_attribution_case_flow.drawio"
    Reference = "adops_attribution_case_flow_reference.png"
    Out = "adops_attribution_case_flow_gpt_image_2.png"
    Prompt = $commonEditInstruction + "`n特别要求：表现真实案例流程：用户提问 MMP installs 比平台低 28% → 总控路由候选 LLM → Schema + 规则复算 → 固定归因 workflow → RAG Query 改写 → 只读工具查询 → Evidence Builder → 归因诊断 LLM → Delivery Guard → 内部诊断卡 → 用户反馈 → 离线治理。"
  },
  @{
    Name = "architecture"
    Mode = "generate"
    Out = "adops_attribution_architecture_gpt_image_2.png"
    Prompt = @'
生成一张白底中文 PRD 系统架构图，横向 16:9，扁平化 SaaS 文档风格，圆角矩形，细描边，正交箭头，不要线条穿框或重叠。
标题：AdOps Copilot 投放归因排障系统架构。
分四条水平泳道：1 英文业务前台，2 AI 工作流中台，3 数据 / RAG / 工具层，4 治理与运营后台。
主链路必须按顺序：Copilot Chat -> Prompt Runner 变量渲染+Trace -> Model Router Qwen/DeepSeek/GLM -> 总控 Workflow session/pre_guard/route -> Schema Guard JSON/enum/tool schema -> Rule Engine risk_final/confidence_final -> Workflow Dispatcher 固定步骤流转 -> 场景智能体 投放诊断/归因映射/规则回答 -> Delivery Guard 规则拦截+安全交付 -> 诊断结果卡。
数据层只作为场景智能体/Workflow 调用的信息供给：RAG Query Rewrite -> Hybrid Search + Rerank -> Tool Gateway 报表/MMP/Postback -> Evidence Store 统一 evidence object -> 权限与数据边界 RBAC/ABAC/字段脱敏。不要让 Delivery Guard 调用 Tool Gateway。
治理后台：知识库管理 -> Prompt 管理 -> Badcase 管理 -> 评测后台 + Judge AI。用底部虚线表示反馈闭环到知识库/Prompt/评测，不要接入在线主链路。
文字尽量清晰准确，节点数量不要过多，留白充足。
'@
  },
  @{
    Name = "state-machine"
    Mode = "generate"
    Out = "adops_attribution_state_machine_gpt_image_2.png"
    Prompt = @'
生成一张白底中文 PRD 智能体状态机图，横向 16:9，扁平化 SaaS 文档风格，圆角矩形，细描边，正交箭头，不要线条穿框或重叠。
标题：AdOps Copilot 智能体状态机。
主链路必须从左到右排列成两行以内：已接收(trace+context) -> 前置权限检查(pre_guard) -> LLM 路由候选(intent/entities) -> Schema Guard(JSON/enum/tool) -> 规则归一(risk/confidence/action) -> Workflow 分发(固定场景) -> 证据计划生成(固定核查清单) -> RAG/工具执行中(Query 改写+只读查询) -> 证据汇总中(Evidence Builder) -> 诊断生成中(场景 LLM) -> 安全检查中(delivery_guard) -> 可交付(内部诊断卡) -> 已反馈。
分支必须清楚且不要接错：Schema Guard 缺字段 -> 待用户补充；规则归一高风险或越权 -> 权限拒绝/范围外；安全检查中需要人工 -> 人工审核 -> 可交付；已反馈无效/漏采 -> Badcase 回流 -> Judge AI 离线评测。
Judge AI 只在离线分支，不能回到在线主链路。请减少交叉线，分支放在主链路下方，用虚线表示离线反馈。
'@
  }
)

foreach ($d in $diagrams) {
  if ($Only.Count -gt 0 -and $Only -notcontains $d.Name) {
    continue
  }
  if ($d.Mode -eq "generate") {
    Invoke-ImageGeneration -Name $d.Name -Prompt $d.Prompt -OutPath (Join-Path $outDir $d.Out)
  } else {
    $reference = Export-ReferencePng -DrawioName $d.Drawio -ReferenceName $d.Reference
    Invoke-ImageEdit -Name $d.Name -ReferencePath $reference -Prompt $d.Prompt -OutPath (Join-Path $outDir $d.Out)
  }
}
