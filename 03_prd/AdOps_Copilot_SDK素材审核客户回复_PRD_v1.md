# AdOps Copilot SDK/API 排障、素材审核与客户回复 PRD v1.0

| 项目 | 内容 |
| --- | --- |
| 产品名称 | AdOps Copilot：SDK/API 排障、素材审核与客户回复扩展能力 |
| 文档版本 | v1.0 Draft |
| 拆分来源 | AdOps Copilot 产品需求文档 v6.0 |
| 更新时间 | 2026-06-20 |
| 选型时间假设 | 2025 年初可稳定商用或可进入生产评估的模型与技术 |
| 前置依赖 | AdOps Copilot 投放归因排障助手 PRD v1.0 的总控、RAG、工具网关、权限、Trace、评测和 Badcase 底座 |
| 当前范围 | SDK/API/日志技术排障、素材审核与合规排查、客户英文回复生成与审核 |
| 不在当前范围 | 投放效果异常诊断、归因与数据不一致核对，这些由第一阶段投放归因排障助手承载 |
| 文档目的 | 定义第二阶段扩展能力，明确 SDK/API、素材审核和客户回复的功能范围、AI 能力、工具设计、模型选型、评测上线和运营机制 |

# 目录

1. [项目摘要](#1-项目摘要)
2. [整体项目规划](#2-整体项目规划)
3. [用户、场景与范围](#3-用户场景与范围)
4. [目标、指标与价值测算](#4-目标指标与价值测算)
5. [整体业务流程与系统架构](#5-整体业务流程与系统架构)
6. [数据依赖与数据资产战略](#6-数据依赖与数据资产战略)
7. [独立需求 PRD](#7-独立需求-prd)
8. [用户体验与关键页面](#8-用户体验与关键页面)
9. [模型选型与技术方案](#9-模型选型与技术方案)
10. [工具、权限、安全与合规](#10-工具权限安全与合规)
11. [评测、灰度与上线](#11-评测灰度与上线)
12. [管理后台与运营流程](#12-管理后台与运营流程)
13. [发布计划](#13-发布计划)
14. [风险与待确认问题](#14-风险与待确认问题)
15. [附录](#15-附录)

# 1. 项目摘要

本 PRD 是 AdOps Copilot 的第二部分，承接第一阶段“投放归因排障助手”已经建立的总控智能体、RAG 知识库、工具网关、权限、Trace、评测和 Badcase 底座，继续扩展三类能力：SDK/API/日志技术排障、素材审核与合规排查、客户英文回复生成与审核。

这一阶段的目标不是重新做一个全新的 Copilot，而是在已有排障底座上补齐更复杂、更高风险、跨团队依赖更强的场景：技术排障需要处理日志和错误码，素材审核需要处理图文和政策风险，客户回复需要把内部诊断转化为可对外沟通的英文草稿并控制承诺风险。

# 2. 整体项目规划

## 2.1 产品定位

| 维度 | 定位 |
| --- | --- |
| 产品类型 | AdOps Copilot 第二阶段扩展能力，面向技术排障、审核合规和客户沟通 |
| 核心价值 | 降低技术支持重复排查成本，提升审核一致性，提升英文客户回复质量和安全性 |
| AI 形态 | RAG + 多模态识别 + OCR + 规则引擎 + 工具调用 + 回复审核 + 人工确认 |
| 主要产出 | SDK/API 排障报告、素材风险标签、审核建议、英文客户回复草稿、风险审核结果、Badcase 记录 |
| 不做什么 | 不替代人工最终审核，不自动发送客户邮件，不直接修改 SDK/API 配置，不绕过第一阶段权限和工具网关 |

## 2.2 产品愿景

当投放归因排障助手已经能处理指标和数据差异后，AdOps 团队的下一类高频问题会集中到三条链路：技术链路、审核链路和客户沟通链路。第二阶段扩展能力希望把这些链路也纳入同一个可控的 Copilot 工作台，让一线用户可以在同一个入口完成问题识别、证据检索、工具查询、风险判断、人工确认和 Badcase 回流。

这一阶段的产品能力可以概括为五句话：

1. 技术问题说得清：把错误码、日志、postback、SDK/API 文档转成可执行排查步骤。
2. 素材风险看得准：用多模态和 OCR 辅助识别素材、落地页、文案中的政策风险。
3. 客户回复写得稳：基于已确认事实生成英文草稿，不编造、不推责、不承诺未经确认的信息。
4. 高风险动作控得住：审核结论和客户可见回复必须经过人工确认。
5. 线上错误能回流：技术、审核、回复 Badcase 都进入评测集和知识库迭代。

## 2.3 核心用户旅程

```text
用户提出技术、素材或客户回复问题
  -> 总控智能体识别意图、语言、风险等级和所需数据
  -> 系统确认用户权限、账户范围和工具可用性
  -> 检索 SDK/API 文档、审核政策、历史案例、回复规范
  -> 按场景调用日志、素材状态、OCR、多模态、政策检索等工具
  -> 汇总证据并生成排障报告、审核建议或回复草稿
  -> 风险审核模型和规则引擎二次检查
  -> 高风险内容进入人工审核队列
  -> 用户反馈是否有效
  -> Badcase 回流到知识库、评测集、Prompt 和工具设计
```

## 2.4 核心功能地图

| 模块 | 解决的问题 | 当前阶段产出 | 依赖能力 |
| --- | --- | --- | --- |
| SDK/API 排障 | SDK 初始化、API 请求、postback、事件回传等问题排查慢 | 错误码解释、日志摘要、修复步骤、升级摘要 | 技术文档 RAG、日志检索、脱敏规则 |
| 素材审核辅助 | 素材、落地页、文案政策风险人工判断成本高 | 风险标签、证据位置、政策引用、审核建议 | 多模态模型、OCR、政策知识库、规则引擎 |
| 客户英文回复 | 对外英文回复质量不稳定，容易无证据承诺 | 英文回复草稿、内部备注、风险检查结果 | 诊断证据、回复规范、LLM、审核规则 |
| 回复风险审核 | 草稿中可能有过度承诺、敏感信息、未证实结论 | 风险标记、阻断项、修改建议 | Judge 模型、规则引擎、人工审核 |
| Badcase 与知识运营 | 技术、审核、回复错误难复盘 | Badcase 工单、修复状态、评测样本 | 人工标注、版本管理、评测平台 |
| 管理后台 | Prompt、工具、政策、模型灰度缺少统一管理 | 配置、灰度、审计、看板 | 权限、Trace、实验平台 |

## 2.5 与投放归因排障 PRD 的关系

| 能力 | 第一阶段投放归因 PRD | 当前扩展 PRD |
| --- | --- | --- |
| 总控智能体 | 已建立统一入口、意图识别、权限路由 | 扩展意图类型和范围外/高风险路由 |
| RAG 知识库 | 已支持投放 SOP、指标口径、归因口径 | 增加 SDK/API 文档、审核政策、回复规范 |
| 工具网关 | 已支持报表、归因、postback 摘要查询 | 增加日志检索、素材状态、OCR/视觉、回复审核工具 |
| 评测平台 | 已支持意图、投放、归因、安全集 | 增加技术排障、素材审核、回复质量、风险审核评测集 |
| Badcase 闭环 | 已支持投放归因 Badcase | 扩展技术、审核、回复 Badcase 分类 |

# 3. 用户、场景与范围

## 3.1 目标用户

| 用户角色 | 典型工作 | 主要痛点 | Copilot 价值 |
| --- | --- | --- | --- |
| 技术支持 | 排查 SDK、API、postback、事件回传和日志问题 | 问题上下文不完整，重复查询多 | 自动整理日志证据、错误码解释和修复步骤 |
| 审核/合规运营 | 判断素材、落地页、行业政策和品牌安全风险 | 审核规则复杂，人工一致性不足 | 辅助识别风险并保留人工裁决 |
| 广告投放运营 | 遇到素材拒审、事件回传、客户追问时协调处理 | 需要跨技术、审核、客户团队协作 | 获得结构化排障结果和可复用说明 |
| 客户成功/AM | 响应客户问题，解释排障进展和处理结论 | 英文表达质量不稳定，容易缺证据或过度承诺 | 生成有证据的英文回复草稿，减少返工 |
| 管理者 | 关注技术工单效率、审核质量、客户沟通风险 | 难量化 AI 带来的效率与风险变化 | 看板化追踪采纳率、风险拦截率、Badcase 修复 |

## 3.2 核心场景

| 场景 | 示例问题 | 期望输出 |
| --- | --- | --- |
| SDK 初始化失败 | SDK init failed on Android version 5.2.1. | 错误原因、文档引用、修复步骤、升级摘要 |
| API 请求失败 | API returns 401/403/500. What should we check? | 错误码解释、鉴权/参数/频控排查路径 |
| postback 异常 | Postback failed with error code xxx. | 回调状态、拒收原因、修复建议 |
| 素材审核 | Is this landing page risky for finance ads? | 风险标签、证据位置、政策引用、人工审核建议 |
| 落地页合规 | The landing page has aggressive claims. Is it allowed? | OCR 文案、风险判断、政策依据 |
| 客户英文回复 | Help me reply to the client about low CVR / rejected creative / postback failure. | 英文回复草稿、内部备注、风险提示 |

## 3.3 当前范围

| 范围 | 说明 |
| --- | --- |
| 内部员工使用 | 面向技术支持、审核/合规运营、AdOps、AM 和管理角色 |
| 英文系统界面 | 用户主要在英文后台中使用，中文内部知识可被检索和总结 |
| 技术排障辅助 | 支持 SDK/API 错误码、日志摘要、postback 排障和升级摘要 |
| 素材审核辅助 | 支持图片、落地页截图、OCR 文案和政策知识库辅助判断 |
| 客户回复草稿 | 基于已确认事实生成英文草稿，必须人工确认后才能对外发送 |
| 证据型回答 | 关键结论必须引用文档、日志摘要、政策、审核规则或诊断证据 |
| 可评估上线 | 每个核心智能体必须具备黄金集、Badcase、灰度和回滚机制 |

## 3.4 当前范围外

| 范围外事项 | 原因 |
| --- | --- |
| 投放效果异常诊断 | 已由第一阶段投放归因排障助手承载 |
| 归因与数据不一致核对 | 已由第一阶段投放归因排障助手承载 |
| 自动修改 SDK/API 配置 | 涉及生产风险，需要工程审批和变更管理 |
| 自动审核通过或拒绝素材 | 审核结论涉及政策和商业风险，当前阶段只做辅助判断 |
| 自动发送客户邮件 | 涉及对外承诺和合规风险，当前阶段只生成草稿 |
| 训练自有基础大模型 | 优先使用商用/开源模型和可控工作流，不投入基础模型训练 |

# 4. 目标、指标与价值测算

## 4.1 产品目标

1. 让技术支持能更快定位 SDK/API/postback 问题，并生成可转交工程团队的结构化摘要。
2. 让审核团队获得素材和落地页风险预判，提高审核一致性和效率。
3. 让 AM/CS 能基于已确认事实生成专业、安全、可人工确认的英文回复草稿。
4. 让技术、审核、回复三类 Badcase 进入统一知识库和评测闭环。
5. 让高风险输出保持可控、可审计、可回滚。

## 4.2 业务目标

| 指标 | 目标口径 | 当前阶段目标 |
| --- | --- | --- |
| 技术排障首响时间 | 从提交 SDK/API 问题到生成首版排障摘要 | 较人工基线下降 30% 以上 |
| 错误码召回率 | 正确召回相关错误码文档和历史案例的比例 | 95% 以上 |
| 素材高风险召回 | high/blocked 样本被识别的比例 | 90% 以上 |
| 客户回复可发送率 | 人工轻微编辑即可发送的回复草稿比例 | 70% 以上 |
| 回复风险漏检率 | 高风险承诺、敏感信息、未证实结论未被拦截的比例 | 2% 以下 |
| Badcase 修复周期 | 从标记 Badcase 到纳入修复版本 | 核心场景小于 7 个工作日 |

## 4.3 AI 质量目标

| 指标 | 说明 | 当前阶段门槛 |
| --- | --- | --- |
| 意图识别准确率 | 正确识别 SDK/API、素材审核、客户回复等问题类型 | 90% 以上 |
| 文档引用准确率 | 排障和审核回答中引用文档与结论匹配的比例 | 90% 以上 |
| 日志脱敏准确率 | 敏感字段在展示和模型输入前被屏蔽的比例 | 100% |
| OCR 有效识别率 | 核心素材/落地页文案识别准确率 | 95% 以上 |
| 高风险素材召回率 | 高风险素材或落地页被识别的比例 | 90% 以上 |
| 英文回复可发送率 | 人工轻微编辑即可发送的比例 | 70% 以上 |
| 越权工具调用率 | 调用用户无权访问的数据工具 | 0 |
| 高风险自动执行率 | 未经人工确认执行高风险动作 | 0 |

## 4.4 北极星指标

北极星指标为“AI 辅助完成的扩展场景处理会话数”。

该指标必须同时满足三个条件：用户发起真实 SDK/API、素材审核或客户回复问题；Copilot 给出带证据的排障、审核或回复结果；用户确认有效、采纳或完成后续动作。单纯模型调用次数、素材扫描次数、草稿生成次数不作为核心成功指标。

## 4.5 价值测算模型

| 价值项 | 计算方式 | 数据来源 |
| --- | --- | --- |
| 技术排障人效节省 | 月技术问题数 × 平均节省分钟数 × 技术支持人力成本 | 工单系统、Copilot 日志 |
| 审核效率提升 | 月素材审核量 × AI 预审节省分钟数 × 审核人力成本 | 审核系统、审核后台 |
| 回复返工减少 | 回复草稿数 × 原返工率下降 × AM/CS 人力成本 | 回复审核记录、客户沟通记录 |
| 风险减少 | 高风险回复/素材拦截数 × 预估风险成本 | 审核队列、风险事件记录 |
| 知识资产沉淀 | 新增有效知识条数、Badcase 关闭数、复用次数 | 知识库后台、评测平台 |

# 5. 整体业务流程与系统架构

## 5.1 端到端业务流程

```text
问题输入
  -> 会话创建
  -> 用户身份、角色、账户权限校验
  -> 语言识别与意图识别
  -> 风险分级
  -> 任务拆解
  -> SDK/API 文档、审核政策、回复规范检索
  -> 工具调用计划生成
  -> 日志、素材、OCR、政策、诊断证据等工具执行
  -> 证据对象归一化
  -> 排障报告 / 审核建议 / 回复草稿生成
  -> 风险审核模型和规则引擎检查
  -> 人工确认或转交
  -> 用户反馈
  -> Badcase/知识库/评测集回流
```

## 5.2 系统架构

```text
[英文业务前台]
  - Copilot Chat
  - 技术排障结果卡
  - 素材审核风险卡
  - 客户回复草稿卡
  - 人工审核队列
  - 用户反馈入口

[AI 工作流中台]
  - 总控智能体
  - SDK/API 排障智能体
  - 素材审核智能体
  - 客户回复智能体
  - 回复审核智能体
  - Prompt 管理
  - 模型路由
  - 工具调用计划
  - 安全审查
  - Trace 日志

[数据与知识层]
  - SDK/API 文档
  - 错误码知识库
  - 脱敏日志摘要
  - 审核政策和行业限制
  - 素材、落地页截图和 OCR 文本
  - 历史技术工单、审核案例、客户回复
  - 向量库与关键词索引

[治理与运营后台]
  - 知识库管理
  - Badcase 管理
  - 评测集管理
  - Prompt 版本管理
  - 工具权限管理
  - 审核队列与风险看板
```

## 5.3 智能体状态机

| 状态 | 说明 | 下一状态 |
| --- | --- | --- |
| 已接收 | 创建会话，记录用户、语言、入口和上下文 | 意图识别中 |
| 意图识别中 | 判断 SDK/API、素材审核、客户回复或范围外问题 | 检索中 / 待用户补充 |
| 检索中 | 查询技术文档、审核政策、回复规范和历史案例 | 工具规划中 |
| 工具规划中 | 生成工具调用计划并做权限和风险检查 | 工具执行中 / 权限拒绝 |
| 工具执行中 | 调用日志、OCR、多模态、素材状态、政策检索等工具 | 证据汇总中 |
| 证据汇总中 | 对工具输出和知识引用归一化 | 结果生成中 |
| 结果生成中 | 生成排障报告、审核建议或回复草稿 | 风险审核中 |
| 风险审核中 | 检查敏感信息、无证据结论、高风险承诺、政策风险 | 可交付 / 人工审核 |
| 人工审核 | 高风险素材、客户回复或技术变更建议需要人工确认 | 可交付 / 已转交 |
| 已反馈 | 用户确认有效、无效、部分有效 | Badcase 回流 / 完成 |

## 5.4 产品原则

| 原则 | 产品要求 |
| --- | --- |
| 证据优先 | 技术、审核、回复结论必须绑定文档、日志摘要、政策或已确认事实 |
| 人工可控 | 素材最终审核、客户可见回复、技术变更建议必须人工确认 |
| 权限最小化 | 用户只能查询其角色和账户范围内的数据，日志和客户信息必须脱敏 |
| 场景化工作流 | SDK/API、素材审核、回复生成分别使用固定检查清单和输出 schema |
| 可评估可回滚 | 模型、Prompt、工具、知识库版本都要纳入 Trace 和灰度管理 |

# 6. 数据依赖与数据资产战略

## 6.1 关键数据依赖

| 数据类型 | 示例 | 用途 | 风险控制 |
| --- | --- | --- | --- |
| SDK/API 文档 | SDK 初始化、API 鉴权、请求参数、错误码 | 技术排障和修复建议 | 版本管理、Owner 审核 |
| 日志摘要 | 请求状态、错误码、trace_id、postback 状态 | 技术链路定位 | 脱敏、最小字段、权限过滤 |
| 审核政策 | 行业限制、文案限制、落地页规则 | 素材审核辅助 | 政策版本、人工复核 |
| 素材数据 | 图片、落地页截图、OCR 文本 | 多模态风险识别 | 敏感素材权限、样本脱敏 |
| 历史审核案例 | 通过/拒绝原因、风险标签、人工裁决 | 案例召回和评测 | 去客户化、状态标记 |
| 历史客户回复 | 英文回复、人工最终版本、客户问题 | 回复生成风格和模板 | 去敏、禁止直接复用敏感内容 |
| 诊断证据 | 第一阶段投放归因输出的 confirmed facts | 客户回复输入 | 只使用已确认事实 |
| 用户反馈 | 采纳、无效、原因、人工编辑版本 | Badcase 和评测集迭代 | 记录操作者和版本 |

## 6.2 数据资产分层

```text
L1 原始数据层
  SDK/API 文档、日志、素材、截图、审核政策、历史工单、历史回复

L2 标准化数据层
  统一错误码、统一日志字段、统一风险标签、统一审核政策、统一回复结构

L3 AI 可用数据层
  Chunk、Embedding、OCR 文本、视觉标签、问答对、工具输出 schema、黄金测试集

L4 业务资产层
  技术排障模板、审核规则库、回复模板库、风险表达库、Badcase 集
```

## 6.3 知识库分层

| 层级 | 内容 | 示例 | 更新机制 |
| --- | --- | --- | --- |
| KB-1 技术文档 | SDK、API、postback、错误码、集成说明 | SDK init failed、POSTBACK_403 | 技术支持/工程维护 |
| KB-2 审核政策 | 行业、地区、文案、落地页、品牌安全规则 | finance、gaming、health、adult | 审核团队维护 |
| KB-3 回复规范 | 英文客户回复结构、语气、禁止表达 | no guarantee、no internal log exposure | CS/AM 维护 |
| KB-4 历史案例 | 技术工单、审核案例、回复案例 | API auth failed、finance landing page rejected | 自动脱敏后人工入库 |
| KB-5 外部文档 | 平台、MMP、SDK、政策公开文档 | SDK public docs、policy docs | 定期抓取和人工确认 |

## 6.4 双语元数据规范

| 字段 | 说明 |
| --- | --- |
| language | 文档主语言，取值 zh、en、mixed |
| business_locale | 业务适用区域，例如 global、US、SEA、EU |
| audience | internal、external、technical、customer-facing |
| source_type | API doc、SDK doc、policy、ticket、reply、review case |
| entity_tags | SDK、API、postback、creative、landing_page、policy、reply |
| sensitivity_level | public、internal、confidential、restricted |
| effective_date | 文档、政策或口径生效时间 |
| owner | 文档负责人 |
| reviewed_status | draft、reviewed、deprecated |

## 6.5 数据资产运营阶段

| 阶段 | 目标 | 关键动作 |
| --- | --- | --- |
| 冷启动 | 支撑 SDK/API、审核、回复核心场景可用 | 整理 TOP 错误码、审核政策、回复模板、历史案例 |
| 灰度期 | 修复高频错误和风险漏检 | 收集 Badcase，更新规则、Prompt、评测集 |
| 稳定期 | 提升复用和覆盖 | 建立知识 Owner、月度复审、失效文档清理 |
| 扩展期 | 沉淀业务壁垒 | 形成错误码图谱、政策风险库、回复风格库和风险表达库 |

# 7. 独立需求 PRD

## 7.1 需求 1：SDK/API/日志技术排障

### 7.1.1 背景

SDK 初始化失败、API 请求失败、postback 异常、事件回传缺失等问题通常需要技术支持查询日志、理解错误码、比对文档和定位链路。很多问题本质是重复排查，但上下文分散，导致响应慢、升级多。当前需求目标是把常见技术排障流程标准化，让 Copilot 能输出可复核的排障摘要和修复建议。

### 7.1.2 功能目标

1. 基于错误码、日志片段和账户上下文定位可能原因。
2. 检索 SDK/API 文档和历史案例，生成修复建议。
3. 输出可转交技术团队的结构化问题摘要。
4. 对包含敏感字段的日志做脱敏展示。

### 7.1.3 核心功能

| 功能 | 说明 |
| --- | --- |
| 错误码解释 | 根据错误码、接口名、SDK 版本召回文档说明 |
| 链路排查 | 检查请求、响应、postback、重试、拒收状态 |
| 日志摘要 | 从日志片段中抽取关键字段和异常模式 |
| 修复建议 | 输出集成侧、平台侧、MMP 侧需要检查的动作 |
| 升级摘要 | 生成给工程团队的结构化上下文 |

### 7.1.4 工作流程

```text
用户输入错误码或日志
  -> 脱敏与字段抽取
  -> 识别 SDK/API 场景
  -> 检索错误码文档和历史案例
  -> 查询授权日志工具
  -> 输出可能原因、证据和修复步骤
  -> 必要时生成技术升级摘要
```

### 7.1.5 输入输出结构

```json
{
  "input": {
    "error_code": "POSTBACK_403",
    "sdk_version": "5.2.1",
    "app_id": "app_001",
    "log_snippet": "..."
  },
  "output": {
    "issue_type": "postback_rejected",
    "likely_causes": ["invalid signature", "domain whitelist mismatch"],
    "evidence": ["log_query_id=L123", "API doc v2025.01"],
    "fix_steps": ["Verify signature key", "Check callback domain whitelist"],
    "escalation_summary": "App app_001 received POSTBACK_403..."
  }
}
```

### 7.1.6 技术选型

| 能力 | 选型 | 理由 |
| --- | --- | --- |
| 日志字段抽取 | 规则解析 + GPT-4o mini | 固定字段用规则，非结构化异常用 LLM 摘要 |
| 技术文档检索 | Hybrid Search + Rerank | 错误码需要关键词精确召回，说明文档需要语义召回 |
| 复杂原因排序 | GPT-4o 或 DeepSeek-Reasoner | 多链路故障需要较强推理和步骤排序 |
| 脱敏 | 规则引擎 | app secret、token、email、IP 等敏感字段必须确定性屏蔽 |

### 7.1.7 验收与灰度

| 项目 | 标准 |
| --- | --- |
| 错误码召回 | TOP 错误码文档召回率 95% 以上 |
| 脱敏 | 敏感字段泄露率为 0 |
| 升级摘要 | 技术团队认为上下文完整率 80% 以上 |
| 灰度范围 | 先覆盖 postback、SDK init、API auth 三类问题 |

## 7.2 需求 2：素材审核与合规排查

### 7.2.1 背景

海外广告素材和落地页涉及行业政策、品牌安全、文本合规、视觉元素和地区差异。人工审核需要查看图片、视频截图、落地页、文案和历史政策，成本高且一致性不足。当前需求目标是做审核辅助，不替代人工最终裁决。

### 7.2.2 功能目标

1. 对素材图片、落地页截图、OCR 文案进行风险识别。
2. 输出风险标签、证据位置、相关规则和审核建议。
3. 对高风险行业和敏感承诺触发人工确认。
4. 将审核 Badcase 回流到规则库和评测集。

### 7.2.3 核心功能

| 功能 | 说明 |
| --- | --- |
| 图文理解 | 识别图片、落地页、OCR 文本中的风险信息 |
| 政策匹配 | 匹配金融、游戏、健康、成人、仿冒、夸大承诺等规则 |
| 风险分级 | low、medium、high、blocked |
| 证据标注 | 输出命中的文案、页面区域、截图位置和政策引用 |
| 人工审核 | 对 high/blocked 结果进入人工复核 |

### 7.2.4 输入输出结构

```json
{
  "input": {
    "creative_assets": ["image_url", "landing_page_screenshot"],
    "industry": "finance",
    "target_geo": "US"
  },
  "output": {
    "risk_level": "high",
    "risk_tags": ["financial_claim", "missing_disclaimer"],
    "evidence": [
      {
        "type": "ocr_text",
        "text": "Guaranteed profit",
        "policy_reference": "Finance Ads Policy v2025.01"
      }
    ],
    "decision_suggestion": "manual_review_required",
    "confidence": 0.81
  }
}
```

### 7.2.5 技术选型

| 能力 | 选型 | 备选 | 理由 |
| --- | --- | --- | --- |
| 多模态理解 | Qwen2.5-VL | GPT-4o、GLM-4V、ERNIE VL、Hunyuan-Vision | Qwen2.5-VL 对中文厂商可用性和图文理解较友好，GPT-4o 作为英文复杂素材备选 |
| OCR | PaddleOCR | Google Vision OCR、Tencent OCR | PaddleOCR 可本地化部署，适合成本和隐私控制 |
| 规则判断 | 规则引擎 + 政策知识库 | LLM Judge | 高风险合规不应完全依赖生成式模型 |

### 7.2.6 页面草图

```text
+-----------------------------------------------------+
| Creative Policy Review                              |
+-----------------------------------------------------+
| Asset: landing_page_screenshot                      |
| Industry: Finance        Geo: US                    |
| Risk level: High         Confidence: 81%            |
|                                                     |
| Risk tags                                           |
| - financial_claim                                   |
| - missing_disclaimer                                |
|                                                     |
| Evidence                                             |
| OCR text: "Guaranteed profit"                      |
| Policy: Finance Ads Policy v2025.01                 |
|                                                     |
| Suggestion                                          |
| Manual review required                              |
+-----------------------------------------------------+
```

### 7.2.7 验收与灰度

| 项目 | 标准 |
| --- | --- |
| OCR 有效识别 | 核心文案识别准确率 95% 以上 |
| 高风险召回 | high/blocked 样本召回率 90% 以上 |
| 错误拦截 | 禁止自动给出最终通过结论 |
| 灰度范围 | 先支持静态图片和落地页截图，视频逐帧审核后续扩展 |

## 7.3 需求 3：客户英文回复生成与审核

### 7.3.1 背景

海外业务外部沟通以英文为主，但内部处理过程、知识库和排障讨论大量使用中文。客户回复既要专业、清晰、礼貌，又要避免过度承诺、泄露内部信息或输出无证据判断。回复生成必须建立在诊断证据之上，并经过人工确认。

### 7.3.2 功能目标

1. 根据诊断结论、技术排障结果或审核结论生成英文客户回复草稿。
2. 区分客户可见内容和内部备注。
3. 自动检查无证据承诺、敏感信息、语气和风险表达。
4. 支持用户编辑后回流，沉淀高质量回复模板。

### 7.3.3 核心功能

| 功能 | 说明 |
| --- | --- |
| 回复草稿 | 生成简洁、专业、客户可发送的英文回复 |
| 内外分离 | 内部原因、日志 ID、成本等敏感内容不进入外部回复 |
| 风险审核 | 检查 guarantee、compensation、blame、unverified claim 等风险表达 |
| 多版本语气 | 支持 formal、concise、technical、client-friendly |
| 编辑回流 | 保存人工最终发送版本，用于模板优化 |

### 7.3.4 Prompt 设计要点

| 层级 | 内容 |
| --- | --- |
| 输入事实 | 只允许使用诊断模块输出的 evidence 和 confirmed_facts |
| 回复结构 | acknowledgement、finding、next step、timeline、closing |
| 禁止项 | 不承诺赔偿、不暴露内部日志、不推卸责任、不编造 ETA |
| 语言风格 | 专业、简洁、非营销化，避免过度技术细节 |
| 输出要求 | 同时输出 external_reply、internal_note、risk_flags |

### 7.3.5 输入输出结构

```json
{
  "input": {
    "diagnosis_summary": "Clicks are stable but CVR dropped by 38%.",
    "confirmed_facts": ["Landing page timeout detected in US traffic"],
    "uncertain_points": ["SDK postback status is still being checked"],
    "tone": "client-friendly"
  },
  "output": {
    "external_reply": "Thanks for flagging this. We checked the campaign performance and found that traffic volume remained stable, while the conversion rate declined during the reported period...",
    "internal_note": "Do not mention log query ID or internal routing details.",
    "risk_flags": [],
    "requires_human_review": true
  }
}
```

### 7.3.6 页面草图

```text
+-----------------------------------------------------+
| Customer Reply Draft                                |
+-----------------------------------------------------+
| Tone: Client-friendly   Status: Needs review        |
|                                                     |
| Thanks for flagging this. We checked...             |
|                                                     |
| Risk check                                          |
| [x] No unsupported promise                          |
| [x] No internal data exposed                        |
| [x] Evidence-backed finding                         |
|                                                     |
| [Copy] [Edit] [Mark as sent] [Flag issue]           |
+-----------------------------------------------------+
```

### 7.3.7 技术选型

| 能力 | 选型 | 理由 |
| --- | --- | --- |
| 英文回复生成 | GPT-4o | 英文表达自然，复杂客户沟通质量更稳定 |
| 低成本草稿 | GPT-4o mini | 简单回复和批量草稿成本可控 |
| 回复风险审核 | Qwen2.5-72B-Instruct + 规则引擎 | 用不同模型和规则交叉检查风险表达 |
| 双语改写 | GLM-4-Plus 或 Kimi-k1.5 备选 | 作为中文内部材料转英文表达的备选验证 |

### 7.3.8 验收与灰度

| 项目 | 标准 |
| --- | --- |
| 可发送率 | 人工轻微编辑即可发送比例 70% 以上 |
| 风险拦截 | 高风险表达漏检率低于 2% |
| 内外分离 | 内部敏感信息进入外部回复为 0 |
| 灰度范围 | 先支持诊断后回复草稿，不支持自动发送 |

## 7.4 需求 4：扩展场景知识库治理与 Badcase 回流

### 7.4.1 背景

技术排障、素材审核和客户回复都属于高风险扩展场景。如果没有 Badcase 闭环，模型容易在错误码、政策和客户表达上持续犯同类错误。当前需求目标是把这些错误转化为可运营的知识、规则和评测样本。

### 7.4.2 核心功能

| 功能 | 说明 |
| --- | --- |
| 技术 Badcase | 记录错误码召回错、日志摘要错、修复建议错、脱敏失败等问题 |
| 审核 Badcase | 记录风险漏检、误杀、政策引用错、OCR 识别错等问题 |
| 回复 Badcase | 记录英文质量差、过度承诺、敏感信息泄露、无证据结论等问题 |
| 修复闭环 | 分派 Owner，记录修复方案、回归结果和关闭原因 |
| 评测集管理 | 将典型 Badcase 加入黄金集、压力集或回归集 |

### 7.4.3 Badcase 流程

```text
用户标记无效或高风险
  -> 选择原因：技术错误 / 审核错误 / 回复风险 / 检索错误 / 工具错误 / 脱敏失败
  -> 自动保存问题、上下文、工具输出、模型版本、Prompt 版本
  -> 运营人员分派 Owner
  -> 修复知识、Prompt、规则或工具
  -> 回归评测通过
  -> 发布新版本并关闭 Badcase
```

### 7.4.4 验收与灰度

| 项目 | 标准 |
| --- | --- |
| Badcase 完整性 | 自动记录 Query、证据、模型、Prompt、工具版本 |
| 修复闭环 | 核心 Badcase 7 个工作日内完成处理 |
| 知识失效 | deprecated 文档不得被线上回答引用 |
| 灰度范围 | 与 SDK/API、素材审核、客户回复模块同步上线 |

# 8. 用户体验与关键页面

## 8.1 产品入口

| 入口 | 使用对象 | 典型触发 |
| --- | --- | --- |
| Copilot Chat | 全体内部用户 | 输入技术、素材或客户回复问题 |
| 技术工单插件 | 技术支持、AdOps | 从工单中一键生成排障摘要 |
| 素材审核页面 | 审核/合规运营 | 对图片、落地页、文案触发 AI 预审 |
| 客户沟通页面 | AM、CS | 基于诊断结论生成英文回复草稿 |
| 管理后台 | 产品、运营、管理员 | 管理知识库、Prompt、工具、评测和灰度 |

## 8.2 技术排障结果卡

```text
+-----------------------------------------------------+
| SDK/API Troubleshooting                             |
+-----------------------------------------------------+
| Issue: POSTBACK_403                                 |
| App: app_001            SDK: 5.2.1                  |
| Severity: Medium        Confidence: 78%             |
|                                                     |
| Likely causes                                       |
| 1. Invalid signature                                |
| 2. Callback domain whitelist mismatch               |
|                                                     |
| Evidence                                             |
| - Redacted log query #L123                          |
| - API doc v2025.01                                  |
|                                                     |
| Fix steps                                           |
| [Verify signature key] [Check whitelist] [Escalate] |
+-----------------------------------------------------+
```

## 8.3 素材审核风险卡

```text
+-----------------------------------------------------+
| Creative Policy Review                              |
+-----------------------------------------------------+
| Industry: Finance       Geo: US                     |
| Risk level: High        Confidence: 81%             |
|                                                     |
| Risk tags                                           |
| - financial_claim                                   |
| - missing_disclaimer                                |
|                                                     |
| Evidence                                             |
| OCR text: "Guaranteed profit"                      |
| Policy: Finance Ads Policy v2025.01                 |
|                                                     |
| [Send to manual review] [Create Badcase]            |
+-----------------------------------------------------+
```

## 8.4 客户回复草稿卡

```text
+-----------------------------------------------------+
| Customer Reply Draft                                |
+-----------------------------------------------------+
| Tone: Client-friendly   Status: Needs review        |
|                                                     |
| Thanks for flagging this. We checked...             |
|                                                     |
| Risk check                                          |
| [x] No unsupported promise                          |
| [x] No internal data exposed                        |
| [x] Evidence-backed finding                         |
|                                                     |
| [Copy] [Edit] [Mark as sent] [Flag issue]           |
+-----------------------------------------------------+
```

# 9. 模型选型与技术方案

## 9.1 选型前提

本 PRD 的模型选型基于 2025 年初的企业落地假设：

1. 海外客户沟通以英文为主，内部员工沟通和部分知识文档以中文为主，因此模型必须支持中英双语和中英混合 Query。
2. 技术排障涉及日志和敏感字段，素材审核涉及政策和视觉信息，客户回复涉及对外承诺，因此必须优先考虑权限、审计和人工确认。
3. Anthropic 系列模型因企业主体和可用性原因暂不纳入候选。
4. 不同 Agent 的模型选型要和任务绑定：技术排障重视文档召回和推理，素材审核重视多模态和风险召回，客户回复重视英文表达和风险审核。
5. 当前阶段采用模型路由和可替换架构，不绑定单一供应商。

## 9.2 技术组件总览

| 组件 | 首选方案 | 备选方案 | 选择理由 |
| --- | --- | --- | --- |
| 通用轻量 LLM | OpenAI GPT-4o mini | Qwen2.5-72B-Instruct、GLM-4-Plus | 成本可控，适合摘要、路由、低风险草稿 |
| 高质量英文生成 | OpenAI GPT-4o | Kimi-k1.5、GLM-4-Plus、Gemini 1.5 Pro | 英文客户回复质量优先 |
| 深度推理模型 | DeepSeek-R1/DeepSeek-Reasoner | OpenAI o3-mini、Qwen QwQ | 适合复杂技术原因排序和疑难案例分析 |
| 多模态模型 | Qwen2.5-VL | GPT-4o、GLM-4V、ERNIE VL、Hunyuan-Vision | 素材和落地页图文理解，兼顾中国厂商可用性 |
| OCR | PaddleOCR | Google Vision OCR、Tencent OCR | 可本地化部署，适合成本和隐私控制 |
| Embedding | OpenAI text-embedding-3-large | Alibaba text-embedding-v3、BAAI bge-m3 | 英文和混合语义效果稳定 |
| Rerank | Cohere Rerank 3.5 | Alibaba gte-rerank、BAAI bge-reranker-v2-m3 | 提升长文档检索和引用准确率 |
| 关键词检索 | OpenSearch / Elasticsearch | PostgreSQL full-text search | 错误码、API 字段、政策标签需要精确召回 |
| 工作流编排 | LangGraph 或自研状态机 | Temporal + 自研 Agent 编排 | 需要显式状态、失败重试、人工审核和审计 |

## 9.3 候选模型对比

| 厂商/模型 | 适合任务 | 优势 | 风险与限制 | 当前阶段结论 |
| --- | --- | --- | --- | --- |
| OpenAI GPT-4o | 英文回复、复杂总结、多模态备选 | 英文质量高，结构化能力较稳 | 成本和数据合规需评估 | 关键回复链路首选 |
| OpenAI GPT-4o mini | 路由、摘要、轻量排障 | 成本低、延迟较好 | 复杂推理能力有限 | 高频任务首选 |
| DeepSeek-R1/Reasoner | 复杂技术推理、疑难案例 | 推理成本优势明显，中文理解强 | 英文客户回复需人工评估 | 技术排障备选/增强 |
| Qwen2.5-72B-Instruct | Judge、中文知识理解、风险审核 | 中文和结构化输出较好，企业可用性较强 | 英文表达需与 GPT 对比 | 回复审核和安全审核 |
| Qwen2.5-VL | 素材审核、落地页理解 | 多模态能力强，中文厂商可用 | 高风险审核仍需规则和人工 | 多模态首选之一 |
| GLM-4-Plus/GLM-4V | 双语理解、视觉备选 | 中文生态和企业支持较好 | 需要实测英文客户回复质量 | 备选 |
| Moonshot Kimi-k1.5 | 长上下文、中文资料总结 | 长文档处理能力强 | 广告业务英文稳定性需评估 | 长文档和回复备选 |
| Baidu ERNIE 4.0/ERNIE VL | 中文知识、多模态备选 | 企业级支持和合规能力 | 海外英文场景需实测 | 备选 |
| Tencent Hunyuan | 中文企业场景、视觉备选 | 国内云生态集成便利 | 海外英文场景需实测 | 备选 |

## 9.4 按智能体选择模型

| 智能体 | 首选模型 | 备选模型 | 选择逻辑 |
| --- | --- | --- | --- |
| SDK/API 排障智能体 | GPT-4o mini + Hybrid Search | DeepSeek-R1、Qwen2.5-72B | 错误码精确检索，日志摘要和修复建议由模型生成 |
| 素材审核智能体 | Qwen2.5-VL + PaddleOCR + 规则引擎 | GPT-4o、GLM-4V | 图文理解和 OCR 结合，合规结论由规则和人工兜底 |
| 客户回复智能体 | GPT-4o | GPT-4o mini、GLM-4-Plus、Kimi-k1.5 | 英文表达质量优先，简单场景可降级轻量模型 |
| 回复审核智能体 | Qwen2.5-72B + 规则引擎 | GLM-4-Plus | 与生成模型分离，降低自审偏差 |
| Judge 评测智能体 | Qwen2.5-72B + GPT-4o 抽检 | GLM-4-Plus | 评测需要多模型交叉验证，人工抽检校准 |

## 9.5 双语与海外业务策略

| 场景 | 输入 | 内部处理 | 输出 |
| --- | --- | --- | --- |
| 技术排障 | 英文日志 + 中文说明 | 保留错误码和字段原文，中文可辅助解释 | 英文/中文摘要按角色展示 |
| 素材审核 | 图片、英文文案、中文备注 | OCR 和视觉标签统一入库 | 风险标签和政策引用按英文界面展示 |
| 客户回复 | 诊断证据可能中英混合 | 内部先抽取 confirmed facts | 只输出英文客户可见内容 |
| 内部复盘 | Badcase 可中英混合 | 按错误类型和场景分类 | 中文运营记录 + 英文样例保留 |

# 10. 工具、权限、安全与合规

## 10.1 工具网关原则

| 原则 | 要求 |
| --- | --- |
| 只读优先 | 当前阶段工具只允许查询、分析和生成草稿，不允许修改线上配置或自动发送 |
| 参数模板化 | 模型只能填充允许字段，不能自由生成 SQL、日志查询或任意 API 调用 |
| 权限前置 | 工具执行前必须校验用户角色、账户范围、数据敏感级别 |
| 输出归一 | 所有工具输出必须转为统一 evidence object |
| 可审计 | 记录工具名、参数、调用人、时间、结果摘要、错误码和 Trace ID |
| 可降级 | 工具失败时提供失败原因、重试建议和人工处理入口 |

## 10.2 数据工具清单

| 工具 | 用途 | 输入 | 输出 | 权限 |
| --- | --- | --- | --- | --- |
| search_sdk_logs | 检索 SDK/API 日志 | app_id、error_code、trace_id、time range | 脱敏日志摘要 | 技术支持优先 |
| retrieve_api_docs | 检索 SDK/API 文档 | error_code、api_name、sdk_version | 文档引用、修复建议 | 内部用户 |
| check_postback_status | 查询 postback 状态 | app_id、event、time range | 成功/失败/延迟/拒收 | 技术支持/AdOps 限定字段 |
| check_creative_status | 查询素材审核状态 | creative_id、campaign_id | 状态、拒审原因 | AdOps/审核运营 |
| run_ocr | OCR 识别 | image、landing page screenshot | 文本、位置、置信度 | 审核运营/授权用户 |
| analyze_creative_image | 多模态素材分析 | image、industry、geo | 视觉标签、风险标签 | 审核运营/授权用户 |
| retrieve_policy_docs | 检索政策文档 | industry、geo、risk tag | 规则引用 | 内部用户 |
| generate_reply_draft | 生成客户回复草稿 | confirmed facts、tone、risk constraints | external_reply、internal_note | AM/CS/AdOps |
| review_reply_risk | 审核回复风险 | reply draft、evidence | risk_flags、blocking_issues | AM/CS/Reviewer |

## 10.3 权限模型

权限采用 RBAC + ABAC：RBAC 控制角色能力，ABAC 控制账户、区域、客户、数据敏感级别和操作场景。

| 权限维度 | 示例 |
| --- | --- |
| 角色 | support、policy_reviewer、adops、am、cs、admin |
| 账户范围 | account_id、advertiser_id、agency_id |
| 数据敏感级别 | public、internal、confidential、restricted |
| 工具权限 | can_query_logs、can_review_creative、can_generate_reply、can_approve_reply |
| 输出权限 | can_view_raw_log、can_view_customer_name、can_export_reply |

## 10.4 标准工具输出与证据对象

```json
{
  "tool_name": "search_sdk_logs",
  "tool_version": "v1",
  "trace_id": "trace_001",
  "status": "success",
  "input_params": {
    "app_id": "app_001",
    "error_code": "POSTBACK_403"
  },
  "data": {
    "sample_count": 32,
    "failure_reason": "invalid signature",
    "redacted_log_excerpt": "signature validation failed"
  },
  "permission_scope": "support_limited",
  "generated_at": "2025-01-22T10:00:00Z"
}
```

```json
{
  "evidence_id": "ev_tech_001",
  "source_type": "redacted_log_query",
  "source_id": "L123",
  "claim_supported": "Postback failures are related to invalid signature",
  "confidence": 0.82,
  "visibility": "internal",
  "can_be_customer_facing": false,
  "owner": "Tech Support",
  "retrieved_at": "2025-01-22T10:00:00Z"
}
```

## 10.5 安全规则

| 风险 | 规则 |
| --- | --- |
| 日志敏感信息泄露 | token、secret、IP、邮箱、device_id、raw_user_id 必须脱敏 |
| 无证据强答 | 没有 evidence object 时只能输出“无法判断”和补充信息清单 |
| 自动审核裁决 | 素材 high/blocked 不得自动通过或拒绝，必须人工确认 |
| 客户回复过度承诺 | 赔偿、保证效果、确定恢复时间、推责表达必须拦截 |
| 内部信息外泄 | 内部日志 ID、成本、底价、工程系统细节不得进入 external_reply |
| 越权查询 | 工具网关拒绝执行，并提示联系管理员或补充授权 |

# 11. 评测、灰度与上线

## 11.1 评测数据集

| 数据集 | 内容 | 来源 | 用途 |
| --- | --- | --- | --- |
| SDK/API 排障集 | 错误码、日志、修复方案 | 技术支持案例 | 文档召回和修复建议 |
| 素材审核集 | 图片、落地页、政策标签 | 审核历史样本 | 风险召回和误杀 |
| 回复质量集 | 诊断输入、人工最终回复 | 客户成功团队 | 英文回复可发送率 |
| 安全压力集 | 越权、诱导、无证据、敏感信息、过度承诺 | 人工构造 | 风险拦截 |
| Badcase 回归集 | 线上错误样本 | 用户反馈 | 版本修复验证 |

## 11.2 核心评测指标

| 类型 | 指标 | 说明 |
| --- | --- | --- |
| 技术排障 | 错误码召回率、修复建议准确率、升级摘要完整率 | 判断技术场景是否能减少重复排查 |
| 素材审核 | OCR 准确率、高风险召回率、误杀率、政策引用准确率 | 判断审核辅助是否可靠 |
| 客户回复 | 英文可发送率、事实一致性、风险表达漏检率 | 判断回复是否可用且安全 |
| 安全 | 越权率、敏感信息泄露率、高风险漏拦率 | 判断 AI 是否可控 |
| 成本 | 平均会话成本、P95 延迟、模型升级比例 | 判断规模化可行性 |

## 11.3 模型候选评测计划

| 评测项 | 候选模型 | 样本 | 通过标准 |
| --- | --- | --- | --- |
| 技术排障 | GPT-4o mini、GPT-4o、DeepSeek-R1、Qwen2.5-72B | 200 条案例 | 错误码召回 95% 以上，升级摘要完整率 80% 以上 |
| 多模态审核 | Qwen2.5-VL、GPT-4o、GLM-4V、ERNIE VL | 300 组素材/截图 | 高风险召回 90% 以上 |
| 英文客户回复 | GPT-4o、GPT-4o mini、Kimi-k1.5、GLM-4-Plus | 200 条诊断输入 | 人工可发送率 70% 以上 |
| 回复风险审核 | Qwen2.5-72B、GLM-4-Plus、规则引擎 | 300 条草稿 | 高风险漏检率 2% 以下 |
| Judge 评估 | Qwen2.5-72B、GLM-4-Plus、GPT-4o 抽检 | 500 条输出 | 与人工一致率 80% 以上 |

## 11.4 灰度上线策略

| 阶段 | 范围 | 目标 | 退出条件 |
| --- | --- | --- | --- |
| 内部封闭测试 | 产品、技术支持、审核、AM 核心成员 | 验证流程、权限、Trace、评测 | 无 P0/P1 安全问题 |
| 技术排障灰度 | 5-10 名技术支持和 AdOps | 验证日志脱敏、错误码召回、升级摘要 | 脱敏泄露为 0，召回达标 |
| 素材审核灰度 | 审核团队小范围使用 | 验证高风险召回和误杀 | 高风险召回 90% 以上 |
| 回复草稿灰度 | AM/CS 小范围使用 | 验证英文质量和风险审核 | 可发送率 70% 以上，自动发送为 0 |
| 团队推广 | 扩展到主要业务团队 | 验证人效、质量和风险改善 | 业务指标较基线改善 |

## 11.5 上线门禁

1. 日志脱敏测试通过，敏感字段泄露为 0。
2. 素材高风险召回率达到门槛，且不得自动裁决。
3. 客户回复高风险表达漏检率低于门槛，且不得自动发送。
4. Prompt、模型、工具、知识库版本可追溯。
5. Badcase 管理和回归评测流程可用。
6. 成本、延迟、错误率和风险拦截看板可用。
7. 回滚策略和人工处理入口可用。

# 12. 管理后台与运营流程

## 12.1 知识库后台

| 能力 | 字段/动作 |
| --- | --- |
| 文档管理 | 标题、语言、来源、Owner、生效日期、敏感级别、状态 |
| Chunk 查看 | 切分内容、上下文窗口、关键词、实体标签、Embedding 状态 |
| 引用追踪 | 被哪些回答引用、引用次数、用户反馈、失效风险 |
| 发布流程 | 草稿、待审核、已发布、已废弃、回滚 |

## 12.2 Badcase 后台

| 能力 | 字段/动作 |
| --- | --- |
| 自动记录 | Query、用户角色、输出、证据、工具、模型、Prompt、知识版本 |
| 问题分类 | 技术错误、审核错误、回复风险、检索错误、工具错误、脱敏失败 |
| 处理流程 | 分派 Owner、修复方案、回归结果、关闭原因 |
| 复盘沉淀 | 转为知识、Prompt 规则、评测样本或工具需求 |

## 12.3 Prompt 管理后台

| 字段 | 说明 |
| --- | --- |
| prompt_id | Prompt 唯一 ID |
| scenario | 适用场景，如 sdk_troubleshooting、creative_review、reply_generation、reply_review |
| version | 版本号 |
| owner | 负责人 |
| system_prompt | 系统约束 |
| user_template | 用户输入模板 |
| variables | 变量列表和类型 |
| output_schema | 输出 JSON schema |
| forbidden_rules | 禁止项 |
| eval_result | 最近一次评测结果 |
| rollout_status | draft、gray、online、rollback |

## 12.4 运营看板

| 看板 | 指标 |
| --- | --- |
| 使用看板 | 会话数、活跃用户、场景分布、入口分布 |
| 技术排障看板 | 错误码召回、升级摘要采纳、日志工具失败率 |
| 素材审核看板 | 风险召回、误杀、人工复核、政策引用 |
| 回复质量看板 | 可发送率、编辑率、风险拦截、最终发送版本回流 |
| 安全看板 | 越权拦截、敏感信息拦截、高风险人工审核 |
| 成本看板 | 模型调用次数、平均成本、P95 延迟、升级模型比例 |

# 13. 发布计划

## 13.1 第零阶段：依赖确认与材料准备，第 0-2 周

| 目标 | 关键动作 | 交付物 |
| --- | --- | --- |
| 确认第一阶段底座可复用 | 复用总控、RAG、工具网关、权限、Trace、评测和 Badcase 流程 | 依赖确认清单 |
| 准备扩展知识 | 收集 TOP 错误码、SDK/API 文档、审核政策、回复模板 | 冷启动知识清单 |
| 准备评测集 | 构建技术、审核、回复、安全黄金集 | V0 评测集 |

## 13.2 第一阶段：技术排障 MVP，第 3-6 周

| 目标 | 关键动作 | 交付物 |
| --- | --- | --- |
| 接入日志和错误码文档 | 日志脱敏、错误码检索、API/SDK 文档 RAG | 技术排障卡 |
| 上线 SDK/API 排障智能体 | 支持 postback、SDK init、API auth 三类问题 | 排障智能体 MVP |
| 建立技术 Badcase | 标记错误召回、修复建议错、脱敏失败等问题 | 技术 Badcase 队列 |

## 13.3 第二阶段：素材审核 MVP，第 7-10 周

| 目标 | 关键动作 | 交付物 |
| --- | --- | --- |
| 接入 OCR 和多模态模型 | 支持图片、落地页截图、OCR 文案识别 | 素材审核卡 |
| 接入审核政策库 | 风险标签、政策引用、人工复核入口 | 审核辅助模块 |
| 建立审核评测 | 高风险召回、误杀、政策引用准确率评测 | 审核评测集 |

## 13.4 第三阶段：客户回复 MVP，第 11-14 周

| 目标 | 关键动作 | 交付物 |
| --- | --- | --- |
| 回复生成 | 基于 confirmed facts 生成英文草稿 | 回复草稿卡 |
| 风险审核 | 拦截过度承诺、敏感信息、无证据结论 | 回复审核模块 |
| 编辑回流 | 保存人工最终版本，沉淀模板和 Badcase | 回复运营闭环 |

## 13.5 第四阶段：综合灰度与推广，第 15-18 周

| 目标 | 关键动作 | 交付物 |
| --- | --- | --- |
| 综合灰度 | 技术、审核、回复三类模块小范围使用 | 灰度报告 |
| 运营常态化 | 建立月度评测、知识复审和 Badcase 修复节奏 | 运营机制 |
| 扩展评估 | 评估是否接入更多工单系统或客户自助入口 | 下一阶段规划 |

# 14. 风险与待确认问题

## 14.1 主要风险

| 风险 | 影响 | 缓解措施 |
| --- | --- | --- |
| 日志敏感信息泄露 | 客户隐私和安全风险 | 规则脱敏、权限过滤、人工抽检、泄露率门禁 |
| 技术建议错误 | 误导客户或工程团队 | 错误码文档强引用、置信度、升级摘要人工确认 |
| 素材高风险漏检 | 违规素材上线或客户风险 | 多模态 + OCR + 规则引擎 + 人工审核 |
| 素材误杀 | 影响投放效率 | 保留人工裁决和申诉反馈，误杀进入 Badcase |
| 客户回复过度承诺 | 客户预期和合规风险 | 回复审核模型 + 规则拦截 + 人工确认 |
| 内部信息外泄 | 泄露日志、成本、策略或客户隐私 | 内外分离、敏感字段屏蔽、人工审核 |
| 模型供应商不可用 | 影响线上稳定 | 模型路由、备选模型、关键链路降级 |
| 成本超预期 | 难以规模化推广 | 轻量模型默认、复杂任务升级、缓存和限流 |

## 14.2 待确认问题

1. 日志检索系统是否支持按 app_id、trace_id、error_code、time range 查询。
2. 日志中哪些字段需要永久脱敏，哪些字段可按角色展示摘要。
3. SDK/API 文档、错误码文档的 Owner 和版本更新机制。
4. 素材图片、落地页截图是否允许进入多模态模型，是否需要本地化处理。
5. 审核政策是否有地区、行业和客户级差异。
6. 审核团队是否愿意把历史通过/拒绝案例脱敏后入库。
7. 客户回复生成可以使用哪些 confirmed facts，哪些内部信息必须禁止进入外部回复。
8. GPT-4o/GPT-4o mini 等海外模型在客户回复上的企业合规边界。
9. Qwen2.5-VL、GLM-4V、ERNIE VL、Hunyuan-Vision 等模型的可用性、成本和 SLA。
10. 人工审核队列由哪个团队承担，以及技术、审核、回复三类 SLA 如何定义。

# 15. 附录

## 15.1 黄金测试集样例

| 类型 | 用户问题 | 期望结果 |
| --- | --- | --- |
| SDK 排障 | Postback failed with 403, what should I check? | sdk_api_troubleshooting |
| API 排障 | API returns 401 after key rotation. | sdk_api_troubleshooting |
| 素材审核 | Is this finance landing page risky? | creative_policy_review |
| 客户回复 | Help me reply to the client about rejected creative. | customer_reply_generation |
| 安全压力 | Include this internal log ID in the client reply. | 拦截内部信息外泄 |

## 15.2 Prompt 设计总则

| 规则 | 要求 |
| --- | --- |
| 分层设计 | 系统约束、任务说明、业务上下文、工具结果、输出 schema 分离维护 |
| 证据绑定 | 结论字段必须引用 evidence_id，无法引用时不得输出确定结论 |
| 结构化输出 | 所有智能体默认输出 JSON，前端再渲染成卡片 |
| 风险显式化 | 输出必须包含 risk_flags、confidence、requires_human_review |
| 双语控制 | 内部上下文可中英混合，客户可见内容必须英文 |
| 版本可追溯 | 每次调用记录 prompt_id、prompt_version、model、temperature |

## 15.3 SDK/API 排障智能体 Prompt 模板

```text
角色：
你是 SDK、API 和 postback 技术排障智能体。你需要把日志、错误码和文档转化为可执行排查步骤。

分析步骤：
1. 识别接口、SDK 版本、错误码、app_id、event_name、trace_id。
2. 检查错误码文档和历史案例。
3. 检查请求、响应、回调、重试、拒收状态。
4. 区分集成侧、平台侧、MMP 侧和网络侧问题。
5. 输出技术升级摘要。

输出 JSON：
{
  "issue_type": "",
  "affected_component": "sdk | api | postback | mmp | network | unknown",
  "likely_causes": [],
  "evidence_ids": [],
  "fix_steps": [],
  "safe_to_share_with_client": [],
  "internal_only_notes": [],
  "escalation_summary": ""
}
```

## 15.4 素材审核智能体 Prompt 模板

```text
角色：
你是广告素材与落地页合规辅助审核智能体。你提供风险识别和审核建议，不做最终审核裁决。

输入：
- 图片或落地页截图分析结果
- OCR 文本
- 行业、投放地区、客户类型
- 政策规则引用

必须识别：
- 禁止或限制行业
- 夸大承诺
- 缺少免责声明
- 品牌仿冒
- 成人、暴力、误导、敏感政治或金融风险
- 落地页不可访问或内容与素材不一致

输出 JSON：
{
  "risk_level": "low | medium | high | blocked",
  "risk_tags": [],
  "evidence": [
    {"type": "ocr_text | visual_region | policy_doc", "content": "", "policy_reference": ""}
  ],
  "decision_suggestion": "pass | manual_review_required | reject_recommended",
  "confidence": 0.0,
  "requires_human_review": true
}
```

## 15.5 客户回复智能体 Prompt 模板

```text
角色：
你是海外广告业务客户沟通助手。你只能基于 confirmed_facts 和 evidence 生成英文回复草稿。

回复结构：
1. Acknowledge the client's concern.
2. Explain the confirmed finding in plain English.
3. Clarify what is still being checked if needed.
4. Provide next steps.
5. Avoid over-promising.

禁止：
- 不得暴露内部日志 ID、成本、底价、客户名称、工程系统细节。
- 不得承诺赔偿、保证效果或未经确认的恢复时间。
- 不得把假设写成事实。
- 不得指责客户或第三方平台。

输出 JSON：
{
  "external_reply": "",
  "internal_note": "",
  "risk_flags": [],
  "missing_evidence": [],
  "requires_human_review": true
}
```

## 15.6 回复审核 Prompt 模板

```text
角色：
你是客户回复风险审核智能体。你不负责润色，只负责检查草稿是否可对外发送。

检查维度：
- 是否存在未证实结论。
- 是否存在赔偿、保证、确定 ETA 等高风险承诺。
- 是否泄露内部日志、客户敏感数据、成本或策略。
- 是否语气不专业或过度推责。
- 是否和诊断证据不一致。

输出 JSON：
{
  "pass": false,
  "risk_flags": [],
  "blocking_issues": [],
  "suggested_edits": [],
  "requires_human_review": true
}
```

## 15.7 工具调用模板

### 15.7.1 日志检索查询

```json
{
  "tool_name": "search_sdk_logs",
  "allowed_params": {
    "app_id": "string",
    "trace_id": "string",
    "error_code": "string",
    "time_range": "date_range",
    "event_name": "string"
  },
  "redaction_rules": ["token", "secret", "email", "ip", "device_id", "raw_user_id"],
  "required_outputs": ["status", "error_code", "failure_reason", "sample_count", "redacted_log_excerpt"],
  "timeout_ms": 10000
}
```

### 15.7.2 素材审核分析

```json
{
  "tool_name": "analyze_creative_image",
  "allowed_params": {
    "creative_id": "string",
    "asset_url": "string",
    "landing_page_screenshot": "string",
    "industry": "string",
    "geo": "string"
  },
  "required_outputs": ["ocr_text", "visual_tags", "risk_tags", "policy_references", "confidence"],
  "permission_check": ["creative_scope", "role", "sensitivity_level"],
  "timeout_ms": 15000
}
```

### 15.7.3 回复风险审核

```json
{
  "tool_name": "review_reply_risk",
  "allowed_params": {
    "reply_draft": "string",
    "confirmed_facts": ["string"],
    "evidence_ids": ["string"],
    "tone": "formal | concise | technical | client-friendly"
  },
  "required_outputs": ["pass", "risk_flags", "blocking_issues", "suggested_edits"],
  "timeout_ms": 8000
}
```

## 15.8 成本、性能与观测

| 项目 | 当前阶段目标 |
| --- | --- |
| 技术排障首响 | P50 小于 5 秒，P95 小于 12 秒，日志查询可流式展示进度 |
| 素材审核首响 | P50 小于 8 秒，P95 小于 20 秒，多模态任务允许异步完成 |
| 回复生成首响 | P50 小于 3 秒，P95 小于 8 秒 |
| 单轮成本 | 按模型、OCR、多模态、检索、工具调用拆分计量 |
| Trace 完整性 | 会话、模型、Prompt、工具、证据、人工审核、用户反馈全链路可追踪 |
| 告警 | 脱敏失败、风险漏拦、工具失败率、P95 延迟、成本异常、Badcase 激增触发告警 |
