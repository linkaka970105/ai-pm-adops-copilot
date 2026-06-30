# Badcase 数据飞轮：AdOps Copilot 投放归因排障助手 v2

## 来源链接

- 实现层总文档：[03-implementation.md](03-implementation.md)
- AI 能力策略：[04-ai-capability-spec.md](04-ai-capability-spec.md)
- AI 评测计划：[05-ai-evaluation-plan.md](05-ai-evaluation-plan.md)

## 0. 设计目标

Badcase 机制不是一个“反馈箱”，而是一套事件驱动的质量回流系统。它要把线上错误、证据缺口、工具失败、用户挫败和人工修正转化为可分派、可修复、可回归验证的数据资产。

本产品中的 Badcase 不只等于最终回答错误。对于多轮排障助手，即使最终答案正确，只要过程出现绕远、重复调用、忘记关键槽位、成本过高、证据冲突未处理、权限边界不清，也应进入 Badcase 观察或标注队列。

## 1. Badcase 定义与标签体系

| 标签 | 判定口径 | 严重度 | 典型现象 | 处理 Owner |
|---|---|---|---|---|
| `intent_error` | 意图识别错误或范围外漏判 | 高 | 客户回复请求误入诊断；SDK 深排误入归因核对 | 产品/算法 |
| `missing_field_error` | 必填字段缺失但未追问 | 中 | 无 campaign/app/timezone 就调用工具 | 产品/算法 |
| `permission_error` | 越权调用或越权展示 | 严重 | 无 MMP 权限却展示 MMP 数据 | 研发/安全 |
| `tool_selection_error` | 工具选择错误 | 高 | 归因差异未调用 MMP 报表或 postback 摘要 | 算法/研发 |
| `tool_execution_error` | 工具超时、4xx/5xx、schema 错误或参数非法 | 中 | 工具返回字段缺失、参数类型错误 | 研发 |
| `rag_retrieval_error` | 检索内容不相关、遗漏关键 SOP | 中 | 问归因窗口却召回素材审核文档 | 算法/知识库 |
| `citation_error` | 引用不支持结论或引用冲突未处理 | 高 | 证据说时区一致，回答说时区不一致 | 算法/知识库 |
| `reasoning_error` | 证据解释或原因排序错误 | 高 | 把 postback delay 当作唯一确定主因 | 算法/产品 |
| `unsafe_output` | 输出客户承诺、操作建议或敏感内容 | 严重 | 生成可直接发客户的话术或建议改预算 | 产品/安全 |
| `ux_failure` | 追问过长、不可操作、用户中断 | 中 | Agent 连续追问多个字段后用户退出 | 产品/设计 |
| `cost_latency_outlier` | 成本或延迟异常 | 中 | 简单知识问题调用多个工具且超时 | 算法/研发 |
| `knowledge_gap` | 知识库缺失或过期 | 中 | 无法解释某 MMP 新规则 | 知识库 Owner |

## 2. 直接 Badcase 判定

| 类型 | 判定规则 | 数据来源 | 自动化方式 |
|---|---|---|---|
| 任务未完成 | 用户明确诉求未达到终态，且未给出合理下一步 | session/turn/feedback | 用户点踩、人工抽检、Judge 辅助 |
| 工具/参数错误 | 工具参数缺失、类型错误、权限不匹配、API 4xx/5xx | tool_call_log | 自动入队 |
| Schema/JSON 错误 | 模型输出不符合 routing/workflow/delivery schema | parser log | 自动入队 |
| 工具幻觉 | 模型要求调用未注册工具或未注册参数 | routing_result/tool_plan | 自动入队 |
| 记忆漂移 | 忘记用户前文确认的 campaign、event、time range 等 | session summary | 人工/Judge 辅助 |
| 前后矛盾 | 同一会话对同一事实给出冲突结论 | turn history | Judge 辅助 |
| RAG 幻觉/越界 | 回答无法被 citation/evidence 支撑 | evidence_refs + answer | 自动校验 + 人工复核 |
| 权限越界 | 无权限数据被调用或展示 | permission log | 自动 P0 事故 |
| 客户可见误输出 | P0 中生成可直接发客户的话术 | delivery_output | 安全集和线上监控 |

## 3. 间接 Badcase / 影子指标

| 指标 | 计算方式 | Badcase 阈值 | 对应问题 |
|---|---|---|---|
| Session Turns | 单次任务回合数 | 超过场景 P95 或 > 8 | 追问过多、任务迷失 |
| Tool Calls per Task | 单任务工具调用次数 | 超过场景 P95 或 > 6 | 工具规划不合理 |
| Duplicate Tool Call | 同一工具同参数重复调用 | >= 3 次 | 循环或状态未记录 |
| Token Cost | 单会话 token/cost | Top 5% 或超预算阈值 | 成本异常 |
| Latency | 首版可用诊断耗时 | 超 P95 阈值 | 工具/模型/检索慢 |
| Regeneration Count | 同一回答重新生成次数 | >= 2 | 用户不满意或输出不稳 |
| Abrupt Churn | Agent 追问后用户关闭或长时间无响应 | 追问后直接退出 | 追问体验差 |
| Negative Sentiment | 用户出现负向表达 | 命中“不对”“别绕圈子”“人工”“投诉”等 | 体验或质量问题 |
| No Evidence Ready | delivery_state 为 no_reliable_citation/partial_evidence 频繁出现 | 按场景异常升高 | 知识或工具缺口 |

## 4. Trace 埋点字段

| 字段 | 说明 | 来源 | 是否必填 |
|---|---|---|---|
| trace_id | 完整轨迹 ID | 系统生成 | 是 |
| session_id | 会话 ID | 会话系统 | 是 |
| turn_id | 回合 ID | 会话系统 | 是 |
| user_id_hash | 脱敏用户 ID | 鉴权系统 | 是 |
| user_role | AdOps/AM/UA/Tech Support 等 | 用户系统 | 是 |
| entry_point | 入口来源 | 前端 | 是 |
| user_query | 用户输入，必要时脱敏 | 前端 | 是 |
| intent_pred | 预测意图 | 总控 | 是 |
| selected_workflow | 最终 workflow | 规则层 | 是 |
| entities | 抽取实体 | 总控/规则层 | 是 |
| missing_fields | 缺失字段 | 规则层 | 否 |
| risk_signals | 风险信号 | 总控/规则层 | 是 |
| risk_level_final | 规则层风险等级 | 规则层 | 是 |
| confidence_components | 模型输出置信度组件 | 总控/诊断 | 否 |
| confidence_final | 规则层最终置信度 | 规则层 | 否 |
| retrieved_chunk_ids | 检索片段 ID | RAG | 否 |
| citation_ids | 引用 ID | RAG | 否 |
| evidence_ids | Evidence Object ID | Evidence Builder | 否 |
| tool_calls | 工具名、参数摘要、状态、耗时、错误码 | 工具网关 | 否 |
| prompt_versions | prompt 版本 | Prompt 管理 | 是 |
| models_used | 模型和供应商版本 | 模型服务 | 是 |
| delivery_state | 前端交付状态 | Delivery Guard | 是 |
| latency_ms | 总耗时和分段耗时 | 系统 | 是 |
| estimated_cost | 单会话成本估算 | 成本模块 | 否 |
| user_feedback | 采纳、无帮助、证据不足、升级等 | 前端 | 否 |
| regenerate_count | 重新生成次数 | 前端 | 否 |
| close_after_agent_question | 追问后是否关闭 | 前端 | 否 |
| judge_scores | 离线裁判分数 | 评测系统 | 否 |

## 5. Badcase 漏斗

### 5.1 第一层：确定性漏斗

| 规则 | 阈值 | 自动标签 | 去向 |
|---|---|---|---|
| schema 解析失败 | > 0 | `schema_error` | 研发/算法 |
| 未注册工具或参数 | > 0 | `tool_hallucination` | 算法/研发 |
| 工具 4xx/5xx/timeout | > 0 | `tool_execution_error` | 研发 |
| 无权限工具调用 | > 0 | `permission_error` | 安全 P0 |
| 无 evidence 输出 ready | > 0 | `citation_error` | 算法/产品 |
| 客户回复/预算变更未拦截 | > 0 | `unsafe_output` | 安全 P0 |
| 重复工具调用 | >= 3 | `duplicate_tool_call` | 算法/研发 |

### 5.2 第二层：行为与情绪漏斗

| 规则 | 阈值/关键词 | 自动标签 | 去向 |
|---|---|---|---|
| 用户点踩 | 任意 | `user_negative_feedback` | 标注队列 |
| 证据不足反馈 | 任意 | `citation_error` 或 `knowledge_gap` | 知识/算法 |
| 重新生成 | >= 2 | `response_quality_issue` | 标注队列 |
| 要求人工 | “人工”“转人”“找技术”等 | `handoff_needed` | 运营/产品 |
| 负向表达 | “不对”“听不懂”“别绕圈子”“投诉”等 | `ux_or_quality_failure` | 产品/运营 |
| 追问后退出 | close_after_agent_question=true | `slot_filling_ux_failure` | 产品/设计 |

### 5.3 第三层：LLM-as-a-Judge 漏斗

| 评分项 | 通过线 | 自动标签 | 去向 |
|---|---|---|---|
| Conversation Completeness | 低于 3/5 入队 | `task_incomplete` | 人工复核 |
| Knowledge Retention | 关键槽位遗忘即入队 | `memory_drift` | 算法 |
| Faithfulness | 低于 0.8 入队 | `rag_hallucination` | 算法/知识 |
| Answer Relevance | 低于 3/5 入队 | `response_quality_issue` | 产品/算法 |
| Tool Correctness | 工具或参数错误即入队 | `tool_selection_error` | 算法/研发 |

Judge 结果只做入队和辅助分派，不替代人工复核。

## 6. 标注队列

| 字段 | 说明 |
|---|---|
| case_id | Badcase ID |
| trace_id | 对应 trace |
| session_id | 会话 ID |
| auto_label | 自动标签 |
| manual_label | 人工标签 |
| severity | low/medium/high/critical |
| issue_type | 投放诊断、归因核对、知识查询、安全、工具、体验等 |
| business_context | account/campaign/app/event/time range 的脱敏摘要 |
| reviewer | 复核人 |
| owner_team | 产品/算法/研发/知识/运营/安全 |
| root_cause | Prompt/RAG/Router/Tool/Workflow/UX/Policy/Data/Permission/System |
| fix_action | 修复动作 |
| fixed_version | 修复版本 |
| regression_required | 是否必须加入回归集 |
| status | open/in_review/fixed/verified/closed/reopened |
| closed_reason | 关闭原因 |

### 6.1 分派规则

| 根因 | Owner | 修复动作 |
|---|---|---|
| Prompt | 算法/产品 | 改 Prompt 契约或 few-shot，重跑相关回归 |
| RAG | 算法/知识库 | 调整 chunk、metadata、rerank 或补知识 |
| Router | 算法/产品 | 调整 intent 边界、缺字段规则或风险枚举 |
| Tool | 研发/数据 | 修复 API、schema、权限或重试策略 |
| Workflow | 产品/研发/算法 | 调整固定核查项、工具顺序或交付状态 |
| UX | 产品/设计 | 调整追问、提示、卡片和反馈入口 |
| Permission/Safety | 研发/安全/产品 | 修复权限、脱敏、拒答或人工确认 |
| Data | 数据/运营 | 修复报表口径、延迟、字段或 Owner |

## 7. 回归数据集沉淀

确认后的典型 Badcase 必须清洗为 Regression Dataset。

| 字段 | 说明 |
|---|---|
| case_id | 来源 Badcase |
| full_dialogue | 完整多轮对话，脱敏 |
| context_snapshot | 当时上下文 |
| expected_intent | 期望意图 |
| expected_entities | 期望实体 |
| expected_route | 期望 workflow |
| expected_tool_calls | 期望工具轨迹 |
| expected_citations | 期望引用 |
| expected_evidence | 期望证据对象 |
| expected_answer | 期望回答或诊断要点 |
| badcase_label | 失败标签 |
| root_cause | 根因 |
| fixed_version | 修复版本 |
| reviewer | 标注人 |

纳入标准：

| 类型 | 是否纳入回归 | 说明 |
|---|---|---|
| 安全/权限问题 | 必须 | 防止复发 |
| 高频路由错误 | 必须 | 覆盖 intent 边界 |
| 证据不支持结论 | 必须 | 提升 groundedness |
| 工具参数/schema 错误 | 必须 | 保证工程稳定性 |
| 一次性系统故障 | 视情况 | 若有代表性则纳入 |
| 用户误操作 | 通常不纳入 | 可作为 UX 观察样本 |

## 8. 运营看板

| 看板 | 指标 |
|---|---|
| 质量总览 | Badcase 新增数、关闭数、重开率、严重等级分布 |
| 场景质量 | 投放诊断/归因核对/知识查询的 Badcase 率 |
| 安全看板 | 权限拦截、客户回复误输出、操作变更拦截、敏感字段拦截 |
| 工具看板 | 工具失败率、超时率、schema 错误、重复调用 |
| RAG 看板 | 无引用率、引用冲突率、知识缺口、过期知识命中 |
| 体验看板 | 点踩、重新生成、追问后退出、要求人工 |
| 修复看板 | Owner、SLA、平均关闭周期、回归通过率 |

## 9. 运营节奏

| 节奏 | 动作 |
|---|---|
| 每日 | 查看 critical/high Badcase、权限/安全告警、工具失败异常 |
| 每周 | 复盘高频 Badcase，更新知识库、Prompt、workflow 和回归集 |
| 每次发布前 | 跑黄金集和 Badcase 回归集，未通过不得扩量 |
| 每次知识库更新后 | 跑 RAG 召回、引用和冲突检查 |
| 每次工具 schema 变更后 | 跑工具参数、权限和 workflow E2E |
| 每次灰度扩量前 | 检查采纳率、返工率、越权率、Badcase 修复 SLA |

## 10. 待确认问题

| 问题 | 影响 | 建议 |
|---|---|---|
| 核心 Badcase 修复 SLA 是否采用 7 个工作日 | 影响运营承诺 | 灰度前由产品/运营/研发确认 |
| Badcase 复核人和 Owner 分派机制 | 影响闭环执行 | 建立最小 RACI |
| 是否允许将客户相关案例脱敏后入回归集 | 影响数据合规和样本质量 | 安全/法务确认 |
| Judge AI 评分通过线 | 影响自动入队量 | 先用人工标注校准，再设阈值 |
| 成本/延迟异常阈值 | 影响漏斗入队 | 需灰度数据后按 P95/P99 设置 |
