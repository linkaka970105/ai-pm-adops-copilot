# AI 能力策略：AdOps Copilot 投放归因排障助手 v2

## 来源链接

- PRD 状态：[00-prd-state.md](00-prd-state.md)
- 决策层：[01-decision.md](01-decision.md)
- 方案层：[02-solution.md](02-solution.md)
- 实现层总文档：[03-implementation.md](03-implementation.md)

## 0. AI 能力边界

| 能力 | 是否支持 | 适用场景 | 不支持/拒答边界 |
|---|---|---|---|
| 意图识别与路由 | 支持 P0 | 投放诊断、归因核对、知识查询、范围外识别 | 不以模型输出直接作为最终权限或风险结论 |
| RAG 知识问答 | 支持 P0 | SOP、指标口径、归因窗口、postback 机制、历史案例 | 无可靠引用时不输出确定答案 |
| 投放异常诊断 | 支持 P0 | 消耗、曝光、点击、安装、CPA/CPI/ROAS 等异常 | 不自动修改预算、出价、定向或账户配置 |
| 归因差异核对 | 支持 P0 | 平台/MMP/BI 数据不一致、时区/窗口/事件/postback 核查 | 不读取用户级日志、token、secret 或 raw postback URL |
| 客户可见回复生成 | 不支持 P0 | 可记录需求或生成内部摘要 | 不生成可直接发送客户的最终文本 |
| SDK/API 深排 | 不支持 P0 | 可识别为范围外并转人工 | 不分析 raw log 或 SDK 代码级问题 |
| 素材审核 | 不支持 P0 | 可识别为范围外并记录后续需求 | 不做图像/OCR/政策最终判断 |
| Badcase 识别 | 支持 P1 | 用户反馈、工具失败、证据冲突、离线评测 | 不自动修复线上 Prompt 或知识库 |

## 1. RAG 策略

### 1.1 知识库范围

| 知识源 | 数据类型 | 更新频率 | 权限范围 | 负责人 |
|---|---|---|---|---|
| 投放排障 SOP | 文档/Markdown/表格 | 由 Owner 更新，灰度期建议每周复核 | 内部运营/AM/技术支持 | 运营 Owner |
| 指标口径库 | 指标定义、公式、适用范围 | 指标变更时更新 | 内部 | 产品/数据 Owner |
| 归因与 MMP 文档 | 归因窗口、事件定义、SKAN/SAN、MMP 配置说明 | MMP/平台规则变更时更新 | 按客户和数据权限过滤 | 产品/技术支持 |
| Postback 机制说明 | 回传机制、延迟、失败原因、拒收规则 | 技术规则变更时更新 | 技术支持/AdOps | 技术支持 Owner |
| 历史工单/Badcase | 结构化案例和处理结论 | 每周或 Badcase 关闭后更新 | 脱敏后按角色展示 | 运营/知识库 Owner |
| 竞品与行业资料 | 产品定位、对标和方法论 | 低频更新 | 产品内部 | 产品 |

### 1.2 数据清洗

| 规则 | 处理方式 | 例外情况 |
|---|---|---|
| 去除低价值噪声 | 删除目录、页眉页脚、重复版权、无关聊天寒暄 | 法务/合同信息默认不入库 |
| 保留业务结构 | 保留标题层级、步骤编号、表格、指标公式、更新时间 | 复杂表格需转换为结构化 Markdown |
| 敏感信息脱敏 | 客户名、账户 ID、token、用户级日志、金额承诺脱敏 | 灰度环境只允许内部测试数据 |
| 元数据补全 | 补充 source_id、owner、updated_at、permission_scope、source_type | 无 Owner 的知识不得进入 P0 生产知识库 |
| 版本管理 | 每次知识更新记录版本和生效时间 | 过期知识保留归档，不参与默认检索 |

### 1.3 Chunk 策略

| 维度 | 策略 | 默认值 | 说明 |
|---|---|---|---|
| 切分方式 | 标题层级 + 语义段落 | 优先按章节/核查步骤切分 | 避免把同一排查步骤切散 |
| Chunk 长度 | token | 300-800 token | 按 SOP 和 MMP 文档实际密度调整 |
| Overlap | token/比例 | 10%-20% | 避免口径和例外条件被截断 |
| 表格处理 | 保持表头和行语义 | 表格独立 chunk | 指标口径、核查清单优先保持完整 |
| 元数据 | source_id、section、owner、updated_at、permission_scope、locale | 必填 | 支撑权限、引用和冲突判断 |

### 1.4 检索策略

| 环节 | 策略 | 模型/工具 | 参数 |
|---|---|---|---|
| Query rewrite | 总控生成检索计划、实体、source_type 和过滤条件 | LLM Router + 规则层 | 不生成最终答案 |
| Embedding | 国内/可私有化优先 | `bge-m3` 或 Alibaba `text-embedding-v3`，OpenAI embedding 仅作合规对照 | 需记录模型版本和维度 |
| 召回 | Hybrid Search | 向量 + BM25 + 实体过滤 | 初召回 Top-N 待评测 |
| Rerank | 开启 | `bge-reranker-v2-m3` 或 Alibaba rerank，Cohere 仅作对照 | 目标是提高引用准确率 |
| Top-K | 按场景配置 | 知识查询多于诊断场景 | 默认值需离线评测确认 |
| 权限过滤 | 检索前后双重过滤 | permission_scope | 不允许模型自行判断权限 |
| 引用输出 | 必须绑定 citation/evidence | source_id、section、retrieved_at | 无引用则 `no_reliable_citation` |

### 1.5 冲突处理

| 冲突类型 | 示例 | 处理方式 |
|---|---|---|
| 口径冲突 | 两份文档对归因窗口定义不同 | 返回 `citation_conflict`，展示来源和更新时间，建议人工确认 |
| 时间冲突 | 新旧 SOP 同时被召回 | 优先 updated_at 新且 Owner 确认的知识 |
| 权限冲突 | 某证据用户无权查看 | 不展示证据内容，仅说明权限不足 |
| 工具与知识冲突 | 报表字段和 SOP 口径不一致 | 标记为待确认，不输出确定结论 |

## 2. 意图识别与路由

### 2.1 Intent Taxonomy

| 意图 | 定义 | 用户示例 | 路由目标 | 置信度门槛 | 低置信度处理 |
|---|---|---|---|---|---|
| `campaign_performance_diagnosis` | 投放效果或指标异常诊断 | “昨天巴西安卓 CPA 为什么涨了？” | `wf_campaign_performance_v1` | 待评测确认，建议先用规则层复算 | 追问指标、对象、时间 |
| `attribution_discrepancy_check` | 平台/MMP/BI 数据不一致 | “MMP 安装比平台少 30%” | `wf_attribution_discrepancy_v1` | 同上 | 追问 app/campaign/event/timezone |
| `knowledge_lookup` | 概念、口径、SOP 查询 | “什么是 click attribution window？” | `wf_knowledge_lookup_v1` | 同上 | 如果检索不可靠则拒答 |
| `out_of_scope_customer_reply_generation` | 请求客户可见回复 | “帮我写给客户的回复” | `wf_out_of_scope_fallback_v1` | intent 命中即高风险 | 说明当前只支持内部诊断 |
| `out_of_scope_sdk_or_creative` | SDK/API 深排或素材审核 | “SDK 为什么不上报？” | `wf_out_of_scope_fallback_v1` | intent 命中即范围外 | 记录需求，建议人工 |
| `out_of_scope_operation_change` | 修改投放配置 | “帮我把预算降到 100” | `wf_refusal_v1` | intent 命中即高风险 | 拒绝自动执行 |
| `out_of_scope_billing_contract` | 合同、账单、赔偿、法律承诺 | “客户要赔偿怎么回复？” | `wf_refusal_v1` | intent 命中即高风险 | 转人工 |
| `unknown` | 无法判断 | “这个为什么不对？” | `wf_clarification_v1` | 低 | 追问 |

### 2.2 路由输出契约

总控路由必须输出结构化对象，至少包含：

| 字段 | 说明 | 规则层处理 |
|---|---|---|
| intent | 预测意图 | 必须落入枚举，非法改为 `unknown` |
| language | 用户语言 | 支持 zh/en/mixed |
| entities | account、campaign、app、event、metric、time_range、timezone、mmp 等 | 规则层校验必填项 |
| missing_fields | 缺失字段 | 规则层可追加 |
| risk_signals | 权限、敏感、客户可见、操作变更等风险信号 | 规则层复算风险 |
| next_action | `route_to_workflow`、`ask_clarification`、`refuse`、`out_of_scope` | 与 intent/字段/风险一致 |
| selected_workflow | workflow ID | 规则层最终确定 |
| tool_plan | 允许调用的工具和参数白名单 | 不允许模型新增工具 |
| retrieval_plan | query、source_type、实体过滤、locale | 只用于检索 |

### 2.3 Slot Filling

| 场景 | 缺失参数 | 追问话术原则 | 默认值策略 |
|---|---|---|---|
| 投放异常 | account/campaign、metric、time_range、timezone | 一次最多追问 2-3 个关键字段 | 不默认 campaign；timezone 可用账户默认但需展示 |
| 归因核对 | app/campaign、event、mmp、time_range、timezone | 优先追问能唯一定位报表的字段 | install 差异场景可默认 event 为 `install`，但需标注 |
| 知识查询 | source_type 或语义不清 | 追问业务语境 | 不猜测客户或账户 |
| 权限不足 | 权限范围缺失 | 提示申请权限或联系 Owner | 不绕过权限 |

## 3. Tool Use / Agent 策略

### 3.1 工具注册表

| tool_id | 执行工具名 | 工具描述 | 必填参数 | 参数类型/校验 | 权限 | 风险级别 | 是否需确认 |
|---|---|---|---|---|---|---|---|
| `search_knowledge_base` | `search_knowledge_base` | 检索知识库 | query | string；支持 source_type、locale、entity filters | knowledge_read | 低 | 否 |
| `search_similar_cases` | `search_similar_cases` | 检索脱敏历史案例 | issue_type 或 query | enum/string；脱敏过滤 | case_read | 低 | 否 |
| `get_platform_report` | `get_platform_report` | 查询平台侧聚合指标 | account_id、time_range | account/campaign/app/event/timezone 按场景校验 | account_scope | 中 | 否 |
| `get_mmp_report` | `get_mmp_report` | 查询 MMP 聚合指标 | app_id、time_range、mmp | campaign/event/timezone 按场景校验 | mmp_access | 中 | 否 |
| `get_postback_summary` | `get_postback_summary` | 查询聚合 postback 状态 | app_id、time_range | campaign/event 可选；不得返回 raw URL | postback_summary_read | 中 | 否 |

工具规则：

1. 工具均为只读。
2. 工具参数由 workflow 和规则层校验，模型不得自由构造未注册参数。
3. 工具失败不由模型编造结果，必须进入 `tool_degraded` 或 `partial_evidence`。
4. 工具结果必须转为 Evidence Object 后才能被诊断引用。
5. 任何新增工具都必须同步更新实现层、评测计划和 Badcase trace。
6. P0 中 `tool_id` 与执行工具名保持一致；旧版工具名只允许作为服务端 alias，不能暴露给模型路由。

### 3.2 Agent/Workflow 边界

| 模块 | AI 负责 | 确定性系统负责 |
|---|---|---|
| 总控路由 | 理解自然语言、提取候选实体、生成检索计划 | intent 枚举校验、风险复算、权限校验、workflow 选择 |
| 投放诊断 | 解释证据、组织原因排序、生成自然语言摘要 | 指标计算、工具调用、异常阈值、最终置信度 |
| 归因核对 | 对固定核查项做证据解释和摘要 | 差异比例计算、字段校验、工具调用、核查清单模板 |
| 知识查询 | 基于引用生成回答 | 检索、权限过滤、rerank、引用冲突检测 |
| Delivery Guard | 生成用户可读限制说明 | 决定哪些内容可展示、是否需人工确认 |
| Judge AI | 离线评分和 Badcase 辅助分类 | 上线门禁、回归执行、人工最终复核 |

## 4. Prompt 与上下文组装

本 PRD 不保存完整 Prompt 和 few-shot。实现需要另建 prompt 基线文件或工程配置；本文件只定义 Prompt 契约。

| 模块 | 输入上下文 | 输出结构 | 禁止项 |
|---|---|---|---|
| Router Prompt | user_query、context_snapshot、permission_scope、tool_registry、phase_scope、history_summary | routing_result | 禁止输出最终业务结论；禁止新增工具 |
| RAG Answer Prompt | user_query、selected_citations、permission_scope、locale | answer、citation_refs、limitations、delivery_state | 禁止无引用确定回答 |
| Campaign Diagnosis Prompt | routing_result、metric_evidence、knowledge_evidence、similar_cases、business_rules | reason_ranking、evidence_refs、missing_evidence、next_steps | 禁止修改预算/出价；禁止无证据断言 |
| Attribution Check Prompt | routing_result、platform_report、mmp_report、postback_summary、policy_evidence、checklist | discrepancy_summary、checklist_status、reason_ranking、next_steps | 禁止读取 raw log；禁止把相关性写成因果 |
| Delivery Guard Prompt | workflow_output、evidence_objects、risk_result、permission_result | delivery_output、user_message、state | 禁止展示越权数据；禁止生成客户可发最终回复 |
| Judge Prompt | eval_case、trace、expected_output、actual_output、evidence_objects | scores、failure_labels、blocking_issues | 不作为线上必经链路 |

### 4.1 上下文裁剪

| 上下文 | 进入模型条件 | 裁剪规则 |
|---|---|---|
| 会话历史 | 多轮追问或字段补充 | 只保留关键实体、用户确认和未解决问题 |
| 工具结果 | 工具调用成功 | 转为结构化摘要和 Evidence Object，不传敏感 raw 数据 |
| 知识片段 | rerank 后入选 | 只传当前用户有权访问的片段 |
| 历史案例 | 脱敏且相关 | 去除客户名、账号、金额承诺和敏感字段 |

## 5. 安全、拒答与降级

| 状态 | 触发条件 | 系统行为 | 用户提示 | 后续路径 |
|---|---|---|---|---|
| `ready` | 证据充分、权限通过、无需人工确认 | 展示诊断/知识回答 | 明确证据来源和下一步动作 | 采纳/追问/升级 |
| `human_review_required` | 结论影响大、对客户可见、证据需专家判断 | 标记需人工确认 | “该结论建议人工确认后使用。” | 人工复核 |
| `partial_evidence` | 缺关键字段或工具 | 输出部分核查方向 | “当前仅基于部分证据。” | 追问/补数据 |
| `tool_degraded` | 工具失败、超时、缓存 | 不编造数据 | “数据工具暂不可用。” | 重试/人工上传 |
| `no_reliable_citation` | RAG 无可靠引用 | 不输出确定答案 | “当前知识库未找到可靠来源。” | 提交知识缺口 |
| `citation_conflict` | 来源冲突 | 列出冲突，不做定论 | “不同来源口径不一致。” | 人工确认 |
| `permission_blocked` | 无权访问工具或证据 | 拦截工具和证据展示 | “无权查看该数据范围。” | 申请权限 |
| `out_of_scope` | 非本版支持范围 | 拒绝或记录需求 | “当前阶段不支持该类型请求。” | 后续需求 |
| `system_error` | schema、模型、系统异常 | 返回 trace_id | “系统异常，请稍后重试。” | 重试/反馈 |

## 6. AI 能力待确认

| 问题 | 影响 | 建议验证方式 |
|---|---|---|
| Top-K、rerank 阈值、引用可靠阈值 | 影响 RAG 命中和无答案率 | 离线 RAG triad + 人工评审 |
| 模型供应商和部署方式 | 影响成本、延迟、合规 | 候选模型对比评测 |
| 投放异常阈值与规则 | 影响诊断准确率 | 采集历史异常样本，和资深 AdOps 对齐 |
| MMP/postback 工具字段 | 影响归因核对完整性 | 与数据平台确认 API schema |
| 客户可见内容边界 | 影响后续是否做客户回复 | 安全/法务/CS 评审 |
