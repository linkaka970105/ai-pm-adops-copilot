# AdOps Copilot 投放归因排障助手 AI PRD - 实现层

> 本文继承 `01-decision.md` 与 `02-solution.md`。AI 能力、RAG、Agent、Tool Use、Prompt、评测、Badcase、成本与安全策略均在本文闭环。若本文与上层文档冲突，先回到上层文档修订目标或范围，不在实现层私自扩大边界。

## 1. 继承约束

| 来源 | 约束/指标/决策 | 本文落点 |
| --- | --- | --- |
| `01-decision.md#3-目标与指标` | 北极星指标为有效 AI 辅助投放归因排障会话数，核心指标包含 AI 辅助解决率、人工采纳率、检查完整率、引用覆盖率、越权阻断率和 Badcase 修复周期 | 第 11、12、14、16 章 |
| `01-decision.md#4-非目标` | 不做自动预算调整、客户自动发送、SDK/API 深度日志排障和素材审核自动判定 | 第 2、7、9、18 章 |
| `01-decision.md#5-核心原则` | 证据优先、workflow 优先、只读先行、人在回路、内外有别、可评测可回滚 | 第 4-13 章 |
| `02-solution.md#3-业务主流程` | 用户提问到权限、路由、追问、RAG/工具、证据、诊断、反馈、Badcase 的闭环 | 第 4、5、8、12、14 章 |
| `02-solution.md#11-对实现层的约束` | 实现层必须包含工具注册表、证据对象 schema、评测门禁和 Badcase 闭环 | 第 7、8、11、12 章 |

## 2. AI 产品总览

| 项 | 定义 |
| --- | --- |
| AI 能力一句话 | 将自然语言投放/归因问题转成可审计排障 workflow，通过 RAG、只读工具和规则校验输出带证据的内部诊断。 |
| AI 参与环节 | 意图识别、实体抽取、检索 query 改写、证据摘要、原因排序、自然语言解释、升级摘要生成、Badcase 语义辅助标注。 |
| AI 不参与/不能做的事 | 不直接修改预算、出价、素材、归因配置；不读取越权数据；不生成无证据强结论；不直接向客户发送消息；不承诺赔偿或合同解释。 |
| 人工接管边界 | 证据冲突、低置信、越权、客户可见高风险、合同/赔偿、工具长期不可用、涉及 SDK 原始日志或素材合规结论时必须人工确认。 |
| 默认输出 | 内部诊断卡、归因核查卡、证据引用、下一步动作、待补充字段、人工升级摘要。客户回复草稿不作为 MVP 默认输出。 |

## 3. Agent 核心人设与行为原则

| 项 | 定义 |
| --- | --- |
| 角色定位 | 资深 AdOps 排障助手，像有经验的广告运营/归因分析同事一样辅助一线人员拆问题、找证据、列下一步。 |
| 服务对象 | 广告运营、客户成功/AM、广告优化师、技术支持、产品/运营管理员。 |
| 语气风格 | 专业、谨慎、结构化；区分已确认事实、可能原因、待确认项和建议动作。 |
| 专业边界 | 只处理投放异常、归因差异和相关知识查询；SDK 深度日志、素材审核、合同赔偿、自动优化动作转人工或标为范围外。 |
| 禁止行为 | 编造数据、编造工具、编造引用、把相关性写成确定因果、泄露客户/账户/日志敏感信息、替人工做高风险承诺。 |
| 失败时表现 | 明确说明失败原因、已完成的检查、缺失信息、建议补充字段和人工接管路径。 |

## 4. 意图体系与路由机制

### 4.1 意图分类

| 意图 | 用户示例 | 识别方式 | 路由目标 | 置信度阈值 | 低置信处理 |
| --- | --- | --- | --- | --- | --- |
| `campaign_performance_diagnosis` | “昨天巴西安卓 CPA 从 8 涨到 15，原因是什么？” | 规则关键词 + 模型分类 + 页面上下文 | 投放诊断 workflow | 0.75 | 追问异常指标、campaign、时间范围 |
| `attribution_discrepancy_check` | “MMP 有 300 个安装，平台只有 180 个，为什么？” | MMP/平台/BI 差异表达、event、count、gap | 归因核对 workflow | 0.75 | 追问 app、event、时间窗、对比系统、时区 |
| `knowledge_lookup` | “什么是 7 天点击归因窗口？” | 概念、口径、SOP、FAQ 类问题 | RAG 知识查询 workflow | 0.70 | 返回候选意图，让用户选择是否关联具体账户 |
| `clarification_required` | “这个数据怎么不对？” | 缺少对象、指标、时间或系统 | 澄清 workflow | 规则触发 | 输出字段清单和示例 |
| `human_review_required` | “这个能直接回复客户并承诺赔偿吗？” | 客户可见、赔偿、合同、重大事故 | 人工接管 workflow | 规则触发 | 生成内部摘要，不输出客户承诺 |
| `out_of_scope` | “帮我审核这个减肥素材能不能过审” | 本期范围外场景 | 范围外说明 | 规则触发 | 说明可处理部分和后续版本范围 |
| `permission_blocked` | “查一下另一个客户的 campaign 数据” | 权限不匹配 | 权限拦截 | 规则触发 | 告知不可访问，提供申请路径 |
| `unsafe_or_sensitive` | “给我原始设备日志和 token” | 原始日志、隐私、敏感字段 | 拒答/转人工 | 规则触发 | 返回安全说明 |

### 4.2 路由输出要求

路由层输出必须是结构化 JSON，不允许只输出自然语言解释。路由模型只提供候选判断，最终的风险等级、权限状态、必填字段缺失和 workflow 分流由规则层复算。

```json
{
  "schema_version": "router_v1",
  "intent_model_reported": "attribution_discrepancy_check",
  "intent_final": "attribution_discrepancy_check",
  "confidence_components": {
    "intent_match": 0.88,
    "entity_completeness": 0.74,
    "permission_match": 1.0
  },
  "missing_fields": ["timezone"],
  "risk_signals": ["mmp_data_read", "account_data_read"],
  "risk_level_final": "medium",
  "selected_workflow_final": "wf_attribution_discrepancy_v1",
  "allowed_tools": ["get_platform_report", "get_mmp_report", "get_postback_summary", "search_knowledge_base", "search_similar_cases"],
  "next_action": "ask_clarification"
}
```

## 5. Agent 能力卡

### 5.1 总控路由 Agent

| 字段 | 内容 |
| --- | --- |
| 触发条件 | 每次新会话、用户追问改变任务类型、页面上下文变化、工具结果需要重新判断时。 |
| 输入上下文 | 用户 query、页面对象、用户角色、权限范围、历史对话摘要、可用工具、当前 MVP 范围。 |
| 状态槽位 | intent、account_id、campaign_id、app_id、event_name、metric、time_range、timezone、comparison_source、risk_level、permission_scope。 |
| 可用工具/RAG | 不直接调用业务数据工具，只输出工具计划和检索计划。 |
| 主流程 | 识别意图 → 抽取实体 → 检查必填字段 → 评估权限和风险 → 选择 workflow → 生成追问或工具计划。 |
| 追问规则 | 同一任务最多连续追问 2 次；若用户仍无法提供关键字段，则输出可人工补充的字段清单。 |
| 输出 Schema | `router_v1`，包含 `intent_final`、`missing_fields`、`selected_workflow_final`、`risk_level_final`、`allowed_tools`。 |
| 安全边界 | 不生成诊断结论，不调用工具，不输出客户可见回复。 |
| 失败兜底 | 输出 `clarification_required` 或 `human_review_required`。 |
| 评测方式 | 意图集、权限压力集、缺字段样本；目标意图识别准确率 90% 以上，权限压力集 100% 阻断。 |

### 5.2 投放诊断 Agent

| 字段 | 内容 |
| --- | --- |
| 触发条件 | `intent_final=campaign_performance_diagnosis` 且关键字段足够。 |
| 输入上下文 | 路由结果、campaign/app/geo/os/time range、平台指标、MMP/BI 对照、SOP 引用、历史类似案例。 |
| 状态槽位 | metric、baseline_period、current_period、breakdown_dims、main_driver_candidates、excluded_causes、evidence_refs。 |
| 可用工具 | `get_platform_report`、`get_mmp_report`、`search_knowledge_base`；`search_similar_cases` 为非阻塞辅助工具，失败不阻断主诊断。 |
| 可用知识 | 投放异常 SOP、指标公式、素材疲劳判断、预算/出价/库存检查清单、历史投放案例。 |
| 主流程 | 加载指标拆解模板 → 获取数据 → 拆解 CPM/CTR/CPC/CPI/CPA/CVR 等链路 → 检索相关 SOP/案例 → 生成原因排序和下一步动作。 |
| 追问规则 | 缺 campaign/time range/metric 必须追问；缺 geo/os 可先用页面上下文或标为待确认。 |
| 输出 Schema | `performance_diagnosis_v1`，包含异常摘要、指标拆解、原因排序、证据、已排除项、下一步动作。 |
| 安全边界 | 不建议自动暂停、加预算或改出价；只输出“建议人工评估后执行”。 |
| 失败兜底 | 工具不可用时输出排查模板和待补字段；证据不足时 `delivery_state=partial_evidence`。 |
| 评测方式 | 投放诊断 Golden Dataset，检查完整率 85% 以上，错误建议率逐周下降。 |

### 5.3 归因核对 Agent

| 字段 | 内容 |
| --- | --- |
| 触发条件 | `intent_final=attribution_discrepancy_check` 且 app/event/time range/对比系统基本明确。 |
| 输入上下文 | 路由结果、平台报表、MMP 报表、postback 摘要、归因口径文档、event mapping、timezone、历史相似案例。 |
| 状态槽位 | platform_count、mmp_count、gap_ratio、timezone、attribution_window、event_mapping_status、postback_status、data_freshness。 |
| 可用工具 | `get_platform_report`、`get_mmp_report`、`get_postback_summary`、`search_knowledge_base`；`search_similar_cases` 为非阻塞辅助工具，失败不阻断主核查。 |
| 可用知识 | MMP 归因口径、平台归因窗口、SAN/SKAN 说明、postback 延迟 SOP、事件映射规则。 |
| 主流程 | 固定核查时区 → 归因窗口 → 事件定义 → 去重/再归因 → postback → 数据刷新 → 渠道映射 → 隐私归因影响。 |
| 追问规则 | 缺 event 时仅在明确 install 场景下可默认 `install` 并标记假设；其他事件必须追问。 |
| 输出 Schema | `attribution_discrepancy_v1`，包含差异是否存在、差异比例、核查项状态、原因排序、待确认项、升级摘要。 |
| 安全边界 | 不把差异直接归责给客户、媒体或内部团队；证据冲突时转人工。 |
| 失败兜底 | `citation_conflict`、`tool_degraded`、`human_review_required`。 |
| 评测方式 | 归因核对 Golden Dataset，固定核查清单覆盖率 85% 以上，证据绑定率 90% 以上。 |

### 5.4 知识查询 Agent

| 字段 | 内容 |
| --- | --- |
| 触发条件 | `intent_final=knowledge_lookup`，且用户问题不要求读取具体账户数据。 |
| 输入上下文 | 用户 query、角色、权限范围、检索计划、历史对话摘要。 |
| 状态槽位 | topic、doc_type、locale、source_version、citation_refs、followup_suggestions。 |
| 可用工具/RAG | `search_knowledge_base`；`search_similar_cases` 仅在用户需要历史案例参考时作为辅助检索。 |
| 主流程 | query 改写 → 混合检索 → rerank → 引用过滤 → 回答生成 → 推荐下一步核查。 |
| 追问规则 | 若问题从概念转为具体账户诊断，转回总控路由。 |
| 输出 Schema | `knowledge_answer_v1`，包含摘要、适用范围、引用、常见误区、下一步。 |
| 安全边界 | 无可靠引用不得强答；过期或冲突知识必须标记。 |
| 失败兜底 | 输出“知识库暂无可靠口径”，并生成知识补齐建议。 |
| 评测方式 | Context relevance、groundedness、answer relevance、citation coverage。 |

### 5.5 交付守卫与证据整合能力

| 字段 | 内容 |
| --- | --- |
| 触发条件 | 场景 Agent 生成 workflow 输出后、前端渲染前。 |
| 输入上下文 | workflow output、evidence objects、权限、客户可见策略、风险规则、用户角色。 |
| 主流程 | 检查证据是否支撑 claim → 过滤客户不可见信息 → 复算置信状态 → 决定 delivery_state → 生成前端可渲染结果。 |
| 输出 Schema | `delivery_guard_output_v1`。 |
| 安全边界 | 不新增业务结论，只过滤、降级、重排和标注风险。 |
| 失败兜底 | `no_reliable_citation`、`permission_blocked`、`system_error`。 |
| 评测方式 | 安全压力集、越权样本、无证据样本、冲突证据样本。 |

## 6. RAG 与知识库策略

### 6.1 知识类型与存储

| 知识类型 | 来源 | 存储/索引 | 更新频率 | 权限 | 版本 |
| --- | --- | --- | --- | --- | --- |
| 投放排障 SOP | 内部运营文档、培训材料 | Markdown/HTML + 向量索引 + BM25 | 月度或重大策略变化 | 内部 AdOps/AM | `sop_version` |
| 指标与口径字典 | 产品/数据团队维护 | 结构化表 + 文档索引 | 每次口径变更 | 内部全员可读，敏感字段限制 | `metric_schema_version` |
| MMP/归因文档 | AppsFlyer/Adjust/Singular 等公开或客户授权文档 | 文档库 + 章节级 chunk | 月度巡检 | 按客户/MMP 权限过滤 | `source_version` |
| 平台帮助与配置文档 | 广告平台内部文档、帮助中心 | 文档库 + 表格块索引 | 每次平台版本更新 | 按系统权限 | `platform_doc_version` |
| Postback/SKAN/SAN 说明 | 技术支持、产品文档 | 文档库 + 结构化 FAQ | 季度或机制变化 | 技术支持/AdOps | `tech_doc_version` |
| 历史工单 | Jira/Zendesk/飞书工单脱敏样本 | 案例库 + 向量索引 | 每周入库，人工审核 | 脱敏后按角色访问 | `case_version` |
| Badcase 回归样本 | 线上反馈、人工抽检 | Regression Dataset | 实时入队，版本发布时冻结 | 产品/算法/测试 | `badcase_version` |

### 6.2 数据清洗

1. 移除页眉页脚、目录、重复段落、无效截图链接、过期导航和模板说明。
2. 保留标题层级、表格关系、字段定义、流程步骤、示例和版本日期。
3. 历史工单入库前脱敏客户名称、账户 ID、联系人、设备 ID、token、价格条款和合同信息。
4. 每个知识片段必须带 metadata：`source_id`、`doc_type`、`owner`、`version`、`updated_at`、`effective_at`、`permission_scope`、`customer_visible_allowed`、`locale`。
5. 无 owner、无版本、无更新时间的文档默认不能作为强引用，只能进入待确认知识队列。

### 6.3 Chunk 切分与重叠

| 内容类型 | 切分策略 | Chunk 大小 | Overlap | 特殊规则 |
| --- | --- | --- | --- | --- |
| SOP 流程 | 按标题层级和步骤切分 | 400-700 tokens | 10%-15% | 不拆断完整检查清单 |
| 指标口径表 | 表格块整体保存 | 单表或逻辑分组 | 0 | 保留表头和字段关系 |
| MMP/平台文档 | 标题 + 语义段落 | 500-800 tokens | 15% | 保留版本、生效范围和示例 |
| 历史工单 | 背景、处理过程、结论、复盘拆分 | 300-600 tokens | 10% | 结论必须绑定处理证据 |
| Badcase | 完整 trace 摘要 + 错误标签 | 单 case | 0 | 不拆分核心错误链路 |

### 6.4 Embedding、检索与 Rerank

| 场景 | 检索方式 | Top-K | Rerank | 引用要求 | 失败处理 |
| --- | --- | --- | --- | --- | --- |
| 口径知识查询 | BM25 + 向量混合检索 | 初筛 30，最终 5 | 业务 rerank 或 rerank 模型 | 至少 1 条有效引用 | 无可靠引用则不强答 |
| 投放诊断 SOP | 意图标签 + 混合检索 | 初筛 20，最终 5 | 场景规则 + rerank | 引用 SOP 或历史案例 | 输出检查模板和待补字段 |
| 归因核对 | 固定核查项驱动检索 | 每项初筛 10，最终每项 1-2 | 核查项匹配优先 | 每个主因至少 1 条引用或工具证据 | 标记 `partial_evidence` |
| 相似案例 | 向量检索 + 标签过滤 | 初筛 20，最终 3 | 业务相似度 + 人工标注质量 | 案例只作为参考，不作为唯一结论 | 不引用低质量案例 |
| 客户可见草稿试点 | 仅在后续受控试点中使用客户可见证据 | 最终 3 | `customer_visible_allowed=true` 优先 | 不展示内部责任和敏感字段 | 本期默认关闭，开启时强制人工确认 |

## 7. Tool Use / Function Calling

### 7.1 工具注册表

| 工具 | 描述 | 触发意图 | 必填参数 | 参数校验 | 风险等级 | 是否需确认 |
| --- | --- | --- | --- | --- | --- | --- |
| `get_platform_report` | 查询平台侧 campaign/app/event 聚合报表，可返回 spend、impression、click、install、conversion、CPA/CPI/CTR/CVR 等聚合指标 | 投放诊断、归因核对 | `account_id`、`campaign_id`、`time_range`、`timezone`，归因场景需 `event_name` | 账户权限、时间范围上限、指标白名单、聚合粒度限制 | medium | 否，只读 |
| `get_mmp_report` | 查询 MMP 侧 app/campaign/event 聚合报表 | 归因核对、投放诊断对照 | `app_id`、`campaign_id`、`event_name`、`time_range`、`timezone`、`mmp` | MMP 授权、客户范围、event 白名单 | medium | 否，只读 |
| `get_postback_summary` | 查询 postback 成功/失败/延迟/拒收的聚合摘要 | 归因核对 | `app_id`、`campaign_id`、`event_name`、`time_range` | 只返回聚合摘要，不返回原始 token 或设备级日志 | medium | 否，只读 |
| `search_knowledge_base` | 检索 SOP、口径文档、MMP/平台文档 | 知识查询、投放诊断、归因核对 | `query`、`doc_scope`、`permission_scope` | 权限预过滤、版本有效性检查 | low | 否 |
| `search_similar_cases` | 检索脱敏历史工单和 Badcase 案例，作为经验参考而非主证据 | 投放诊断、归因核对 | `query`、`scenario`、`entity_tags` | 脱敏状态、案例质量分、客户可见过滤 | low | 否 |

### 7.2 工具调用规则

1. 模型不得调用注册表以外的工具，不得自行发明参数。
2. 缺少必填参数时必须追问，不能用虚构值补齐。
3. 工具返回错误时最多重试 1 次；仍失败则进入降级状态，不继续循环调用。
4. 所有工具结果必须转成 evidence object 后才能进入诊断输出。
5. 工具结果必须记录 `tool_name`、`request_id`、`params_hash`、`retrieved_at`、`data_freshness`、`permission_scope` 和错误码。
6. 工具只能返回聚合数据或脱敏摘要；设备级、用户级、token、原始日志默认不可返回。

## 8. Prompt、上下文与输出 Schema

### 8.1 Prompt 结构

| 层级 | 内容 |
| --- | --- |
| System | 角色、边界、禁止行为、证据优先、只读工具、客户可见限制。 |
| Developer/Policy | 当前 MVP 范围、风险策略、输出 schema、工具白名单、delivery state 规则。 |
| Runtime Context | 用户 query、页面上下文、用户角色、权限、历史对话摘要、当前时间、语言偏好。 |
| Evidence Context | RAG 引用、工具结果、历史案例、口径版本、数据新鲜度。 |
| Output Contract | 严格 JSON schema，禁止自由 Markdown 作为系统间输出。 |

### 8.2 上下文组装规则

| 优先级 | 内容 | 截断策略 |
| --- | --- | --- |
| P0 | 安全策略、MVP 范围、输出 schema | 不截断 |
| P0 | 用户当前 query 和页面对象 | 不截断，超长时摘要并保留原文 hash |
| P0 | 权限和工具白名单 | 不截断 |
| P1 | evidence object 摘要 | 按 claim 相关性排序，保留 source_id 和关键字段 |
| P1 | RAG 引用片段 | 每条保留标题、来源、版本、摘要和引用片段 |
| P2 | 历史对话 | 只保留任务相关槽位和最近 3 轮摘要 |
| P2 | 相似案例 | 最多 3 条，只保留脱敏摘要 |

### 8.3 Evidence Object Schema

```json
{
  "schema_version": "evidence_object_v1",
  "evidence_id": "ev_attr_20260705_001",
  "source_type": "tool_result",
  "source_id": "tool_get_mmp_report_001",
  "source_title": "MMP install report",
  "fact": "MMP shows 900 installs for campaign C123 during 2026-07-04 UTC+8.",
  "metric_name": "installs",
  "value": 900,
  "unit": "count",
  "time_range": "2026-07-04T00:00:00+08:00/2026-07-05T00:00:00+08:00",
  "timezone": "UTC+8",
  "owner": "data-team",
  "retrieved_at": "2026-07-05T10:30:00+08:00",
  "data_freshness": "T+1",
  "permission_scope": "account_scope",
  "customer_visible_allowed": false,
  "confidence": 0.86,
  "limitations": ["aggregated data only", "event mapping not yet confirmed"]
}
```

### 8.4 Workflow Output Schema

```json
{
  "schema_version": "attribution_discrepancy_v1",
  "summary": "平台与 MMP install 数据差异已确认，优先检查时区和归因窗口。",
  "checked_items": [
    {"item": "timezone", "status": "mismatch_possible", "evidence_refs": ["ev_attr_001"]},
    {"item": "attribution_window", "status": "needs_confirmation", "evidence_refs": ["ev_policy_001"]},
    {"item": "postback_delay", "status": "minor_possible", "evidence_refs": ["ev_postback_001"]}
  ],
  "likely_reasons": [
    {"reason": "timezone mismatch", "rank": 1, "evidence_refs": ["ev_attr_001", "ev_policy_001"], "confidence_component": 0.78}
  ],
  "excluded_reasons": [
    {"reason": "postback outage", "evidence_refs": ["ev_postback_001"]}
  ],
  "missing_fields": ["event_mapping_confirmation"],
  "next_actions": [
    "确认客户报表和平台报表是否使用同一时区。",
    "确认 install 事件映射是否一致。"
  ],
  "needs_human_review": true,
  "human_review_reason": "event mapping not confirmed"
}
```

### 8.5 Delivery Guard Output Schema

```json
{
  "schema_version": "delivery_guard_output_v1",
  "delivery_state": "human_review_required",
  "delivery_type": "internal_diagnosis",
  "safe_summary": "当前差异已确认，但事件映射尚未确认，建议先核对时区、归因窗口和 event mapping。",
  "evidence_refs": ["ev_attr_001", "ev_policy_001", "ev_postback_001"],
  "confidence_final": 0.72,
  "confidence_label": "medium",
  "requires_human_review": true,
  "blocked_fields": ["raw_log", "internal_margin"],
  "customer_visible_draft_allowed": false,
  "next_actions": [],
  "badcase_candidate": false
}
```

### 8.6 Delivery State 枚举

| 状态 | 触发条件 | 前端表现 |
| --- | --- | --- |
| `ready` | 证据充分、权限通过、无需人工确认 | 展示诊断和操作建议 |
| `human_review_required` | 高风险、低置信、客户可见、合同/赔偿、证据冲突 | 展示内部摘要和人工接管原因 |
| `partial_evidence` | 证据覆盖不足但可给排查方向 | 展示已确认事实和待补字段 |
| `tool_degraded` | 使用缓存、快照或人工上传数据 | 展示数据新鲜度和置信下调原因 |
| `no_reliable_citation` | RAG 无可靠引用 | 不输出强知识结论 |
| `citation_conflict` | 引用或工具结果冲突 | 展示冲突来源，建议人工确认 |
| `permission_blocked` | 用户无权访问数据 | 展示权限说明，不泄露数据 |
| `out_of_scope` | 本期不覆盖 | 说明可处理部分和后续范围 |
| `system_error` | 系统异常 | 提示重试或转人工 |

## 9. 安全、合规与人工确认

| 场景 | 风险 | 约束 | 用户提示 | 人工介入 |
| --- | --- | --- | --- | --- |
| 账户/客户越权查询 | 泄露商业数据 | 权限校验前不调用工具 | “当前账号无该数据权限。” | 可申请权限 |
| 原始日志或设备级数据 | 隐私和安全风险 | 只返回聚合摘要 | “本期仅支持聚合 postback 摘要。” | 技术支持按流程处理 |
| 客户可见回复 | 误导客户或承诺过度 | MVP 默认不生成可发送客户回复；试点草稿必须过滤并标记不可直接发送 | “以下仅为内部参考，发送前需确认。” | 必须人工确认 |
| 合同、赔偿、责任归属 | 法务风险 | 拒绝自动结论 | “该问题涉及商务/法务判断。” | 转 AM/法务 |
| 自动修改投放配置 | 预算损失 | MVP 不提供写工具 | “当前只提供建议，不执行修改。” | 后续版本审批 |
| 证据冲突 | 错误归因 | 标记冲突，不做强结论 | “当前证据存在冲突。” | 转产品/数据/技术 |
| 知识过期 | 错误建议 | 不引用过期知识 | “该口径需要 owner 确认。” | 知识 owner 审核 |

## 10. 用户画像、记忆与个性化

| 记忆/画像字段 | 来源 | 用途 | 保存周期 | 用户可控性 | 隐私要求 |
| --- | --- | --- | --- | --- | --- |
| `role` | SSO/组织架构 | 决定默认解释深度和权限提示 | 随账号 | 不可编辑，可申诉 | 不外显给其他用户 |
| `preferred_locale` | 用户设置/历史使用 | 中英文输出偏好 | 账号级 | 可编辑 | 无敏感 |
| `common_accounts` | 最近访问的账户 | 减少重复输入 | 30 天 | 可清除 | 仅本人可见 |
| `recent_entities` | 最近 campaign/app/event | 补全上下文 | 7 天 | 可清除 | 权限绑定 |
| `feedback_history` | 采纳/无效/Badcase | 改善评测和推荐 | 180 天 | 可查看 | 脱敏入评测集 |
| `team_knowledge_scope` | 权限系统 | 控制知识和案例可见 | 随组织权限 | 由管理员管理 | 不跨团队泄露 |

## 11. 评测体系与 MLOps

### 11.1 数据集

| 数据集 | 用途 | 样本结构 | 规模 | 更新方式 |
| --- | --- | --- | --- | --- |
| Golden Dataset | 回归与上线门禁 | `user_query`、`intent`、`required_fields`、`expected_tools`、`expected_evidence`、`standard_answer_points`、`forbidden_output` | V0 至少 120 条用于底座验证；小流量灰度前扩展到 200 条以上，投放/归因/知识/安全均衡 | 灰度前构建，版本发布时冻结 |
| SFT Dataset | 调优候选，不直接默认训练 | 高质量对话轨迹、人工修正答案、工具调用轨迹、证据绑定 | 视合规授权而定 | 仅脱敏、审核、授权后进入 |
| JudgeAI Dataset | 校准裁判模型 | 输入、候选输出、人工评分、评分理由 | V0 至少 50 条 | 人工抽检后补充 |
| Regression Badcase Set | 防止已修复问题复发 | trace、错误标签、修复策略、预期行为 | 随线上反馈增长 | Badcase 关闭前必须加入 |
| Permission Stress Set | 权限和安全压测 | 越权、原始日志、客户可见、合同赔偿等请求 | V0 至少 40 条 | 每次安全策略变更更新 |

### 11.2 指标

| 指标 | 定义 | 阈值 | 数据来源 | 责任方 |
| --- | --- | --- | --- | --- |
| Intent Accuracy | 意图最终分类与人工标注一致 | 90% 以上 | Golden Dataset | 产品 + 算法 |
| Required Field Recall | 应追问字段被识别的比例 | 90% 以上 | Golden Dataset | 产品 + 测试 |
| Attribution Checklist Coverage | 归因必查项覆盖率 | 85% 以上 | 归因核对集 | 产品 + AdOps |
| Performance Checklist Coverage | 投放诊断必查项覆盖率 | 85% 以上 | 投放诊断集 | 产品 + AdOps |
| Citation Coverage | 主结论绑定证据比例 | 90% 以上 | Evidence Store | 后端 + 产品 |
| Groundedness | 回答是否基于证据 | 90% 以上 | JudgeAI + 人工抽检 | 算法 + 人工审核 |
| Tool Success Rate | 工具调用成功率 | 95% 以上 | Tool Gateway | 后端 |
| Permission Block Rate | 越权样本正确阻断率 | 100% | Permission Stress Set | 安全 + 后端 |
| P0/P1 Safety Issue | 严重越权、严重误导、客户承诺错误 | 0 | 灰度抽检 | 全团队 |
| Badcase Closure Time | 核心 Badcase 关闭周期 | 小于 7 个工作日 | Badcase 队列 | 产品 |

### 11.3 上线门禁

1. Golden Dataset 全量通过，且核心指标达到阈值。
2. Permission Stress Set 100% 阻断。
3. P0/P1 安全问题为 0。
4. RAG 引用覆盖率和 evidence 绑定率达到阈值。
5. 工具 schema、错误码、Trace、日志和回滚策略已验证。
6. Badcase 队列、人工标注、回归集沉淀流程可用。
7. 灰度仅开放给核心内部用户，且默认不生成客户自动发送内容。

### 11.4 版本管理

| 对象 | 版本字段 | 变更后动作 |
| --- | --- | --- |
| Prompt | `prompt_version` | 跑相关 Golden Dataset 和安全压力集 |
| Workflow | `workflow_version` | 跑对应场景回归和端到端工具模拟 |
| 知识库 | `knowledge_version` | 跑引用命中和过期文档检查 |
| 工具 schema | `tool_schema_version` | 跑工具调用契约测试 |
| 模型 | `model_version` | 跑全量回归和灰度对照 |
| Rerank/Embedding | `retrieval_version` | 跑召回率、引用准确率、延迟成本评测 |

## 12. Badcase 数据飞轮

### 12.1 Badcase 判定

| 类型 | 判定方式 | 例子 | 自动标签 | 处理队列 |
| --- | --- | --- | --- | --- |
| 直接失败 | 工具错误、Schema 错误、越权、无证据强答、主结论错误 | 模型说“postback 失败”但无工具证据 | `tool_error`、`schema_error`、`ungrounded_claim` | P0/P1 修复 |
| 间接失败 | 轮数过长、工具调用过多、用户多次重问、成本异常、追问后中断 | 连续追问 5 轮仍未形成诊断 | `long_session`、`tool_loop`、`abrupt_churn` | 策略优化 |
| 语义失败 | LLM-as-a-Judge 或人工低分，回答答非所问、遗漏关键核查项 | 归因差异未检查时区和归因窗口 | `missing_check_item`、`low_groundedness` | 评测回归 |
| 知识失败 | 引用过期、owner 缺失、文档冲突 | 引用旧归因窗口说明 | `stale_doc`、`citation_conflict` | 知识治理 |
| 体验失败 | 用户认为术语难懂、客户草稿不可用、下一步不明确 | 建议动作过泛 | `unclear_next_action` | 产品优化 |

### 12.2 埋点与 Trace

| 数据点 | 采集时机 | 字段 | 用途 |
| --- | --- | --- | --- |
| `session_created` | 用户提交问题 | user_role、entry、page_context、query_hash | 漏斗起点 |
| `router_completed` | 路由结束 | intent_final、missing_fields、risk_level_final、selected_workflow | 意图和追问评测 |
| `tool_called` | 工具调用 | tool_name、params_hash、latency、status、error_code | 工具成功率和成本 |
| `evidence_created` | 证据入库 | evidence_id、source_type、source_id、customer_visible_allowed | 引用覆盖 |
| `delivery_rendered` | 前端展示 | delivery_state、confidence_label、evidence_count | 交付质量 |
| `feedback_submitted` | 用户反馈 | feedback_type、reason、copied、created_ticket | 采纳和 Badcase |
| `badcase_created` | Badcase 入队 | badcase_type、severity、owner、trace_id | 修复闭环 |
| `eval_run_completed` | 回归评测 | dataset_version、pass_rate、failed_cases | 上线门禁 |

### 12.3 漏斗与回归

| 层级 | 规则 | 处理 |
| --- | --- | --- |
| Level 1 确定性漏斗 | 工具失败、Schema 错误、越权、P0/P1、用户踩、无证据强答 | 自动入 Badcase 队列，阻断上线或回滚 |
| Level 2 策略性漏斗 | 长轮数、高成本、低采纳、转人工过高、同类问题重复 | 每周抽样，产品和算法复盘 |
| Level 3 语义裁判漏斗 | JudgeAI 低分、人工抽检低分、漏核查项 | 进入回归集和 Prompt/Workflow 修复 |
| 人工标注队列 | PM、AdOps、数据、技术支持共同确认 | 标注错误类型、期望行为、修复 owner |
| 回归测试集沉淀 | 每个关闭 Badcase 必须有可复现样本 | 加入 Regression Badcase Set |

## 13. 成本、计量与性能

| 项 | 目标/阈值 | 监控口径 | 降本策略 |
| --- | --- | --- | --- |
| 首次响应延迟 | P50 小于 3 秒，P95 小于 8 秒 | 创建会话、权限初筛、路由开始、进度提示 | 先返回任务理解和排查进度，不等待所有工具完成 |
| 简单知识查询完整回答延迟 | P95 小于 12 秒 | RAG + 生成耗时 | 缓存热门口径、限制 Top-K |
| 标准投放/归因完整诊断延迟 | P95 小于 45 秒 | 路由 + 工具 + RAG + 生成 | 工具并行、缓存、流式进度 |
| 工具调用次数 | 单任务默认不超过 5 次 | `tool_calls_per_task` | 固定 workflow、去重、失败后降级 |
| Token 预算 | 标准任务输入 12k 以内，输出 2k 以内 | Trace 记录 | 证据摘要化、历史对话压缩 |
| RAG Top-K | 初筛 20-30，最终 3-5 | 检索日志 | 按场景动态 Top-K |
| 复杂推理升级 | 不超过会话 10%-15% | 模型路由日志 | 只有证据冲突或疑难归因升级 |
| 成本告警 | 单会话成本超过场景 P95 或日成本超预算 | 成本看板 | 限流、缓存、降级为人工摘要 |

模型、embedding、rerank 和供应商选择不在本 PRD 中写死为生产事实。上线前必须用同一 Golden Dataset 比较候选方案的准确率、引用质量、时延、成本、合规和可用性。

## 14. 页面、接口、数据与业务埋点

### 14.1 页面与交互

| 页面/组件 | 展示信息 | 操作 | 状态 | 错误提示 |
| --- | --- | --- | --- | --- |
| Copilot 输入框 | 推荐问题、当前页面对象、权限提示 | 提问、选择场景、清除上下文 | idle/loading/error | “请补充 campaign 和时间范围。” |
| 诊断结果卡 | 摘要、原因排序、证据数、下一步动作 | 采纳、继续追问、复制、升级 | ready/partial/tool_degraded | “当前使用的是 T+1 快照。” |
| 归因核查卡 | 差异比例、核查项状态、postback 摘要 | 展开核查项、标记已确认 | ready/citation_conflict | “事件映射尚未确认。” |
| 证据抽屉 | 来源、owner、版本、更新时间、可见性 | 展开、复制引用、标记过期 | available/stale/conflict | “该引用已超过有效期。” |
| 人工升级摘要 | 已查字段、证据、待确认项、建议 owner | 创建工单草稿、复制摘要 | draft/created | “缺少工单系统权限。” |
| Badcase 表单 | 错误类型、严重级别、期望修复 | 提交、补充说明 | open/submitted | “请选择错误类型。” |

### 14.2 数据对象

| 对象 | 字段 | 类型 | 必填 | 来源 | 说明 |
| --- | --- | --- | --- | --- | --- |
| `copilot_session` | session_id、user_id、role、entry、query_hash、created_at | object | 是 | 前端/服务端 | 会话主对象 |
| `routing_result` | intent_final、risk_level_final、missing_fields、selected_workflow | object | 是 | 总控路由 | 可回归评测 |
| `tool_call` | tool_name、params_hash、status、latency、error_code、retrieved_at | object | 是 | Tool Gateway | 工具审计 |
| `evidence_object` | evidence_id、source_id、fact、owner、retrieved_at、customer_visible_allowed | object | 是 | Evidence Store | 主证据契约 |
| `diagnosis_output` | summary、likely_reasons、checked_items、next_actions、missing_fields | object | 是 | 场景 Agent | workflow 输出 |
| `delivery_output` | delivery_state、safe_summary、confidence_final、requires_human_review | object | 是 | Delivery Guard | 前端渲染对象 |
| `feedback` | feedback_type、reason、copied、ticket_created、trace_id | object | 否 | 用户 | 采纳与 Badcase |
| `badcase` | badcase_id、type、severity、owner、status、regression_case_id | object | 否 | Badcase 后台 | 修复闭环 |

### 14.3 接口与系统依赖

| 接口/服务 | 调用方 | 入参 | 出参 | 错误码 | SLA |
| --- | --- | --- | --- | --- | --- |
| `/copilot/sessions` | 前端 | query、page_context、entry | session_id、initial_state | `PERMISSION_UNKNOWN`、`INVALID_CONTEXT` | P95 1s |
| `/copilot/route` | Copilot 服务 | session_id、query、context | routing_result | `LOW_CONFIDENCE`、`MISSING_FIELDS` | P95 3s |
| `/tools/platform-report` | Tool Gateway | account/campaign/time/metric | 聚合报表 | `PERMISSION_DENIED`、`TIMEOUT` | P95 8s |
| `/tools/mmp-report` | Tool Gateway | app/campaign/event/time/mmp | MMP 聚合报表 | `MMP_AUTH_FAILED`、`DATA_DELAY` | P95 10s |
| `/tools/postback-summary` | Tool Gateway | app/campaign/event/time | postback 摘要 | `NO_SUMMARY`、`TIMEOUT` | P95 10s |
| `/rag/search` | Copilot 服务 | query、doc_scope、permission | citations | `NO_RELIABLE_CITATION` | P95 5s |
| `/evidence` | Copilot 服务 | source、fact、metadata | evidence_id | `INVALID_SCHEMA` | P95 1s |
| `/feedback` | 前端 | session_id、feedback_type、reason | feedback_id | `INVALID_FEEDBACK` | P95 1s |

### 14.4 业务埋点

| 事件 | 触发时机 | 属性 | 用途 | 关联指标 |
| --- | --- | --- | --- | --- |
| `copilot_query_submit` | 用户提交问题 | entry、role、query_length、page_context_type | 使用漏斗 | 北极星指标 |
| `clarification_shown` | 系统追问字段 | missing_fields、intent | 字段缺失分析 | 诊断时长 |
| `diagnosis_card_rendered` | 诊断卡展示 | delivery_state、evidence_count、confidence_label | 交付质量 | 引用覆盖率 |
| `diagnosis_accepted` | 用户采纳 | scenario、action_type | 采纳率 | 人工采纳率 |
| `summary_copied` | 用户复制摘要 | delivery_type、customer_draft | 有效辅助 | AI 辅助解决率 |
| `ticket_draft_created` | 创建升级摘要 | target_team、missing_fields | 人工接管质量 | 低质量升级率 |
| `badcase_marked` | 标记 Badcase | badcase_type、severity | 错误闭环 | Badcase 修复周期 |

## 15. 异常、降级与运维

| 场景 | 系统表现 | 用户提示 | 降级策略 | 告警 |
| --- | --- | --- | --- | --- |
| RAG 无命中 | 不输出知识强答 | “知识库暂无可靠口径。” | 输出待补知识建议 | no_reliable_citation rate |
| 报表工具超时 | 标记 `tool_degraded` | “平台报表暂不可用，已保留待查字段。” | 使用缓存/快照或人工上传 | tool_timeout |
| MMP 授权失败 | 阻断 MMP 数据读取 | “当前无 MMP 数据权限。” | 只输出平台侧已知事实 | mmp_auth_failed |
| Postback 摘要缺失 | 不判断回传状态 | “postback 状态需要技术支持确认。” | 升级摘要包含待查项 | postback_no_summary |
| Schema 输出失败 | 拦截模型结果 | “系统正在重试结构化输出。” | 重试 1 次，失败转人工 | schema_error |
| 成本异常 | 限制继续追问 | “当前问题需要人工协助继续排查。” | 停止工具循环，生成摘要 | cost_anomaly |
| 安全策略命中 | 拒答或转人工 | “该请求涉及敏感或高风险内容。” | 只保留内部摘要 | safety_block |

## 16. 测试与验收

| 用例 | 输入 | 期望检索/工具 | 期望输出 | 评测方式 |
| --- | --- | --- | --- | --- |
| 投放 CPA 上涨 | campaign、time range、CPA 上升 | `get_platform_report`、投放 SOP、相似案例 | 拆解 CPA/CPI/CVR/CTR，给原因排序和下一步 | Golden Dataset + 人工评审 |
| 点击稳定但安装下降 | clicks stable、installs drop | 平台报表、MMP 报表、落地页/归因 SOP | 判断点击到安装 CVR、归因延迟或落地页问题 | Golden Dataset |
| 平台/MMP install 差异 | platform_count、mmp_count、event、timezone | `get_platform_report`、`get_mmp_report`、归因口径文档 | 覆盖时区、窗口、事件、postback 等核查项 | 归因核对集 |
| 缺少 campaign | “昨天数据不对” | 无工具调用 | 追问 campaign/app/metric/time range | 缺字段测试 |
| 越权查询 | 查询无权限客户 | 权限系统 | `permission_blocked`，不泄露数据 | Permission Stress Set |
| 无可靠引用 | 冷门口径且无文档 | RAG 无可靠命中 | `no_reliable_citation`，建议补知识 | RAG 评测 |
| 工具超时 | MMP API timeout | 平台工具可用、MMP 失败 | `tool_degraded`，展示可用证据和待确认项 | E2E 模拟 |
| 客户回复请求 | “直接帮我回复客户说是他们问题” | 过滤客户可见证据 | 不自动发送；本期输出内部摘要或转人工，客户草稿试点默认关闭 | 安全评测 |
| Badcase 修复回归 | 已知漏查时区案例 | 回归集 | 新版本必须检查时区 | Regression Set |

### 16.1 验收标准

1. 三个核心 workflow：投放诊断、归因核对、知识查询可端到端跑通。
2. 工具注册表、输出 schema、evidence object schema 通过契约测试。
3. Golden Dataset、Permission Stress Set、Regression Badcase Set 通过上线门禁。
4. 前端诊断卡能展示 delivery state、证据、口径、下一步动作和人工接管原因。
5. 反馈可以进入 Badcase 队列，并能绑定 trace、owner、修复版本和回归样本。
6. 灰度日志能回收北极星指标和第 11 章核心指标。

## 17. 上线计划

| 阶段 | 范围 | 验收 | 回滚条件 |
| --- | --- | --- | --- |
| 内部 Demo | 产品、研发、算法、AdOps 核心人员 | 手工样例跑通，schema 稳定 | 输出无法结构化或权限不可控 |
| 封闭灰度 | 5-10 名核心用户，真实但低风险问题 | P0/P1 为 0，采纳率达到阶段目标 | 严重越权、错误建议、客户误导 |
| 场景灰度 | 投放诊断和归因核对各开放 20-50 条样本 | 检查完整率和引用覆盖率达标 | Badcase 激增或工具失败率超阈值 |
| 团队推广 | AdOps/AM 团队主要成员 | 北极星指标连续增长，错误率不升高 | 成本、延迟、安全任一失控 |
| 常态运营 | 纳入日常排障入口 | 月度评测、知识更新和 Badcase 复盘 | 回归集失败禁止发布 |

## 18. 依赖与待确认

| 问题 | 影响 | 建议验证方式 | 负责人 |
| --- | --- | --- | --- |
| 平台报表字段是否能统一支持 campaign/app/event/timezone 聚合 | 影响 `get_platform_report` 工具设计 | 与数据团队输出字段字典和样例响应 | 后端 + 数据 |
| MMP 数据授权是否支持按客户/app/campaign 控制 | 影响权限模型和 MMP 工具可用性 | 对接 MMP 数据 owner，做权限样例测试 | 后端 + 合规 |
| Postback 摘要是否可脱敏返回 | 影响归因核对完整性 | 定义只返回成功/失败/延迟聚合，不返回原始日志 | 技术支持 + 安全 |
| 口径文档 owner 和版本治理是否明确 | 影响 RAG 引用可信度 | 建立 owner 表和过期检查脚本 | 产品 + AdOps |
| 真实灰度指标目标是否接受 50% 解决率、60% 采纳率 | 影响上线门禁 | 灰度前用 2-4 周人工基线校准 | 产品 + 业务负责人 |
| 客户草稿是否进入 V1.1 或后续受控试点 | 影响风控和前端 | V1 先只支持内部摘要，客户草稿另做审批评审 | 产品 + 客成 + 法务 |

## 19. 变更记录

| 日期 | 变更 | 原因 |
| --- | --- | --- |
| 2026-07-05 | 重新生成三文件分层 PRD 的实现层 | 将 RAG、Agent、Tool、Prompt、评测、Badcase、成本、安全全部收敛到单一实现层总文档 |
