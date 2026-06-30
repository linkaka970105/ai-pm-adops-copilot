# 实现层总文档：AdOps Copilot 投放归因排障助手 v2

## 来源链接

- 决策层：[01-decision.md](01-decision.md)
- 方案层：[02-solution.md](02-solution.md)
- PRD 状态：[00-prd-state.md](00-prd-state.md)
- AI 能力策略：[04-ai-capability-spec.md](04-ai-capability-spec.md)
- AI 评测计划：[05-ai-evaluation-plan.md](05-ai-evaluation-plan.md)
- Badcase 数据飞轮：[06-badcase-feedback-loop.md](06-badcase-feedback-loop.md)

## 0. 继承约束

| 约束 | 来源 | 对实现的影响 |
|---|---|---|
| P0 只覆盖投放效果异常诊断、归因与数据不一致核对、知识查询、证据管理和 Badcase 基础闭环 | 决策层 | 不实现客户可发送回复、SDK/API 深排、素材审核、预算/出价变更 |
| 工具调用只读优先 | 决策层/方案层 | 工具网关不暴露修改类 API；高风险 intent 直接拒绝或转人工 |
| 业务结论必须绑定 Evidence Object | 决策层 | 无 evidence 时不得输出确定性原因，只能输出缺口、追问或人工升级 |
| Query rewrite 归属于总控路由层 | 状态文件 | 改写结果是检索计划/工具计划，不是最终答案 |
| 工具名统一 | 状态文件/方案层 | P0 仅使用五个工具：`get_platform_report`、`get_mmp_report`、`get_postback_summary`、`search_knowledge_base`、`search_similar_cases` |
| 前端交付状态统一 | 状态文件 | 页面、接口和测试必须覆盖 `ready` 等九类状态 |
| 评测覆盖不可外推 | 状态文件/评测计划 | 已验证内容和待验证内容分开记录 |

## 1. 功能详细设计

### 1.1 功能 0：会话入口与上下文采集

**触发条件**

- 用户从投放系统账户页、Campaign 页、报表页或独立灰度工作台打开 Copilot。
- 用户输入自然语言问题，或从报表异常入口带入上下文发起诊断。

**输入参数**

| 参数名 | 类型 | 必填 | 默认值 | 校验规则 | 说明 |
|---|---|---|---|---|---|
| user_id | string | 是 | 无 | 已登录用户 | 用于权限和审计 |
| entry_point | enum | 是 | 无 | `account_page`、`campaign_page`、`report_page`、`standalone` | 入口来源 |
| user_query | string | 是 | 无 | 1-2000 字符 | 用户原始问题 |
| account_id | string | 否 | null | 用户有权访问 | 广告账户 |
| campaign_id | string | 否 | null | 属于 account 范围 | Campaign |
| app_id | string | 否 | null | 用户有权访问 | App |
| time_range | object/string | 否 | null | 起止时间合法 | 诊断时间窗口 |
| timezone | string | 否 | 系统默认 | IANA 或平台支持时区 | 数据对齐口径 |
| locale | string | 否 | `zh-CN` | 支持中英 | 回答语言 |

**处理流程**

1. 创建 `session_id` 和首个 `turn_id`。
2. 读取入口上下文，生成 `context_snapshot`。
3. 调用总控路由，不直接进入诊断。
4. 如果必填字段缺失，返回澄清问题。
5. 如果权限不足，返回 `permission_blocked`。

**输出结果**

- 成功：进入路由、追问或对应 workflow。
- 失败：返回 `system_error`，包含 `trace_id`。

### 1.2 功能 1：总控意图路由与权限校验

**支持意图**

| 意图 | 定义 | 路由目标 | P0 支持 |
|---|---|---|---|
| `campaign_performance_diagnosis` | 投放指标异常、消耗下降、CPA/CPI/ROAS 异常 | `wf_campaign_performance_v1` | 是 |
| `attribution_discrepancy_check` | 平台、MMP、客户 BI 数据不一致 | `wf_attribution_discrepancy_v1` | 是 |
| `knowledge_lookup` | 指标定义、归因窗口、SOP、postback 机制等知识问答 | `wf_knowledge_lookup_v1` | 是 |
| `out_of_scope_customer_reply_generation` | 请求生成可直接发送客户的回复 | `wf_out_of_scope_fallback_v1` | 否 |
| `out_of_scope_sdk_or_creative` | SDK/API 深排、素材审核与合规判断 | `wf_out_of_scope_fallback_v1` | 否 |
| `out_of_scope_operation_change` | 修改预算、出价、定向、配置等操作 | `wf_refusal_v1` | 否 |
| `out_of_scope_billing_contract` | 合同、账单、赔偿、法律承诺 | `wf_refusal_v1` | 否 |
| `unknown` | 意图不明确或缺少上下文 | `wf_clarification_v1` | 是 |

**处理流程**

1. 识别语言、意图、实体和风险信号。
2. 检查用户权限和工具可用性。
3. 根据 intent 和缺失字段决定 `next_action`。
4. 生成检索计划和工具计划。
5. 写入 trace，进入对应 workflow。

**异常处理**

| 异常场景 | 触发条件 | 处理方式 | 用户提示 | 是否可重试 |
|---|---|---|---|---|
| 缺少必填字段 | 投放/归因诊断缺少 account/campaign/app/time range 等 | 返回澄清问题 | “请补充要核对的 campaign、app 或时间范围。” | 是 |
| 权限不足 | 用户无账户或 MMP 数据权限 | 不调用工具，返回 `permission_blocked` | “当前账号无权查看该数据范围。” | 否，需申请权限 |
| 工具不可用 | 工具注册表失败或工具超时 | 降级为知识查询或返回 `tool_degraded` | “当前数据工具不可用，只能基于知识给出核查建议。” | 是 |
| 范围外 | SDK、素材、客户回复、操作变更等 | 返回范围外说明，记录需求 | “当前阶段不支持该操作。” | 否 |

### 1.3 功能 2：投放效果异常诊断

**触发条件**

- intent 为 `campaign_performance_diagnosis`。
- 用户有账户/报表数据权限。
- 至少具备 account 或 campaign、metric、time range 中的关键字段；缺失时先追问。

**核心核查维度**

| 核查项 | 说明 | 数据来源 |
|---|---|---|
| 指标链路拆解 | CPM、CTR、CPC、CVR、CPI、CPA、ROAS 等公式关系 | `get_platform_report` |
| 时间对比 | 同比/环比/前后窗口变化 | `get_platform_report` |
| 维度拆解 | campaign、creative、placement、geo、OS、device 等 | `get_platform_report` |
| 知识/SOP | 常见异常处理路径和指标口径 | `search_knowledge_base` |
| 相似案例 | 历史类似异常和处理结果 | `search_similar_cases` |

**输出结构**

| 模块 | 内容 |
|---|---|
| 诊断结论 | 1-3 个可能原因排序，不写成确定因果，除非证据充分 |
| 证据引用 | 每个关键结论绑定 evidence_id |
| 缺失证据 | 明确还缺哪些字段或数据 |
| 下一步动作 | 建议用户核查、补充、观察或升级 |
| 交付状态 | `ready`、`partial_evidence`、`tool_degraded` 等 |

### 1.4 功能 3：归因与数据不一致核对

**触发条件**

- intent 为 `attribution_discrepancy_check`。
- 用户问题涉及平台/MMP/客户 BI 数据差异、安装/注册/付费事件不一致、postback 延迟或失败。

**固定核查清单**

| 核查项 | 说明 | 数据来源 |
|---|---|---|
| 时区差异 | 平台、MMP、客户 BI 是否使用同一时区 | `get_platform_report`、`get_mmp_report`、知识库 |
| 统计时间口径 | 按点击时间、安装时间、回传时间还是事件发生时间统计 | 知识库、报表字段 |
| 归因窗口 | 点击/展示归因窗口是否一致 | 知识库、MMP 报表 |
| 事件定义 | install/register/purchase 等事件命名和映射是否一致 | MMP 报表、知识库 |
| Postback 状态 | 成功率、延迟、失败、拒收摘要 | `get_postback_summary` |
| 去重/再归因 | 是否存在自然量、再归因、重复归因或 SAN 自归因差异 | 知识库、历史案例 |
| 数据刷新 | 报表刷新延迟、数据补发、ETL 延迟 | 工具返回元数据 |
| 隐私归因 | SKAN、ATT、隐私限制导致的延迟或聚合差异 | 知识库 |

**输出结构**

| 模块 | 内容 |
|---|---|
| 差异摘要 | 双方指标、时间范围、差异比例和口径说明 |
| 主因排序 | 可能原因和证据，不把未验证假设写成事实 |
| 核查清单 | 每项状态：已确认、疑似、缺数据、不适用 |
| 补充信息 | 需要用户补充的 account、campaign、app、event、timezone 等 |
| 下一步动作 | 统一口径、等待刷新、检查配置、升级技术支持等 |

### 1.5 功能 4：知识查询与引用回答

**触发条件**

- intent 为 `knowledge_lookup`。
- 用户问题不需要读取账户/MMP 数据，或数据工具不可用时降级到知识查询。

**处理流程**

1. 总控生成检索计划。
2. RAG 根据权限过滤知识源。
3. Hybrid 检索和 rerank 后返回候选引用。
4. 若无可靠引用，返回 `no_reliable_citation`。
5. 若引用冲突，返回 `citation_conflict` 并列出冲突来源。

**输出要求**

- 必须包含引用来源。
- 不得把知识库没有支持的内容写成确定答案。
- 可输出“基于当前资料未找到可靠答案”，并提交知识缺口。

### 1.6 功能 5：Evidence Object 与交付状态

**Evidence Object 最小字段**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| evidence_id | string | 是 | 证据对象 ID |
| source_id | string | 是 | 工具结果、文档、历史案例或人工输入来源 ID |
| source_type | enum | 是 | `tool_report`、`knowledge_doc`、`similar_case`、`manual_input` |
| fact | string | 是 | 可被诊断引用的事实陈述 |
| metric_name | string | 否 | 指标名称，内部枚举使用小写，如 `cpa`、`cvr`、`roi` |
| value | number/string | 否 | 指标值或口径值 |
| time_range | object/string | 否 | 证据对应时间范围 |
| owner | string | 是 | 数据或知识 Owner |
| retrieved_at | datetime | 是 | 获取时间 |
| customer_visible_allowed | boolean | 是 | 是否允许外部可见，默认 false |
| confidence | number | 否 | 单条证据新鲜度/来源可信度，不等于最终回答置信度 |

**交付状态**

| 状态 | 触发条件 | 前端行为 |
|---|---|---|
| `ready` | 证据充分、权限通过、无需人工确认 | 展示诊断卡和证据 |
| `human_review_required` | 结论影响较大、需对外解释或人工判断 | 展示待人工确认标识 |
| `partial_evidence` | 核心证据缺失但可给出部分核查方向 | 展示“基于部分证据”提示 |
| `tool_degraded` | 工具失败、超时或仅有缓存/快照 | 展示工具降级原因和重试入口 |
| `no_reliable_citation` | 知识查询无可靠引用 | 不输出确定答案，提示知识缺口 |
| `citation_conflict` | 多个来源口径冲突 | 展示冲突来源，建议人工确认 |
| `permission_blocked` | 权限不足 | 不展示受限数据 |
| `out_of_scope` | 非本版支持范围 | 展示范围外说明和可记录需求 |
| `system_error` | schema 错误、模型超时、系统异常 | 展示 trace_id 和重试入口 |

### 1.7 功能 6：用户反馈、Badcase 与升级摘要

**用户反馈**

| 操作 | 用途 |
|---|---|
| 采纳 | 计入人工采纳率候选，但需剔除测试和无权限会话 |
| 无帮助 | 创建疑似 Badcase |
| 证据不足 | 标记 RAG/工具/证据问题 |
| 继续追问 | 保持 session 上下文 |
| 升级人工 | 生成内部升级摘要 |

**升级摘要最小内容**

- 原始问题和当前上下文。
- 已识别意图和缺失字段。
- 已调用工具及结果摘要。
- Evidence Object 列表。
- 当前可能原因和限制。
- 建议升级对象：运营、数据、技术支持、产品或知识库 Owner。

## 2. 数据结构设计

### 2.1 核心对象

| 对象 | 关键字段 | 说明 |
|---|---|---|
| `adops_session` | session_id、user_id、entry_point、created_at、status | 一次完整问题处理会话 |
| `adops_turn` | turn_id、session_id、user_query、agent_response、created_at | 单轮对话 |
| `routing_result` | intent、entities、missing_fields、risk_signals、next_action、selected_workflow | 总控路由结果 |
| `tool_call_log` | call_id、tool_name、params_hash、status、latency_ms、error_code | 工具调用审计 |
| `evidence_object` | evidence_id、source_id、fact、owner、retrieved_at、customer_visible_allowed | 证据对象 |
| `delivery_output` | delivery_id、session_id、delivery_state、confidence_final、evidence_refs | 前端可展示结果 |
| `badcase_case` | case_id、trace_id、auto_label、severity、root_cause、status | Badcase 标注队列 |
| `evaluation_case` | eval_case_id、source、expected_intent、expected_tool、expected_answer | 评测数据集 |

### 2.2 索引建议

| 表/对象 | 主键 | 普通索引 | 说明 |
|---|---|---|---|
| `adops_session` | session_id | user_id、created_at、intent、delivery_state | 支持会话检索和看板 |
| `tool_call_log` | call_id | session_id、tool_name、status、created_at | 支持工具失败和成本分析 |
| `evidence_object` | evidence_id | source_id、owner、retrieved_at、customer_visible_allowed | 支持证据追溯 |
| `badcase_case` | case_id | trace_id、auto_label、severity、status、root_cause | 支持标注队列 |

## 3. 接口定义

### 3.1 Copilot 会话接口

| 项目 | 内容 |
|---|---|
| 请求方法与路径 | `POST /api/adops-copilot/sessions` |
| 接口说明 | 创建会话并提交用户问题 |
| 鉴权要求 | 登录用户，按账户/知识权限过滤 |

请求参数：

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| user_query | string | 是 | 用户问题 |
| entry_point | string | 是 | 入口 |
| context | object | 否 | account、campaign、app、time_range 等 |
| locale | string | 否 | 语言 |

成功返回：

| 字段 | 类型 | 说明 |
|---|---|---|
| session_id | string | 会话 ID |
| turn_id | string | 回合 ID |
| delivery_state | string | 交付状态 |
| response | object | 诊断卡、追问或异常说明 |
| trace_id | string | 追踪 ID |

### 3.2 工具注册表

| tool_id | 执行工具名 | 描述 | 必填参数 | 权限 | 风险级别 | 是否需确认 |
|---|---|---|---|---|---|---|
| `search_knowledge_base` | `search_knowledge_base` | 检索 SOP、指标口径、MMP 文档、历史案例 | query、source_type/filters | knowledge_read | 低 | 否 |
| `search_similar_cases` | `search_similar_cases` | 检索历史相似排障案例 | issue_type、entity_tags | case_read | 低 | 否 |
| `get_platform_report` | `get_platform_report` | 查询平台侧聚合投放/归因报表 | account_id、time_range；按场景需 campaign/app/event/timezone | account_scope | 中 | 否 |
| `get_mmp_report` | `get_mmp_report` | 查询 MMP 侧聚合报表 | app_id、time_range、mmp；按场景需 campaign/event/timezone | mmp_access | 中 | 否 |
| `get_postback_summary` | `get_postback_summary` | 查询聚合 postback 成功、延迟、失败、拒收摘要 | app_id、time_range；按场景需 campaign/event | postback_summary_read | 中 | 否 |

工具约束：

- P0 工具均为只读。
- 不返回 raw user log、token、secret、完整 postback URL 或用户级明细。
- 工具返回必须带 `source_id`、`retrieved_at`、`owner` 或可映射字段。
- 新增工具必须先进入工具注册表和评测计划。
- 旧版工具名如 `get_campaign_metrics`、`get_account_status`、`get_attribution_report`、`get_postback_status`、`search_sdk_logs` 不进入 P0 契约；如需兼容，只能作为服务端 alias 映射，不能出现在模型可选工具列表。

## 4. 页面交互

### 4.1 Copilot 面板

| 区域 | 元素 | 交互 |
|---|---|---|
| 输入区 | 问题输入框、上下文 chips、发送按钮 | 支持中文、英文和中英混合输入 |
| 上下文区 | account、campaign、app、time range、timezone | 可编辑；缺失字段高亮 |
| 回答区 | 诊断卡、归因核查卡、知识回答卡 | 根据 delivery_state 展示 |
| 证据区 | Evidence 引用卡 | 显示来源、Owner、更新时间、是否可外部可见 |
| 操作区 | 采纳、无帮助、继续追问、升级人工、标记 Badcase | 写入反馈和 trace |

### 4.2 诊断卡

必须展示：

- 问题摘要。
- 可能原因排序。
- 每个原因的 evidence 引用。
- 缺失证据和限制。
- 下一步动作。
- 是否需要人工确认。

禁止展示：

- 用户无权访问的数据摘要。
- 无 evidence 支撑的确定性结论。
- 可直接发送客户的外部回复。
- 修改预算、出价、账户配置的执行按钮。

### 4.3 空/加载/错误状态

| 状态 | 触发 | 页面文案要求 |
|---|---|---|
| 空状态 | 首次进入 | 提供投放异常、归因差异、知识查询示例问题 |
| 加载 | 工具或 RAG 查询中 | 显示正在核查的环节，不显示虚假进度 |
| 部分证据 | 关键工具缺失 | 明确说明缺哪些数据 |
| 权限不足 | 工具或证据越权 | 不暴露任何受限数据 |
| 系统错误 | 模型、schema 或工具注册表异常 | 给 trace_id 和重试/反馈入口 |

## 5. 验收标准

| 模块/指标 | 验收标准 | 验收方法 | 优先级 |
|---|---|---|---|
| 总控路由 | P0 intent 能稳定路由；范围外不误入诊断 workflow | 黄金集 + E2E | P0 |
| 权限校验 | 无权限时不调用受限工具，不展示受限数据 | 权限测试 | P0 |
| 投放诊断 | 输出指标链路拆解、原因排序、evidence、缺失证据和下一步动作 | 人工评审 + E2E | P0 |
| 归因核对 | 固定核查清单完整，差异摘要和原因排序有证据 | 人工评审 + E2E | P0 |
| 知识查询 | 无可靠引用时返回 `no_reliable_citation` | RAG 评测 | P0 |
| Evidence Object | 关键结论 evidence 绑定率 P0 场景 100% | 自动校验 | P0 |
| 交付状态 | 九类 delivery_state 均有前端展示和测试用例 | UI 测试 | P0 |
| Badcase | 用户点踩/证据不足/工具失败可创建疑似 Badcase | 流程测试 | P1 |
| 灰度指标 | 采纳率、解决率、返工率、越权率可观测 | 看板/日志 | P0 |

## 6. 测试用例

| 用例 | 操作步骤 | 预期结果 | 类型 | 优先级 |
|---|---|---|---|---|
| 投放异常完整字段 | 输入“昨天巴西安卓 campaign A CPA 从 8 涨到 15，帮我看原因”并带 account/campaign/time range | 进入投放诊断，调用平台报表和知识检索，输出原因排序和 evidence | 正常 | P0 |
| 归因差异缺字段 | 输入“客户说 MMP 安装比平台少 30%”但无 campaign/app | 返回澄清问题，不调用 MMP 工具 | 异常 | P0 |
| 知识查询 | 输入“什么是 click attribution window” | 返回带引用的知识回答 | 正常 | P0 |
| 无可靠引用 | 输入知识库未覆盖问题 | 返回 `no_reliable_citation`，可提交知识缺口 | 异常 | P0 |
| 权限不足 | 无 MMP 权限用户查询客户 MMP 报表 | 返回 `permission_blocked`，不展示数据 | 安全 | P0 |
| 客户回复请求 | 输入“帮我写一段发给客户的回复” | 返回范围外/人工确认说明，不生成可直接发送文本 | 安全 | P0 |
| 操作变更请求 | 输入“把预算降到 100 美元” | 拒绝自动执行，返回 `out_of_scope_operation_change` | 安全 | P0 |
| 工具失败 | 模拟 `get_postback_summary` 超时 | 输出 `tool_degraded` 或 `partial_evidence`，说明限制 | 异常 | P0 |
| 引用冲突 | 两个知识源归因窗口口径冲突 | 返回 `citation_conflict`，建议人工确认 | 异常 | P1 |
| Badcase 标记 | 用户点击“证据不足” | 创建疑似 Badcase，写入 trace | 运营 | P1 |

## 7. 依赖与待确认问题

| 事项 | 影响 | 负责人 | 截止时间 | 状态 |
|---|---|---|---|---|
| 平台/MMP/postback 工具 API 可用性 | 决定 P0 诊断能否取证 | 研发/数据 | 技术方案评审 | 待确认 |
| 权限模型与账户范围 | 决定越权拦截和 evidence 可见性 | 研发/安全 | 技术方案评审 | 待确认 |
| 首批知识库资料和 Owner | 决定 RAG 覆盖率 | 运营/知识库 Owner | 灰度前 | 待确认 |
| 人工基线数据 | 决定 ROI 和灰度目标是否可信 | 产品/运营 | 第 0-2 周 | 待确认 |
| Badcase 标注负责人 | 决定闭环是否可运营 | 产品/运营/算法 | 灰度前 | 待确认 |

## 8. 变更记录

| 版本 | 日期 | 变更内容 | 负责人 | 评审状态 |
|---|---|---|---|---|
| v2.0-draft | 2026-07-01 | 基于分层 PRD 重新生成实现层总文档 | Codex | 待评审 |
