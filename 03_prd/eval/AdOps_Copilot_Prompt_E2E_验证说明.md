# AdOps Copilot Prompt E2E 验证说明

## 1. 文档定位

本文档用于记录 AdOps Copilot 投放归因排障助手的 Prompt 与 workflow 端到端回归验证情况。

它不是 PRD 主体内容，也不是生产模型选型依据；它的作用是说明当前验证脚本如何检查 Prompt、schema、risk/confidence 规则、workflow 分流和 evidence 引用是否可程序化回归。

对应 PRD 文件：

```text
03_prd/AdOps_Copilot_投放归因排障助手_PRD_v1.md
```

## 2. 验证脚本信息

| 项目 | 内容 |
| --- | --- |
| 脚本路径 | `03_prd/eval/adops_attribution_prompt_e2e.mjs` |
| 最新结果 | `03_prd/eval/results/adops_attribution_prompt_e2e_latest.json` |
| API 端点 | `http://127.0.0.1:8317/v1` |
| 测试模型 | `gpt-5.5` |
| 执行命令 | `node .\03_prd\eval\adops_attribution_prompt_e2e.mjs` |
| 当前测试范围 | 6 个总控路由 case + 1 个归因诊断 case |

说明：`gpt-5.5` 仅代表当前本地 OpenAI-compatible API 的验证模型，不代表 PRD 的生产选型。生产环境仍按 PRD 第 8 章优先评估 Qwen、DeepSeek、GLM 等中国厂商或可私有化部署模型。

## 3. 当前验证覆盖范围

| 验证项 | 测试方式 | 当前样例结果 |
| --- | --- | --- |
| 模型可用性 | 先请求 `/v1/models`，确认目标模型存在 | `gpt-5.5` 可用 |
| 路由 case | 纯知识查询、归因差异、越权 raw log、中文缺 campaign、操作变更、合同/赔偿六类 query | 6 个路由 case 通过 |
| 风险等级 | 模型输出 `risk_signals`，规则层复算 `risk_level_final` | 通过，越权 case 为 high |
| 置信度 | 模型输出组件分，workflow 按公式复算 `confidence_final` | 通过，并发现权限拦截 case 需要规则归一 |
| 缺字段与下一步动作 | 模型输出 `missing_fields` 和 `next_action`，workflow 按 intent 必填实体复算 | 通过；中文缺 campaign/account case 最终进入 `ask_clarification` |
| Workflow 分流 | 规则层复算 `selected_workflow_final` | 通过；知识查询进入 `wf_knowledge_lookup_v1`，归因核对进入 `wf_attribution_discrepancy_v1` |
| 归因诊断输出 | 固定工具结果：平台 installs=1250、MMP installs=900、postback success=92.4%、delay=6.8% | 归因诊断 case 通过，主因排序为 timezone mismatch，postback delay 为次要可能 |
| 证据引用 | 检查输出是否引用 `ev_metric_001`、`ev_policy_001` | 通过 |

## 4. 验证脚本与 PRD Prompt 的对齐关系

| PRD 设计项 | 验证脚本覆盖方式 | 对齐状态 |
| --- | --- | --- |
| Prompt 原文 | `7.1.6.5` 保存 routing prompt template 基线版本，`7.1.6.6` 保存完整 few-shot；验证脚本中的 `routingPromptTemplate` 与 `buildRoutingSystemPrompt()` 应与这两节同步更新 | 已对齐 |
| 总控 Prompt 变量 | 脚本传入 `current_time`、`user_query`、`conversation_context`、`user_profile`、`permission_scope`、`available_tools`、`phase_scope` | 已对齐 |
| 意图定义与边界 | Prompt 明确每个 intent 的定义、适用场景、不适用场景、必填实体、常见工具和默认风险，不只依赖 intent 名称 | 已对齐 |
| 意图枚举 | 覆盖 `campaign_performance_diagnosis`、`attribution_discrepancy_check`、`knowledge_lookup`、范围外和 `unknown` 的路由边界 | 已对齐 |
| 风险信号 | 使用 PRD 风险信号枚举，包含 `account_data_read`、`mmp_data_read`、`postback_summary_read`、`permission_gap`、`sensitive_raw_data`、`customer_visible_reply` 等 | 已对齐 |
| 模型自报风险 | 脚本要求模型输出 `risk_level_model_reported`，但最终断言使用规则层复算的 `risk_level_rule_checked` / `risk_level_final` | 已对齐 |
| 总控置信度 | 脚本要求路由模型输出 `confidence_components` 和 `confidence_model_reported`，并按 PRD 公式复算 `confidence_final` | 已对齐 |
| Workflow 分流 | 脚本对 `selected_workflow` 做规则复算，验证知识查询进入 `wf_knowledge_lookup_v1`、归因核对进入 `wf_attribution_discrepancy_v1`、缺字段进入 `wf_clarification_v1`、越权/操作变更/合同赔偿进入 `wf_refusal_v1` | 已对齐 |
| 归因核对 Prompt 变量 | 脚本使用 `diagnosisPromptTemplate` 与 `buildDiagnosisSystemPrompt()`，将 `trace_context`、`routing_result`、`user_query`、`platform_report`、`mmp_report`、`postback_status`、`attribution_policy_context`、`event_mapping`、`evidence_objects`、`business_rules` 渲染进 system prompt 的「运行时输入」 | 已对齐 |
| 归因核对 Prompt 输出 | 脚本要求输出固定检查项：timezone、attribution_window、event_mapping、postback_delay、dedup_or_reattribution、privacy_or_invalid_traffic、channel_mapping、data_freshness，并断言 event_mapping 状态不缺失；模型不得输出 `confidence` / `confidence_final`，由脚本规则层回写 `confidence_final_rule_checked` | 已对齐 |
| Evidence Object | 诊断断言要求输出引用 `ev_metric_001`、`ev_policy_001`，关键结论必须绑定 evidence_id | 已对齐 |
| Query 改写 / 投放诊断 / 知识查询 / 安全交付 / Judge AI Prompt | PRD 已统一为运行时变量插槽、变量来源表、输入上下文解释和输出 schema；当前脚本尚未覆盖这些 prompt 的模型回归 | 待扩展验证 |

## 5. 最新测试中的关键发现

1. 缺少 `risk_level` 评判标准时，模型可能把“客户反馈问题”误判为“客户可见回复”，导致不必要的 high risk。Prompt 已补充规则：提到客户反馈不等于请求外部回复。
2. 总控路由可以输出 `confidence_components` 供规则层复算；场景诊断 Prompt 不再输出数值 `confidence`，只输出证据覆盖和缺失项，最终前端展示使用 `delivery_guard_output.confidence_final`。
3. 模型输出的 `missing_fields` 和 `next_action` 也需要规则复算。若 intent 的必填实体缺失，即使模型想进入 workflow，也必须先追问。
4. 固定归因核查清单应由 workflow 加载，不应由 LLM 每次自由拆解。
5. 诊断模型只负责证据解释和原因排序；差异比例、工具调用、权限和最终风控由确定性系统处理。
6. 合同/赔偿、客户回复和操作变更类 intent 即使模型没有稳定输出高风险信号，也必须由规则层按 intent 直接判为 high，避免高风险范围外请求漏拦。

## 6. 暂不调整项

当前不扩展 E2E 脚本覆盖范围，仍保持现有总控路由与归因诊断验证。后续若需要补充 Query 改写、投放诊断、知识查询、安全交付或 Judge AI 的模型回归，再单独更新脚本和本文档。
