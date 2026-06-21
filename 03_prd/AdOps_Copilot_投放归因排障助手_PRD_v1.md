# AdOps Copilot 投放归因排障助手 PRD v1.0

| 项目 | 内容 |
| --- | --- |
| 产品名称 | AdOps Copilot：投放归因排障助手 |
| 文档版本 | v1.0 Draft |
| 拆分来源 | AdOps Copilot 产品需求文档 v6.0 |
| 更新时间 | 2026-06-20 |
| 选型时间假设 | 2025 年初可稳定商用或可进入生产评估的模型与技术 |
| 面向业务 | 海外移动互联网广告业务，覆盖 App、Web、OEM、On-Device 广告场景 |
| 系统语言 | 系统界面以英文为主，内部协作与知识运营支持中文，业务文档支持中英混合检索 |
| 当前范围 | 投放效果异常诊断、归因与数据不一致核对、知识检索、证据管理、Badcase 回流 |
| 不在当前范围 | SDK/API 排障、素材审核、客户英文回复生成，这些进入后续扩展 PRD |
| 文档目的 | 定义第一阶段可落地的投放归因排障助手，明确业务目标、功能范围、AI 能力、数据依赖、技术选型、评测上线与运营机制 |

# 目录

1. [项目摘要](#1-项目摘要)
2. [整体项目规划](#2-整体项目规划)
3. [用户、场景与范围](#3-用户场景与范围)
4. [目标、指标与价值测算](#4-目标指标与价值测算)
5. [核心业务流程与系统架构](#5-核心业务流程与系统架构)
6. [数据依赖与数据资产战略](#6-数据依赖与数据资产战略)
7. [独立需求 PRD](#7-独立需求-prd)
8. [模型输入输出与 Prompt 设计](#8-模型输入输出与-prompt-设计)
9. [模型选型与技术方案](#9-模型选型与技术方案)
10. [用户页面与交互设计](#10-用户页面与交互设计)
11. [工具、权限、安全与合规](#11-工具权限安全与合规)
12. [模型评测与验证体系](#12-模型评测与验证体系)
13. [管理后台与运营流程](#13-管理后台与运营流程)
14. [发布计划](#14-发布计划)
15. [风险与待确认问题](#15-风险与待确认问题)
16. [附录](#16-附录)

# 1. 项目摘要

AdOps Copilot 投放归因排障助手是 AdOps Copilot 的第一阶段产品，聚焦广告投放运营中最常见、最高频、最适合通过数据和知识辅助解决的两类问题：投放效果异常诊断，以及平台、MMP、客户后台之间的数据不一致核对。

本阶段不做开放式全能 Copilot，也不覆盖 SDK/API 技术排障、素材审核或客户英文回复生成。产品目标是先建立一个可控、可溯源、可审计、可评估的排障工作流中枢：用户输入投放或归因问题后，系统识别意图，检索内部知识，调用授权只读数据工具，输出带证据的诊断结论、核查清单、下一步动作和内部处理摘要。

# 2. 整体项目规划

## 2.1 产品定位

| 维度 | 定位 |
| --- | --- |
| 产品类型 | 内部 AdOps AI 排障助手，第一阶段聚焦投放与归因问题 |
| 核心价值 | 降低投放归因排查成本，提升诊断一致性，缩短内部问题定位时间 |
| AI 形态 | RAG + 规则引擎 + 只读工具调用 + 总控智能体 + 场景智能体 + 人工确认 |
| 主要产出 | 投放诊断报告、归因差异核查报告、证据引用、下一步建议、Badcase 记录 |
| 不做什么 | 不自动调预算、不自动改出价、不自动发送客户回复、不处理素材审核、不深入 SDK/API 日志排障 |

## 2.2 产品愿景

投放归因排障助手要成为广告运营团队处理投放和数据差异问题的第一入口。用户遇到消耗下降、转化异常、CPA 上升、MMP 数据不一致、平台报表与客户后台不一致等问题时，不需要先判断应该查哪个系统、问哪个团队、翻哪份 SOP，而是先把问题交给 Copilot，由系统完成意图识别、资料检索、数据核对、证据归一和诊断摘要生成。

第一阶段的产品能力可以概括为五句话：

1. 查得准：回答必须引用指标数据、归因口径、SOP 或历史案例。
2. 拆得清：复杂问题要拆成指标、时间窗口、账户层级、渠道、归因窗口和数据延迟等维度。
3. 诊得稳：常见问题使用固定检查清单和规则兜底，不依赖模型自由发挥。
4. 控得住：只读工具、权限前置、证据绑定、人工确认、全链路 Trace。
5. 迭代快：Badcase 能回流到知识库、Prompt、工具模板和评测集。

## 2.3 核心用户旅程

```text
用户提出投放或归因问题
  -> Copilot 识别意图、语言、风险等级和所需数据
  -> 系统确认用户权限与账户范围
  -> 检索投放 SOP、归因口径、指标定义和历史案例
  -> 调用授权报表、账户状态、归因对账和 postback 状态工具
  -> 汇总证据并生成诊断结论或差异核查结果
  -> 给出下一步排查建议和内部处理摘要
  -> 用户反馈是否有效
  -> Badcase 回流到知识库、评测集和 Prompt 管理
```

## 2.4 核心功能地图

| 模块 | 解决的问题 | 当前阶段产出 | 依赖能力 |
| --- | --- | --- | --- |
| 总控智能体 | 用户问题入口不统一，意图和风险难判断 | 意图分类、任务拆解、工具计划、权限判断 | LLM、路由规则、权限系统 |
| RAG 知识检索 | SOP、归因口径、指标定义分散 | 带引用答案、相关文档、历史案例 | Embedding、重排序、文档治理 |
| 投放效果诊断 | 消耗、展示、点击、转化、CPA、ROI 异常原因难定位 | 指标拆解、异常判断、原因假设、排查建议 | 报表工具、规则引擎、LLM 总结 |
| 归因核对 | 平台与 MMP/客户后台数据不一致 | 差异定位、口径说明、核查清单 | 归因数据、MMP 口径、时区规则 |
| Badcase 与知识运营 | AI 错误难复盘，知识无法持续进化 | Badcase 工单、修复状态、评测样本 | 人工标注、版本管理、评测平台 |
| 管理后台 | Prompt、工具、知识库、灰度缺少统一管理 | 配置、灰度、审计、看板 | 权限、日志、实验平台 |

## 2.5 与后续扩展 PRD 的边界

| 能力 | 当前文档处理方式 | 后续扩展 PRD 处理方式 |
| --- | --- | --- |
| SDK/API 排障 | 仅在归因问题中查询 postback 状态，不分析 SDK 日志和集成修复 | 独立做错误码、日志、API、SDK 集成排障 |
| 素材审核 | 不进入当前阶段 | 独立做图片、落地页、OCR、政策风险辅助审核 |
| 客户英文回复 | 不生成对外可发送回复，仅输出内部诊断摘要 | 独立做英文回复生成、风险审核、编辑回流 |
| 多模态能力 | 不进入当前阶段 | 用于素材审核和落地页理解 |
| 对外客户入口 | 不进入当前阶段 | 后续在内部验证稳定后再评估 |

# 3. 用户、场景与范围

## 3.1 目标用户

| 用户角色 | 典型工作 | 主要痛点 | Copilot 价值 |
| --- | --- | --- | --- |
| 广告投放运营 | 查看账户表现、处理异常、协调投放问题 | 数据源多、问题杂、依赖经验 | 快速定位异常维度，生成排查路径 |
| 客户成功/AM | 跟进客户反馈，解释投放结果和数据差异 | 需要快速理解问题和内部结论 | 获得有证据的内部解释，减少反复追问 |
| 技术支持 | 协助确认 postback、归因回调、数据链路状态 | 问题上下文不完整，重复查询多 | 获得结构化上下文和差异核查结果 |
| 广告平台产品/运营 | 维护指标口径、SOP 和异常处理流程 | 知识分散，更新后难被一线复用 | 通过知识库和 Badcase 形成持续沉淀 |
| 管理者 | 关注处理效率、升级率和知识沉淀 | 难量化 AI 带来的效率与质量 | 看板化追踪解决率、采纳率、风险率 |

## 3.2 核心场景

| 场景 | 示例问题 | 期望输出 |
| --- | --- | --- |
| 投放效果异常 | Why did spend drop sharply yesterday for campaign A? | 异常指标、可能原因、证据、下一步动作 |
| 转化异常 | Installs dropped but clicks are stable. What happened? | 漏斗拆解、CVR 变化、归因/落地页/追踪排查建议 |
| CPA/ROI 异常 | Why did CPA increase in the US campaign? | 成本拆解、流量质量、转化率、收入回传核查 |
| 归因差异 | MMP shows 30% fewer installs than our dashboard. Why? | 口径差异、时区窗口、回调链路、排查清单 |
| 数据延迟 | Why are today's installs lower than expected? | 报表刷新、归因延迟、postback 延迟确认 |
| 知识查询 | What is the attribution window for OEM campaigns? | 带引用的口径说明 |

## 3.3 当前范围

| 范围 | 说明 |
| --- | --- |
| 内部员工使用 | 面向广告投放、客户成功、技术支持、产品/运营和管理角色 |
| 英文系统界面 | 用户主要在英文后台中使用，中文内部知识可被检索和总结 |
| 只读数据工具 | 仅查询与诊断，不直接修改广告账户、预算、出价或配置 |
| 证据型回答 | 所有业务结论必须引用知识、数据、口径或工具结果 |
| 人工确认 | 高风险判断和对客户可见表达必须由人判断，本阶段不生成客户可发送回复 |
| 可评估上线 | 总控、投放诊断、归因核对必须具备黄金集、Badcase、灰度和回滚机制 |

## 3.4 当前范围外

| 范围外事项 | 原因 |
| --- | --- |
| SDK/API 深度排障 | 属于技术链路问题，涉及日志脱敏、错误码、SDK 文档和工程协作，拆到后续 PRD |
| 素材审核与合规排查 | 涉及多模态、OCR、政策规则和人工审核队列，拆到后续 PRD |
| 客户英文回复生成 | 涉及对外承诺和合规风险，拆到后续 PRD 单独设计 |
| 自动调整预算/出价 | 涉及直接商业损失风险，需要更高等级风控和审批 |
| 完全替代人工判断 | 第一阶段定位为辅助诊断和内部决策支持 |
| 对客户开放独立入口 | 先在内部验证质量、权限和合规，再考虑外部化 |

# 4. 目标、指标与价值测算

## 4.1 产品目标

1. 让一线团队能在一个入口完成投放和归因问题的初步诊断。
2. 让每个诊断结论都具备证据、引用、置信度和人工确认状态。
3. 让归因差异解释更标准，减少遗漏时区、窗口、去重、回调等关键检查项。
4. 让投放排障经验通过 Badcase、知识库和评测集持续沉淀。
5. 让第一阶段 AI 系统上线后可量化、可审计、可回滚。

## 4.2 业务目标

| 指标 | 目标口径 | 当前阶段目标 |
| --- | --- | --- |
| 首次响应时间 | 从用户提交投放/归因问题到 Copilot 给出首版诊断 | 较人工基线下降 30% 以上 |
| 常见问题解决率 | 无需转交其他团队即可形成可执行建议的会话占比 | 达到 50% 以上 |
| 人工采纳率 | 用户对诊断建议点击采纳、复制或继续执行的比例 | 达到 60% 以上 |
| 升级工单质量 | 转交技术/产品团队时上下文完整度 | 达到 80% 以上 |
| 知识复用率 | 回答中引用内部知识或历史案例的比例 | 达到 70% 以上 |
| Badcase 修复周期 | 从标记 Badcase 到纳入修复版本 | 核心场景小于 7 个工作日 |

## 4.3 AI 质量目标

| 指标 | 说明 | 当前阶段门槛 |
| --- | --- | --- |
| 意图识别准确率 | 正确识别投放诊断、归因核对、知识查询等问题类型 | 90% 以上 |
| 引用覆盖率 | 回答包含可追溯证据的比例 | 90% 以上 |
| 投放异常检查完整率 | 覆盖预算、出价、库存、素材状态、转化链路、归因延迟等关键项 | 85% 以上 |
| 归因核对完整率 | 覆盖时区、窗口、去重、回调、口径等关键项 | 85% 以上 |
| 无证据强答率 | 无证据时仍给确定结论的比例 | 5% 以下 |
| 越权工具调用率 | 调用用户无权访问的数据工具 | 0 |
| 高风险自动执行率 | 未经人工确认执行高风险动作 | 0 |
| 中英混合理解准确率 | 中文、英文、中英混合 Query 的意图识别准确率 | 90% 以上 |

## 4.4 北极星指标

北极星指标为“AI 辅助解决的投放归因排障会话数”。

该指标必须同时满足三个条件：用户发起真实投放或归因问题，Copilot 给出带证据的诊断或核查结果，用户确认有效、采纳或完成后续动作。单纯聊天次数、模型调用次数、页面访问次数不作为核心成功指标。

## 4.5 价值测算模型

| 价值项 | 计算方式 | 数据来源 |
| --- | --- | --- |
| 人效节省 | 月投放归因排障会话数 × 平均节省分钟数 × 人力成本 | Copilot 日志、人工基线调研 |
| 响应改善 | 人工首次响应时间 - AI 首次响应时间 | 工单系统、Copilot Trace |
| 升级减少 | 原升级率 - AI 辅助后升级率 | 工单状态、团队流转记录 |
| 诊断质量提升 | 采纳率、返工率、追问率、人工评分 | 用户反馈、人工抽检 |
| 知识资产沉淀 | 新增有效知识条数、Badcase 关闭数、复用次数 | 知识库后台、评测平台 |

ROI 计算不在 PRD 中预设真实业务结果。上线前需要先采集 2-4 周人工基线，再用灰度数据计算节省时间、采纳率和质量提升。

# 5. 核心业务流程与系统架构

## 5.1 端到端业务流程

![投放归因排障端到端业务流程图](assets/adops_attribution_workflow.svg)

```text
问题输入
  -> 会话创建
  -> 用户身份、角色、账户权限校验
  -> 语言识别与意图识别
  -> 风险分级
  -> 任务拆解
  -> 投放/归因知识检索
  -> 工具调用计划生成
  -> 工具网关执行只读查询
  -> 证据对象归一化
  -> 诊断推理与核查结果生成
  -> 置信度与安全检查
  -> 展示诊断报告或补充信息问题
  -> 用户反馈
  -> Badcase/知识库/评测集回流
```

## 5.2 系统架构

![投放归因排障系统架构图](assets/adops_attribution_architecture.svg)

```text
[英文业务前台]
  - Copilot Chat
  - Campaign 页面侧边栏
  - 诊断结果卡
  - 归因核查卡
  - 证据引用卡
  - 用户反馈入口

[AI 工作流中台]
  - 总控智能体
  - 投放诊断智能体
  - 归因核对智能体
  - Prompt 管理
  - 模型路由
  - 工具调用计划
  - 安全审查
  - Trace 日志

[数据与知识层]
  - 广告报表数据
  - MMP/归因数据
  - postback 状态数据
  - 投放 SOP/指标口径/归因口径
  - 外部平台文档
  - 历史投放归因工单
  - 向量库与关键词索引

[治理与运营后台]
  - 知识库管理
  - Badcase 管理
  - 评测集管理
  - Prompt 版本管理
  - 工具权限管理
  - 灰度与监控
```

## 5.3 智能体状态机

![投放归因排障智能体状态机图](assets/adops_attribution_state_machine.svg)

| 状态 | 说明 | 下一状态 |
| --- | --- | --- |
| 已接收 | 创建会话，记录用户、语言、入口和上下文 | 意图识别中 |
| 意图识别中 | 判断问题类型、风险等级、所需工具和补充信息 | 检索中 / 待用户补充 |
| 检索中 | 查询投放 SOP、归因口径、指标定义和历史案例 | 工具规划中 |
| 工具规划中 | 生成只读工具调用计划并做权限检查 | 工具执行中 / 权限拒绝 |
| 工具执行中 | 调用报表、账户状态、归因对账、postback 状态等工具 | 证据汇总中 |
| 证据汇总中 | 对工具输出和知识引用归一化 | 诊断生成中 |
| 诊断生成中 | 生成结论、置信度、建议和风险提示 | 安全检查中 |
| 安全检查中 | 检查无证据强答、越权、高风险动作 | 可交付 / 人工审核 |
| 可交付 | 展示诊断结果、核查清单和下一步建议 | 已反馈 / 已转交 |
| 人工审核 | 需要人工确认或补充判断 | 可交付 / 已转交 |
| 已反馈 | 用户确认有效、无效、部分有效 | Badcase 回流 / 完成 |

## 5.4 产品原则

| 原则 | 产品要求 |
| --- | --- |
| 证据优先 | 没有知识、数据或口径依据时，必须说明无法判断，并给出补充信息清单 |
| 人工可控 | 高风险判断、客户可见表达、账户操作必须保留人工确认 |
| 权限最小化 | 用户只能查询其角色和账户范围内的数据，模型不直接绕过权限系统 |
| 场景化工作流 | 投放和归因问题使用固定检查清单和工具链，不依赖开放式自由推理 |
| 可评估可回滚 | 模型、Prompt、工具、知识库版本都要纳入 Trace 和灰度管理 |

# 6. 数据依赖与数据资产战略

## 6.1 关键数据依赖

| 数据类型 | 示例 | 用途 | 风险控制 |
| --- | --- | --- | --- |
| 广告报表数据 | spend、impression、click、install、CVR、CPA、ROI | 投放异常诊断 | 只读查询、账户权限过滤、聚合展示 |
| 账户状态数据 | budget、balance、bid、delivery status、review status | 判断预算、账户限制、投放状态 | 只读查询、敏感字段脱敏 |
| MMP/归因数据 | AppsFlyer、Adjust、Singular 口径数据 | 归因差异核对 | 脱敏、窗口限制、引用口径 |
| postback 状态 | 成功、失败、延迟、拒收、重试 | 判断归因和转化数据差异 | 日志摘要化，不展示敏感 token |
| 内部 SOP | 投放排查流程、归因口径、指标定义 | RAG 回答和流程约束 | 版本管理、人工审核 |
| 外部文档 | MMP 文档、平台公开口径 | 补充公开解释 | 标注来源、更新时间 |
| 历史工单 | 投放异常、归因差异的处理过程 | 案例召回与经验复用 | 客户信息脱敏、可见范围控制 |
| 用户反馈 | 采纳、无效、原因、人工修正 | Badcase 和评测集迭代 | 记录操作者和版本 |

## 6.2 数据资产分层

```text
L1 原始数据层
  广告报表、账户状态、归因数据、postback 状态、SOP、工单

L2 标准化数据层
  统一字段、统一时间窗口、统一账户实体、统一事件名称、统一文档元数据

L3 AI 可用数据层
  Chunk、Embedding、标签、实体、问答对、工具输出 schema、黄金测试集

L4 业务资产层
  投放诊断模板、归因核查模板、Badcase 集、指标口径库、归因口径库
```

## 6.3 知识库分层

| 层级 | 内容 | 示例 | 更新机制 |
| --- | --- | --- | --- |
| KB-1 业务口径 | 广告指标定义、归因窗口、账户层级 | CVR、CPA、install、postback | 产品/运营审核后发布 |
| KB-2 投放排障 SOP | 常见异常处理流程 | 消耗骤降、转化异常、CPA 上升 | Badcase 驱动更新 |
| KB-3 归因口径 | MMP、postback、去重、时区、窗口 | click-through、view-through、event mapping | 产品/技术支持维护 |
| KB-4 历史案例 | 已解决的投放和归因问题 | 转化下降、MMP 差异、postback 延迟 | 自动脱敏后人工入库 |
| KB-5 外部文档 | MMP、平台公开文档 | AppsFlyer/Adjust/Singular 文档 | 定期抓取和人工确认 |

## 6.4 双语元数据规范

| 字段 | 说明 |
| --- | --- |
| language | 文档主语言，取值 zh、en、mixed |
| business_locale | 业务适用区域，例如 global、US、SEA、EU |
| audience | internal、technical、customer-facing-reference |
| source_type | SOP、metric definition、attribution policy、ticket、external doc |
| entity_tags | campaign、ad group、publisher、MMP、postback、event |
| sensitivity_level | public、internal、confidential、restricted |
| effective_date | 口径或政策生效时间 |
| owner | 文档负责人 |
| reviewed_status | draft、reviewed、deprecated |

## 6.5 数据资产运营阶段

| 阶段 | 目标 | 关键动作 |
| --- | --- | --- |
| 冷启动 | 支撑投放和归因核心场景可用 | 整理 TOP 问题、投放 SOP、指标口径、归因口径、历史案例 |
| 灰度期 | 修复高频错误 | 收集 Badcase，更新 Chunk、标签、Prompt 和评测集 |
| 稳定期 | 提升复用和覆盖 | 建立知识 Owner、月度复审、失效文档清理 |
| 扩展期 | 支撑后续能力 | 将 postback、日志、素材、回复相关知识转交后续扩展 PRD 使用 |

# 7. 独立需求 PRD

## 7.1 需求 0：总控智能体与权限路由

### 7.1.1 背景

投放和归因问题经常以自然语言提出，同一句问题可能涉及指标查询、账户状态、归因窗口、MMP 口径、postback 延迟和历史案例。如果直接交给大模型自由回答，容易出现意图误判、越权查询、遗漏关键检查项或无证据结论。总控智能体负责统一入口、任务拆解、工具计划、安全控制和结果编排。

### 7.1.2 功能目标

1. 识别用户问题属于投放诊断、归因核对、知识查询或其他范围外问题。
2. 根据用户角色和账户范围生成可执行的只读工具调用计划。
3. 把投放和归因问题拆分给对应场景智能体，并汇总最终结果。
4. 对范围外问题、无证据、越权和高风险对外表达进行拦截。

### 7.1.3 核心功能

| 功能 | 说明 |
| --- | --- |
| 意图识别 | 分类为投放诊断、归因核对、知识查询、范围外问题 |
| 语言识别 | 支持英文、中文、中英混合输入，输出语言按入口控制 |
| 风险分级 | 区分低风险查询、中风险诊断、高风险客户承诺或操作建议 |
| 信息完整度检查 | 判断是否缺少 campaign、account、time range、metric、MMP、event 等关键字段 |
| 工具计划 | 生成工具调用顺序、参数、权限要求和失败兜底 |
| 安全拦截 | 越权、无证据、高风险动作、客户可见表达触发人工确认或转人工 |

### 7.1.4 工作流程

```text
用户输入
  -> 语言识别
  -> 意图分类
  -> 实体抽取
  -> 范围判断
  -> 信息完整度检查
  -> 权限校验
  -> 工具计划生成
  -> 场景智能体调用
  -> 证据聚合
  -> 安全检查
  -> 输出诊断或追问
```

### 7.1.5 输入输出结构

```json
{
  "input": {
    "user_query": "Why did campaign A installs drop yesterday?",
    "user_role": "adops",
    "account_scope": ["account_001"],
    "locale": "en-US",
    "conversation_context": []
  },
  "output": {
    "language": "en",
    "intent": "campaign_performance_diagnosis",
    "entities": {
      "campaign_id": "campaign_A",
      "time_range": "yesterday",
      "metric": "installs"
    },
    "risk_level": "medium",
    "missing_fields": [],
    "tool_plan": ["get_campaign_metrics", "retrieve_sop", "search_similar_cases"],
    "requires_human_review": false
  }
}
```

### 7.1.6 Prompt 设计要点

| 层级 | 内容 |
| --- | --- |
| 系统约束 | 你是投放归因排障总控，只能基于证据和授权工具输出任务规划 |
| 任务目标 | 识别意图、抽取实体、判断风险、生成工具计划 |
| 禁止项 | 禁止编造数据、禁止越权、禁止直接承诺客户赔偿或投放效果 |
| 输出格式 | 必须输出 JSON，字段缺失时给出 missing_fields |
| 范围规则 | SDK/API 深度排障、素材审核、客户回复生成标记为 out_of_scope_for_current_phase |

### 7.1.7 技术选型

| 任务 | 首选 | 备选 | 选择理由 |
| --- | --- | --- | --- |
| 意图识别与路由 | OpenAI GPT-4o mini | Qwen2.5-72B-Instruct、GLM-4-Plus | 成本低、结构化输出稳定、英文理解强 |
| 复杂任务拆解 | OpenAI GPT-4o | DeepSeek-R1/DeepSeek-Reasoner、Qwen2.5-Max | 复杂多步推理时更稳，可通过模型路由控制成本 |
| 安全二次判断 | Qwen2.5-72B-Instruct | GLM-4-Plus、规则引擎 | 可做独立 Judge，降低单模型自评偏差 |

不考虑 Anthropic 模型，原因是企业主体和可用性限制，不进入当前候选。

### 7.1.8 页面草图

```text
+-----------------------------------------------------+
| AdOps Copilot                                      |
+-----------------------------------------------------+
| User: Why did installs drop for Campaign A?         |
|                                                     |
| Copilot is checking:                                |
| [x] Intent: Campaign performance diagnosis          |
| [x] Campaign scope permission                       |
| [x] Metrics for selected time range                 |
| [ ] Similar historical cases                        |
| [ ] Diagnosis summary                               |
+-----------------------------------------------------+
```

### 7.1.9 验收与灰度

| 项目 | 标准 |
| --- | --- |
| 意图识别 | 黄金集准确率 90% 以上 |
| 范围识别 | SDK/API、素材审核、客户回复等范围外问题识别准确率 95% 以上 |
| 权限控制 | 越权工具调用率为 0 |
| JSON 输出 | 关键字段合法率 99% 以上 |
| 灰度范围 | 先开放给 5-10 名资深 AdOps，覆盖只读诊断场景 |

## 7.2 需求 1：投放效果异常诊断

### 7.2.1 背景

投放异常是 AdOps 最常见问题之一，典型表现包括消耗骤降、展示下降、点击率异常、转化减少、CPA 上升、ROI 下滑。人工排查需要跨广告报表、账户配置、预算状态、素材状态、归因数据和历史变更记录，耗时且高度依赖经验。

### 7.2.2 功能目标

1. 自动拆解异常指标，识别影响链路。
2. 调用授权报表和知识库生成排查路径。
3. 输出证据、可能原因、置信度和下一步动作。
4. 形成可供内部协作使用的诊断摘要。

### 7.2.3 核心功能

| 功能 | 说明 |
| --- | --- |
| 异常指标识别 | 判断 spend、impression、click、install、CVR、CPA、ROI 哪个指标异常 |
| 时间窗口对比 | 支持 WoW、DoD、同小时对比、投放开始后累计对比 |
| 维度下钻 | account、campaign、ad group、creative、publisher、country、device |
| 原因归类 | 预算、出价、库存、素材状态、审核状态、追踪、归因、市场波动 |
| 证据卡 | 展示指标变化、数据来源、查询时间、相关规则和历史案例 |
| 下一步建议 | 给出可执行检查项和需要人工确认的问题 |

### 7.2.4 指标拆解

| 异常现象 | 优先检查 | 可能原因 |
| --- | --- | --- |
| Spend 下降 | 预算、余额、出价、库存、审核状态 | 预算耗尽、账户限额、竞价不足、素材被拒 |
| Impression 下降 | 流量来源、定向、频控、素材可用性 | 定向过窄、库存下降、素材暂停 |
| Click 下降 | CTR、素材、展示位置 | 素材疲劳、位置质量变化 |
| Install 下降 | CVR、归因、落地页、postback | 归因延迟、落地页异常、回传失败 |
| CPA 上升 | CPC、CVR、转化质量 | 流量质量变化、素材转化下降 |
| ROI 下降 | 成本、付费事件、收入回传 | 付费延迟、事件配置问题 |

### 7.2.5 输入输出结构

```json
{
  "diagnosis_input": {
    "account_id": "account_001",
    "campaign_id": "campaign_A",
    "metric": "installs",
    "time_range": "2025-01-20 to 2025-01-21",
    "compare_with": "previous_7_days"
  },
  "diagnosis_output": {
    "abnormal_metrics": ["installs", "CVR"],
    "primary_hypothesis": "Conversion tracking or landing page issue",
    "confidence": 0.72,
    "evidence": [
      {
        "source": "campaign_metrics",
        "fact": "Clicks remained stable while installs dropped 38%",
        "time_range": "2025-01-20 to 2025-01-21"
      }
    ],
    "next_actions": ["Check postback status", "Verify landing page availability"],
    "internal_summary": "Traffic volume remained stable, while conversion rate declined. The next check should focus on conversion tracking and landing page availability."
  }
}
```

### 7.2.6 技术选型

| 能力 | 选型 | 理由 |
| --- | --- | --- |
| 指标计算 | 规则引擎 + SQL 模板 | 指标判断必须确定性，不能由模型自由计算 |
| 诊断总结 | GPT-4o mini | 英文总结稳定，成本可控 |
| 复杂多维归因 | GPT-4o 或 DeepSeek-Reasoner | 多指标、多时间窗口、多假设排序需要更强推理 |
| 知识检索 | OpenAI text-embedding-3-large + Cohere Rerank 3.5 | 英文和混合语义检索稳定，重排序提升引用准确率 |

### 7.2.7 页面草图

```text
+-----------------------------------------------------+
| Diagnosis: Campaign A install drop                  |
+-----------------------------------------------------+
| Severity: Medium       Confidence: 72%              |
|                                                     |
| Key finding                                          |
| Clicks stayed stable, but CVR dropped by 38%.        |
|                                                     |
| Likely causes                                       |
| 1. Tracking/postback issue                           |
| 2. Landing page conversion issue                     |
| 3. Creative fatigue                                  |
|                                                     |
| Evidence                                             |
| - Campaign metrics query #M123                       |
| - CVR diagnosis SOP v2025.01                         |
|                                                     |
| Next actions                                         |
| [Check attribution] [Check postback] [Escalate]      |
+-----------------------------------------------------+
```

### 7.2.8 验收与灰度

| 项目 | 标准 |
| --- | --- |
| 异常检测 | TOP 20 高频异常黄金集召回率 85% 以上 |
| 证据完整 | 每个主要结论至少 1 个数据证据或知识引用 |
| 人工采纳 | 灰度期采纳率 60% 以上 |
| 灰度范围 | 先覆盖 spend drop、install drop、CPA increase 三类问题 |

## 7.3 需求 2：归因与数据不一致核对

### 7.3.1 背景

广告平台、MMP、客户后台之间的数据不一致是海外广告业务高频问题。差异可能来自归因窗口、时区、去重、回调延迟、事件定义、隐私限制、渠道口径差异等。人工解释若缺少结构化核查清单，容易漏项或对不同客户给出不一致说法。

### 7.3.2 功能目标

1. 结构化核对平台与 MMP/客户后台差异。
2. 输出差异比例、可能原因和必须确认的信息。
3. 输出内部解释摘要和下一步核查清单。
4. 对无法判断的情况明确标注需要补充数据。

### 7.3.3 核对清单

| 检查项 | 说明 |
| --- | --- |
| 时间窗口 | 是否使用相同日期范围、小时窗口和时区 |
| 归因窗口 | click-through、view-through、install/event 回传窗口是否一致 |
| 去重规则 | 是否存在重复事件过滤、reinstall、re-attribution |
| 事件定义 | install、registration、purchase 等事件口径是否一致 |
| 回调状态 | postback 是否延迟、失败、重试或被拒收 |
| 平台过滤 | 作弊过滤、无效流量、隐私限制是否影响数据 |
| 渠道映射 | campaign、ad group、publisher ID 是否映射一致 |
| 数据延迟 | MMP 和平台报表是否有不同刷新延迟 |

### 7.3.4 工作流程

```text
选择平台数据和 MMP 数据
  -> 对齐时间窗口和时区
  -> 计算差异比例
  -> 检查事件定义与归因窗口
  -> 检查 postback 状态和延迟
  -> 检索相关口径文档
  -> 生成差异解释和补充信息清单
```

### 7.3.5 输入输出结构

```json
{
  "input": {
    "platform_metric": "installs",
    "platform_value": 1200,
    "mmp_metric": "installs",
    "mmp_value": 860,
    "timezone": "UTC+0",
    "attribution_window": "7d click / 1d view"
  },
  "output": {
    "difference_rate": "28.3%",
    "likely_reasons": ["attribution window mismatch", "postback delay"],
    "required_checks": ["confirm MMP timezone", "check rejected postbacks"],
    "evidence": ["MMP attribution policy doc", "postback status query"],
    "internal_explanation_summary": "The discrepancy may be related to attribution window mismatch and postback delay. MMP timezone and rejected postbacks need confirmation."
  }
}
```

### 7.3.6 技术选型

| 能力 | 选型 | 理由 |
| --- | --- | --- |
| 差异计算 | SQL 模板 + 固定公式 | 差异比例和口径判断要求可复核 |
| 归因解释 | GPT-4o mini | 英文解释能力强，适合生成结构化说明 |
| 复杂口径推理 | Qwen2.5-72B-Instruct 或 DeepSeek-Reasoner | 可作为备选模型验证多因素原因排序 |
| 文档检索 | bge-m3 + bge-reranker-v2-m3 作为中国厂商/开源备选 | 降低供应商风险，支持中英混合知识 |

### 7.3.7 验收与灰度

| 项目 | 标准 |
| --- | --- |
| 核对完整率 | 黄金集关键检查项覆盖率 85% 以上 |
| 差异解释质量 | 人工审核认为可用于内部判断的比例 75% 以上 |
| 强结论控制 | 缺少 MMP 数据时不得输出确定原因 |
| 灰度范围 | 先覆盖 install discrepancy 和 event discrepancy |

## 7.4 需求 3：知识库治理与 Badcase 回流

### 7.4.1 背景

投放归因排障助手上线后的核心竞争力不只来自模型，而来自持续沉淀的业务知识、真实 Badcase、评测样本和可复用工作流。如果缺少治理机制，知识库会很快失效，Prompt 迭代无法验证，模型切换也没有客观依据。

### 7.4.2 功能目标

1. 建立投放和归因知识从创建、审核、发布、废弃到回滚的全生命周期。
2. 将用户反馈、错误回答、人工修正转化为 Badcase。
3. 把 Badcase 纳入评测集、Prompt 优化和知识库修订。
4. 支持模型、Prompt、工具和知识版本的对比实验。

### 7.4.3 核心功能

| 功能 | 说明 |
| --- | --- |
| 知识入库 | 支持 SOP、FAQ、指标口径、归因口径、历史案例入库 |
| Chunk 管理 | 查看切分结果、标签、引用、Embedding 状态 |
| 审核发布 | draft、reviewed、published、deprecated 状态流转 |
| Badcase 标记 | 用户可标记错误、无帮助、证据不足、核查遗漏 |
| 修复闭环 | 分派 Owner，记录修复版本和回归结果 |
| 评测集管理 | 将典型 Badcase 加入黄金集或压力集 |

### 7.4.4 Badcase 流程

```text
用户标记无效
  -> 选择原因：意图错 / 检索错 / 数据错 / 推理错 / 核查遗漏 / 越权风险
  -> 自动保存问题、上下文、工具输出、模型版本、Prompt 版本
  -> 运营人员分派 Owner
  -> 修复知识、Prompt、规则或工具
  -> 回归评测通过
  -> 发布新版本并关闭 Badcase
```

### 7.4.5 验收与灰度

| 项目 | 标准 |
| --- | --- |
| Badcase 完整性 | 自动记录 Query、证据、模型、Prompt、工具版本 |
| 修复闭环 | 核心 Badcase 7 个工作日内完成处理 |
| 知识失效 | deprecated 文档不得被线上回答引用 |
| 灰度范围 | 与投放诊断、归因核对同步上线 |

# 8. 模型输入输出与 Prompt 设计

本节定义投放归因排障助手的模型输入、输出、上下文填充和 Prompt 执行协议。对本产品而言，Prompt 不是文案模板，而是 AI 工作流、数据证据、权限边界和评测体系之间的执行协议。

## 8.1 任务拆分与模型职责

| 任务 | 触发条件 | 主要输入 | 主要输出 | 默认模型 | 人工介入 |
| --- | --- | --- | --- | --- | --- |
| 任务一：意图识别与 Query 改写 | 用户提交问题或继续追问 | 原始问题、会话上下文、用户角色、权限范围 | 意图、实体、缺失字段、工具计划 | GPT-4o mini / Qwen2.5-72B-Instruct | 信息缺失或范围外时追问 |
| 任务二：投放效果异常诊断 | intent 为 campaign_performance_diagnosis | 指标结果、账户状态、投放 SOP、历史案例 | 异常层级、原因假设、证据、下一步动作 | GPT-4o mini + 规则引擎，复杂场景升级 GPT-4o/DeepSeek-R1 | 低置信度或高风险结论需审核 |
| 任务三：归因与数据不一致核对 | intent 为 attribution_discrepancy_check | 平台报表、MMP 报表、postback 状态、归因口径 | 差异率、核查清单、可能原因、待补充项 | GPT-4o mini，疑难场景升级 DeepSeek-R1/Qwen QwQ | 涉及客户可见解释时需审核 |
| 任务四：Judge AI 评估 | 诊断结果生成后、离线评测、灰度回归 | 待评估输出、证据对象、黄金答案、安全策略 | 评分、阻塞问题、修复建议、是否可交付 | Qwen2.5-72B + GPT-4o 抽检 | 阻塞问题进入人工复核 |

## 8.2 模型输入输出总览

| 模块 | 输入来源 | 输入变量 | 输出对象 | 前端/后台消费方式 |
| --- | --- | --- | --- | --- |
| 总控智能体 | 用户入口、会话系统、IAM、工具注册表 | `{{user_query}}`、`{{conversation_context}}`、`{{user_profile}}`、`{{permission_scope}}`、`{{available_tools}}` | `routing_result` | 决定是否追问、是否检索、是否调用工具 |
| RAG 检索链路 | 知识库、历史案例、外部公开文档 | `{{rewritten_query}}`、实体标签、语言、权限范围 | `retrieved_knowledge` | 作为回答引用、SOP 约束和归因口径依据 |
| 投放诊断智能体 | 总控结果、广告报表、账户状态、RAG 结果 | `{{routing_result}}`、`{{metric_results}}`、`{{account_status}}`、`{{business_rules}}` | `performance_diagnosis_result` | 渲染诊断结果卡、下一步建议、证据引用 |
| 归因核对智能体 | 总控结果、MMP/平台报表、postback、归因口径 | `{{platform_report}}`、`{{mmp_report}}`、`{{postback_status}}`、`{{event_mapping}}` | `attribution_check_result` | 渲染归因核查卡、差异说明、待确认清单 |
| Judge AI | 智能体输出、证据对象、黄金答案、安全策略 | `{{agent_output}}`、`{{evidence_objects}}`、`{{golden_answer}}`、`{{safety_policy}}` | `judge_result` | 决定是否可交付、是否转人工、是否进入 Badcase |

核心约束：所有业务结论必须能追溯到 `evidence_objects`。如果证据不足，模型只能输出“无法判断 + 需要补充的信息 + 建议查询路径”，不能输出确定结论。

## 8.3 Prompt 设计总则

| 规则 | 要求 |
| --- | --- |
| 分层设计 | 系统约束、任务说明、业务上下文、工具结果、输出 schema 分离维护 |
| 证据绑定 | 结论字段必须引用 evidence_id，无法引用时不得输出确定结论 |
| 结构化输出 | 所有智能体默认输出 JSON，前端再渲染成卡片 |
| 风险显式化 | 输出必须包含 risk_flags、confidence、requires_human_review |
| 双语控制 | 内部上下文可中英混合，用户界面按入口语言输出 |
| 版本可追溯 | 每次调用记录 prompt_id、prompt_version、model、temperature |

## 8.4 Prompt 变量与上下文填充规范

Prompt 执行时不直接把用户原始问题丢给模型，而是由总控层先完成上下文组装。每个场景智能体只能读取自己需要的上下文，缺失字段必须显式写入 `missing_fields` 或 `required_followups`，不能让模型自行假设。

| 变量 | 含义 | 来源 | 缺失处理 |
| --- | --- | --- | --- |
| `{{current_time}}` | 当前调用时间和默认时区 | 系统时间、用户区域配置 | 使用系统默认时区，并在输出中标明 |
| `{{user_query}}` | 用户原始问题 | Chat、Campaign 侧边栏、工单入口 | 不可缺失 |
| `{{conversation_context}}` | 多轮对话上下文 | 会话历史 | 没有历史时传空数组 |
| `{{user_profile}}` | 用户角色、团队、语言偏好 | IAM、用户配置 | 缺失时按最小权限处理 |
| `{{permission_scope}}` | 用户可访问账户、客户、区域、工具权限 | 权限系统 | 缺失时禁止工具调用 |
| `{{phase_scope}}` | 当前 PRD 范围边界 | 产品配置 | 范围外问题进入 out_of_scope |
| `{{available_tools}}` | 当前可调用工具注册表 | Tool Gateway | 缺失时只能知识检索和追问 |
| `{{retrieved_knowledge}}` | RAG 召回的 SOP、口径、历史案例 | 检索服务 | 无召回时必须说明证据不足 |
| `{{tool_outputs}}` | 工具网关返回的标准化结果 | 报表、归因、账户、postback 工具 | 工具失败时输出失败原因和人工处理入口 |
| `{{evidence_objects}}` | 可引用证据对象 | 证据归一化层 | 没有证据时不得输出确定结论 |

## 8.5 总控智能体 Prompt 模板

### 8.5.1 变量填充

| 变量 | 填入内容 | 主要用途 |
| --- | --- | --- |
| `{{current_time}}` | 当前日期、时间、默认时区 | 解析 yesterday、last 7 days 等相对时间 |
| `{{user_query}}` | 用户原始问题 | 识别意图和实体 |
| `{{conversation_context}}` | 最近多轮对话摘要 | 处理省略指代和上下文继承 |
| `{{user_profile}}` | 用户角色、团队、语言偏好 | 决定输出语言和风险提示方式 |
| `{{permission_scope}}` | 可访问账户、客户、区域、工具权限 | 判断是否允许生成工具计划 |
| `{{available_tools}}` | 工具名、参数 schema、权限要求、超时策略 | 生成只读工具调用计划 |
| `{{phase_scope}}` | 当前阶段只支持投放诊断、归因核对、知识查询 | 判断是否范围外 |

```text
输入变量：
- 当前时间：{{current_time}}
- 用户问题：{{user_query}}
- 会话上下文：{{conversation_context}}
- 用户画像与语言偏好：{{user_profile}}
- 权限范围：{{permission_scope}}
- 可用工具注册表：{{available_tools}}
- 当前产品范围：{{phase_scope}}

角色：
你是 AdOps Copilot 投放归因排障助手的任务总控智能体，负责识别投放和归因问题的意图、实体、风险和工具调用计划。

任务：
1. 判断用户问题属于哪个业务场景。
2. 抽取 account、campaign、app、MMP、time range、metric、geo 等实体。
3. 判断信息是否足够。
4. 判断用户是否可能需要受限数据。
5. 生成只读工具调用计划。
6. 不回答最终业务结论，只做任务规划。

禁止：
- 不得编造任何指标、账户状态、MMP 结果或日志。
- 不得绕过权限调用工具。
- 不得生成客户可见回复。
- 不得承诺投放效果、赔偿或恢复时间。

输出 JSON：
{
  "intent": "campaign_performance_diagnosis | attribution_discrepancy_check | knowledge_lookup | out_of_scope | unknown",
  "language": "zh | en | mixed",
  "entities": {
    "account_id": null,
    "campaign_id": null,
    "app_id": null,
    "mmp": null,
    "metric": null,
    "time_range": null,
    "geo": null
  },
  "missing_fields": [],
  "risk_level": "low | medium | high",
  "tool_plan": [
    {
      "tool_name": "",
      "purpose": "",
      "required_permission": "",
      "blocking_if_failed": true
    }
  ],
  "requires_user_clarification": false,
  "clarification_question": ""
}
```

### 8.5.2 输入示例

```json
{
  "current_time": "2025-02-15T10:00:00Z",
  "user_query": "Why did installs drop for campaign C123 yesterday?",
  "conversation_context": [],
  "user_profile": {"role": "AdOps", "language": "en", "team": "Global Growth"},
  "permission_scope": {"accounts": ["A001"], "campaigns": ["C123"], "tools": ["get_campaign_metrics", "get_account_status"]},
  "available_tools": ["get_campaign_metrics", "get_account_status", "search_knowledge_base"],
  "phase_scope": ["campaign_performance_diagnosis", "attribution_discrepancy_check", "knowledge_lookup"]
}
```

### 8.5.3 输出示例

```json
{
  "intent": "campaign_performance_diagnosis",
  "language": "en",
  "entities": {
    "account_id": "A001",
    "campaign_id": "C123",
    "app_id": null,
    "mmp": null,
    "metric": "installs",
    "time_range": "2025-02-14",
    "geo": null
  },
  "missing_fields": ["compare_with"],
  "risk_level": "medium",
  "tool_plan": [
    {"tool_name": "get_campaign_metrics", "purpose": "compare installs, clicks and spend with baseline", "required_permission": "account_scope", "blocking_if_failed": true},
    {"tool_name": "get_account_status", "purpose": "check budget, balance and delivery status", "required_permission": "account_scope", "blocking_if_failed": false}
  ],
  "requires_user_clarification": false,
  "clarification_question": ""
}
```

## 8.6 投放诊断智能体 Prompt 模板

### 8.6.1 变量填充

| 变量 | 填入内容 | 主要用途 |
| --- | --- | --- |
| `{{routing_result}}` | 总控智能体输出的 intent、entities、risk_level、tool_plan | 确认任务类型和实体 |
| `{{user_query}}` | 用户原始问题 | 保留问题表达和关注点 |
| `{{metric_results}}` | `get_campaign_metrics` 返回的指标序列和对比结果 | 判断异常指标和漏斗层级 |
| `{{account_status}}` | 账户、预算、余额、投放状态 | 排查预算、限额、暂停等原因 |
| `{{retrieved_knowledge}}` | 投放 SOP、指标口径、历史案例 | 约束诊断路径和原因分类 |
| `{{evidence_objects}}` | 标准化证据对象列表 | 所有结论必须引用 evidence_id |
| `{{business_rules}}` | 指标计算、异常阈值、时间窗口规则 | 防止模型自行计算或改口径 |

```text
输入变量：
- 总控路由结果：{{routing_result}}
- 用户问题：{{user_query}}
- 指标查询结果：{{metric_results}}
- 账户状态：{{account_status}}
- 召回知识：{{retrieved_knowledge}}
- 证据对象：{{evidence_objects}}
- 业务规则：{{business_rules}}

角色：
你是广告投放效果诊断智能体。你只能基于工具返回的数据、知识库引用和历史案例输出诊断。

分析步骤：
1. 判断异常指标位于漏斗哪一层：曝光、点击、转化、收入。
2. 对比当前周期与基线周期。
3. 判断上游指标是否同步变化。
4. 按预算、出价、库存、素材状态、审核状态、归因、追踪、市场波动分类原因。
5. 给出置信度和下一步检查项。

禁止：
- 不得用模型自行计算输入中不存在的指标。
- 不得把相关性写成因果性。
- 不得给出没有 evidence_id 的确定结论。

输出 JSON：
{
  "issue_type": "",
  "abnormal_metrics": [],
  "funnel_layer": "impression | click | conversion | revenue",
  "primary_hypothesis": "",
  "alternative_hypotheses": [],
  "confidence": 0.0,
  "evidence_ids": [],
  "next_actions": [],
  "internal_summary": "",
  "requires_human_review": false
}
```

### 8.6.2 输入示例

```json
{
  "routing_result": {"intent": "campaign_performance_diagnosis", "entities": {"campaign_id": "C123", "metric": "installs"}},
  "user_query": "Why did installs drop for campaign C123 yesterday?",
  "metric_results": {"spend_change": "-3.1%", "click_change": "+2.1%", "install_change": "-38.0%", "cvr_change": "-39.2%"},
  "account_status": {"delivery_status": "active", "budget_status": "sufficient", "review_status": "approved"},
  "retrieved_knowledge": [{"doc_id": "SOP-PERF-017", "title": "Install drop checklist"}],
  "evidence_objects": [{"evidence_id": "EVT-001", "fact": "Clicks were stable while installs dropped significantly."}],
  "business_rules": {"baseline_window": "previous_7_days", "conversion_drop_threshold": "20%"}
}
```

### 8.6.3 输出示例

```json
{
  "issue_type": "conversion_drop",
  "abnormal_metrics": ["installs", "CVR"],
  "funnel_layer": "conversion",
  "primary_hypothesis": "Conversion-side issue is more likely because clicks stayed stable while installs dropped.",
  "alternative_hypotheses": ["MMP reporting delay", "postback delay", "event mapping issue"],
  "confidence": 0.72,
  "evidence_ids": ["EVT-001"],
  "next_actions": ["Check MMP install report for the same time window", "Check postback delay and failure status", "Confirm whether event mapping changed"],
  "internal_summary": "The issue is likely after click, not traffic acquisition. Need attribution/postback checks before giving customer-facing explanation.",
  "requires_human_review": true
}
```

## 8.7 归因核对智能体 Prompt 模板

### 8.7.1 变量填充

| 变量 | 填入内容 | 主要用途 |
| --- | --- | --- |
| `{{routing_result}}` | 总控智能体输出的 intent、entities、risk_level、tool_plan | 确认归因核对对象 |
| `{{platform_report}}` | 平台侧指标、事件、时间窗口和时区 | 对比平台口径 |
| `{{mmp_report}}` | MMP 侧指标、事件、时间窗口和时区 | 对比 MMP 口径 |
| `{{postback_status}}` | postback 成功、失败、延迟、拒收摘要 | 判断回调链路是否影响差异 |
| `{{attribution_policy_context}}` | 归因窗口、去重、re-attribution、隐私限制口径 | 约束核对清单 |
| `{{event_mapping}}` | 平台事件与 MMP/客户事件映射关系 | 排查事件定义不一致 |
| `{{evidence_objects}}` | 标准化证据对象列表 | 所有结论必须引用 evidence_id |

```text
输入变量：
- 总控路由结果：{{routing_result}}
- 平台报表：{{platform_report}}
- MMP 报表：{{mmp_report}}
- Postback 状态：{{postback_status}}
- 归因口径上下文：{{attribution_policy_context}}
- 事件映射：{{event_mapping}}
- 证据对象：{{evidence_objects}}

角色：
你是广告归因和数据差异核对智能体，负责解释平台、MMP、客户后台之间的数据差异。

必须检查：
1. 日期范围和时区是否一致。
2. click-through 和 view-through attribution window 是否一致。
3. 事件定义是否一致。
4. 去重、re-attribution、reinstall 规则是否一致。
5. postback 是否延迟、失败、重试或被拒收。
6. 隐私限制、作弊过滤、无效流量过滤是否影响数据。
7. campaign/ad group/publisher 映射是否一致。

输出 JSON：
{
  "difference_rate": "",
  "checked_items": [
    {"item": "timezone", "status": "matched | mismatched | unknown", "evidence_id": ""}
  ],
  "likely_reasons": [],
  "required_followups": [],
  "confidence": 0.0,
  "internal_explanation_summary": "",
  "requires_human_review": true
}
```

### 8.7.2 输入示例

```json
{
  "routing_result": {"intent": "attribution_discrepancy_check", "entities": {"campaign_id": "C123", "mmp": "AppsFlyer", "metric": "installs"}},
  "platform_report": {"timezone": "UTC", "installs": 10000, "window": "2025-02-14"},
  "mmp_report": {"timezone": "PST", "installs": 7200, "window": "2025-02-14"},
  "postback_status": {"success_rate": "96%", "delayed_count": 830, "failed_count": 12},
  "attribution_policy_context": [{"doc_id": "ATTR-003", "fact": "MMP report uses advertiser local timezone by default."}],
  "event_mapping": {"platform_event": "install", "mmp_event": "install"},
  "evidence_objects": [{"evidence_id": "EVT-201", "fact": "Platform and MMP reports use different timezone settings."}]
}
```

### 8.7.3 输出示例

```json
{
  "difference_rate": "28%",
  "checked_items": [
    {"item": "timezone", "status": "mismatched", "evidence_id": "EVT-201"},
    {"item": "event_mapping", "status": "matched", "evidence_id": "EVT-202"},
    {"item": "postback_delay", "status": "needs_followup", "evidence_id": "EVT-203"}
  ],
  "likely_reasons": ["Timezone mismatch", "Partial postback delay"],
  "required_followups": ["Re-run both reports in UTC", "Check delayed postback recovery after 24 hours"],
  "confidence": 0.68,
  "internal_explanation_summary": "Timezone mismatch is the primary suspect; delayed postbacks may explain part of the remaining gap.",
  "requires_human_review": true
}
```

## 8.8 Judge AI 评估 Prompt 模板

### 8.8.1 变量填充

| 变量 | 填入内容 | 主要用途 |
| --- | --- | --- |
| `{{scenario}}` | `performance_diagnosis` 或 `attribution_check` | 决定评分维度 |
| `{{user_query}}` | 用户原始问题 | 判断回答是否解决问题 |
| `{{agent_output}}` | 待评估的智能体输出 JSON | 评分对象 |
| `{{evidence_objects}}` | 可引用证据对象 | 检查结论是否有证据 |
| `{{golden_answer}}` | 黄金集标准答案或人工审核要点 | 离线评测时使用 |
| `{{safety_policy}}` | 越权、无证据、高风险输出规则 | 检查安全问题 |

```text
输入变量：
- 场景：{{scenario}}
- 用户问题：{{user_query}}
- 待评估输出：{{agent_output}}
- 可用证据对象：{{evidence_objects}}
- 黄金答案或人工审核要点：{{golden_answer}}
- 安全策略：{{safety_policy}}

角色：
你是 AdOps Copilot 的 Judge AI，负责评估投放诊断或归因核对输出是否可上线、可交付、可复盘。

评估要求：
1. 检查输出是否回答了用户问题。
2. 检查关键结论是否能在 evidence_objects 中找到对应证据。
3. 检查是否存在无证据强答、越权、过度确定、把相关性写成因果性。
4. 对投放诊断，重点检查异常指标、漏斗层级、原因排序、下一步动作是否完整。
5. 对归因核对，重点检查时区、窗口、去重、事件定义、postback、数据延迟是否覆盖。
6. 如果 golden_answer 存在，比较输出与黄金答案的关键差异。

输出 JSON：
{
  "pass": false,
  "overall_score": 0,
  "dimension_scores": {
    "intent_alignment": 0,
    "evidence_alignment": 0,
    "checklist_completeness": 0,
    "reasoning_quality": 0,
    "safety_compliance": 0,
    "actionability": 0
  },
  "blocking_issues": [],
  "non_blocking_issues": [],
  "missing_evidence_ids": [],
  "suggested_fix": "",
  "requires_human_review": true
}
```

### 8.8.2 输入示例

```json
{
  "scenario": "attribution_check",
  "user_query": "MMP shows 30% fewer installs than our dashboard. Why?",
  "agent_output": {"likely_reasons": ["Timezone mismatch", "Postback delay"], "evidence_ids": ["EVT-201", "EVT-203"]},
  "evidence_objects": [{"evidence_id": "EVT-201", "fact": "Timezone mismatch exists."}, {"evidence_id": "EVT-203", "fact": "Postback delay count increased."}],
  "golden_answer": {"must_check": ["timezone", "attribution_window", "event_mapping", "postback_status"]},
  "safety_policy": {"forbid_customer_commitment": true, "require_evidence": true}
}
```

### 8.8.3 输出示例

```json
{
  "pass": false,
  "overall_score": 78,
  "dimension_scores": {
    "intent_alignment": 90,
    "evidence_alignment": 90,
    "checklist_completeness": 65,
    "reasoning_quality": 75,
    "safety_compliance": 90,
    "actionability": 70
  },
  "blocking_issues": ["Missing attribution window check"],
  "non_blocking_issues": ["Need clearer follow-up order"],
  "missing_evidence_ids": [],
  "suggested_fix": "Add attribution window comparison before delivery.",
  "requires_human_review": true
}
```

## 8.9 Prompt 版本、评测与上线规则

| 阶段 | 要求 | 通过条件 |
| --- | --- | --- |
| 草稿 | Prompt Owner 完成变量、禁止项、输出 schema 和样例 | schema 可解析，核心变量无缺失 |
| 离线评测 | 跑意图集、投放诊断集、归因核对集、安全压力集 | 达到第 12 章上线门禁指标 |
| 人工抽检 | 产品、AdOps、技术支持共同抽检关键样本 | 高风险错误为 0，阻塞问题关闭 |
| 小流量灰度 | 只对资深 AdOps 开放，记录 prompt_id 和版本 | 采纳率、无证据强答率、越权率达标 |
| 全量上线 | 纳入 Prompt 管理后台和回归测试 | 支持回滚，Badcase 可追踪到版本 |
| 回滚 | 出现安全问题、质量显著退化或成本异常 | 立即回到上一稳定版本并冻结新流量 |

# 9. 模型选型与技术方案

## 9.1 选型前提

本 PRD 的模型选型基于 2025 年初的企业落地假设：

1. 海外客户沟通以英文为主，内部员工沟通和部分知识文档以中文为主，因此模型必须支持中英双语和中英混合 Query。
2. 系统处理广告业务数据、归因数据和客户相关问题，必须优先考虑权限、审计、数据隔离和供应商可用性。
3. Anthropic 系列模型因企业主体和可用性原因暂不纳入候选。
4. 不同 Agent 的模型选型要和任务绑定：路由任务重视结构化输出，诊断任务重视证据推理，归因任务重视检查清单完整性。
5. 当前阶段不追求单一模型统一解决所有问题，而采用模型路由和可替换架构。

## 9.2 技术组件总览

| 组件 | 首选方案 | 备选方案 | 选择理由 |
| --- | --- | --- | --- |
| 通用轻量 LLM | OpenAI GPT-4o mini | Qwen2.5-72B-Instruct、GLM-4-Plus | 成本可控，适合意图识别、摘要、低风险诊断 |
| 高质量生成 LLM | OpenAI GPT-4o | Qwen2.5-Max、Kimi-k1.5、Gemini 1.5 Pro | 复杂诊断和冲突证据解释更稳定 |
| 深度推理模型 | DeepSeek-R1/DeepSeek-Reasoner | OpenAI o3-mini、Qwen QwQ | 适合多步归因、复杂异常原因排序和疑难案例分析 |
| Embedding | OpenAI text-embedding-3-large | Alibaba text-embedding-v3、BAAI bge-m3 | 英文和混合语义效果稳定，备选可降低供应商风险 |
| Rerank | Cohere Rerank 3.5 | Alibaba gte-rerank、BAAI bge-reranker-v2-m3 | 提升长文档检索和引用准确率 |
| 关键词检索 | OpenSearch / Elasticsearch | PostgreSQL full-text search | 错误码、campaign ID、MMP 字段需要精确召回 |
| 向量库 | pgvector 或 Milvus | OpenSearch Vector | pgvector 适合早期简单部署，Milvus 适合后续规模化 |
| 工作流编排 | LangGraph 或自研状态机 | Temporal + 自研 Agent 编排 | 需要显式状态、失败重试、人工中断和审计 |
| 权限与工具网关 | 自研 Tool Gateway | API Gateway + RBAC/ABAC | 广告数据查询必须受权限和参数模板控制 |

## 9.3 按智能体选择模型

| 智能体 | 首选模型 | 备选模型 | 选择逻辑 |
| --- | --- | --- | --- |
| 总控智能体 | GPT-4o mini | Qwen2.5-72B-Instruct | 低延迟、低成本、JSON 稳定，复杂路由可升级 GPT-4o |
| 投放诊断智能体 | GPT-4o mini + 规则引擎 | GPT-4o、DeepSeek-R1 | 指标计算由规则完成，模型负责解释和原因排序 |
| 归因核对智能体 | GPT-4o mini | DeepSeek-R1、Qwen2.5-72B | 归因差异需要结构化检查清单和多因素解释 |
| Judge 评测智能体 | Qwen2.5-72B + GPT-4o 抽检 | GLM-4-Plus | 评测需要多模型交叉验证，人工抽检校准 |

## 9.4 双语与海外业务策略

| 场景 | 输入 | 内部处理 | 输出 |
| --- | --- | --- | --- |
| 员工中文提问 | 中文 | 检索中英文知识，中文推理摘要 | 英文界面可展示英文结论，内部备注可中文 |
| 员工英文提问 | 英文 | 优先英文知识，必要时检索中文 SOP | 英文回答 |
| 中英混合提问 | mixed | 实体和术语保留英文，流程解释可中文 | 按用户入口语言输出 |
| 归因口径解释 | 诊断证据可能中英混合 | 内部先抽取 confirmed facts | 输出内部可复核解释，不直接作为客户回复 |

## 9.5 模型路由策略

1. 默认请求进入 GPT-4o mini 或 Qwen2.5-72B 路由层。
2. 需要复杂推理、多步归因、冲突证据处理时，升级到 GPT-4o 或 DeepSeek-R1。
3. 所有指标计算、差异比例计算由规则和 SQL 完成，模型只做解释和排序。
4. 所有高风险输出必须经过规则引擎和独立审核模型。
5. 模型选择结果、版本、温度、Prompt 版本必须写入 Trace。

# 10. 用户页面与交互设计

## 10.1 产品入口

| 入口 | 使用对象 | 典型触发 |
| --- | --- | --- |
| Copilot Chat | 全体内部用户 | 输入自然语言投放或归因问题，获得诊断和核查结果 |
| Campaign 页面侧边栏 | AdOps、AM | 查看某个 campaign 时直接发起投放排障 |
| 工单系统插件 | CS、技术支持 | 从客户反馈一键生成内部诊断摘要 |
| 管理后台 | 产品、运营、管理员 | 管理知识库、Prompt、工具、评测和灰度 |

## 10.2 诊断结果卡

```text
+-----------------------------------------------------+
| Campaign Diagnosis                                  |
+-----------------------------------------------------+
| Issue: Install drop                                 |
| Time range: Jan 20 - Jan 21, 2025                   |
| Severity: Medium     Confidence: 72%                |
|                                                     |
| What changed                                        |
| - Clicks remained stable                            |
| - CVR dropped from 4.1% to 2.5%                     |
| - Installs dropped by 38%                           |
|                                                     |
| Likely causes                                       |
| 1. Landing page timeout in US traffic               |
| 2. Postback delay needs confirmation                |
|                                                     |
| Evidence                                             |
| [Metrics query #M123] [SOP: CVR Diagnosis v3]        |
|                                                     |
| Next actions                                         |
| [Check attribution] [Check postback] [Escalate]      |
+-----------------------------------------------------+
```

## 10.3 归因核查卡

```text
+-----------------------------------------------------+
| Attribution Check                                   |
+-----------------------------------------------------+
| Platform installs: 1,200                            |
| MMP installs: 860                                   |
| Difference: 28.3%                                   |
|                                                     |
| Checklist                                           |
| [x] Time range aligned                              |
| [ ] MMP timezone needs confirmation                 |
| [x] Attribution window checked                      |
| [ ] Rejected postbacks need confirmation            |
|                                                     |
| Likely explanation                                  |
| Attribution window mismatch and postback delay may  |
| explain the current gap.                            |
+-----------------------------------------------------+
```

## 10.4 证据引用卡

```text
+-----------------------------------------------------+
| Evidence                                             |
+-----------------------------------------------------+
| Source type: Metrics query                           |
| Source ID: M123                                      |
| Time range: 2025-01-20 00:00 - 2025-01-21 23:59 UTC |
| Owner: Ad Reporting                                  |
|                                                     |
| Fact                                                |
| Clicks changed by +2.1%, while installs changed by  |
| -38.0% during the same period.                      |
|                                                     |
| Used in answer                                      |
| Primary hypothesis: conversion-side issue            |
+-----------------------------------------------------+
```

# 11. 工具、权限、安全与合规

## 11.1 工具网关原则

| 原则 | 要求 |
| --- | --- |
| 只读优先 | 当前阶段工具只允许查询，不允许修改账户、预算、出价、素材状态 |
| 参数模板化 | 模型只能填充允许字段，不能自由生成 SQL 或任意 API 调用 |
| 权限前置 | 工具执行前必须校验用户角色、账户范围、数据敏感级别 |
| 输出归一 | 所有工具输出必须转为统一 evidence object |
| 可审计 | 记录工具名、参数、调用人、时间、结果摘要、错误码和 Trace ID |
| 可降级 | 工具失败时提供失败原因、重试建议和人工处理入口 |

## 11.2 数据工具清单

| 工具 | 用途 | 输入 | 输出 | 权限 |
| --- | --- | --- | --- | --- |
| get_campaign_metrics | 查询广告指标 | account、campaign、time range、metric | 指标序列、对比结果 | AdOps/AM 按账户授权 |
| get_account_status | 查询账户、余额、限额、状态 | account_id | 状态、余额、限制原因 | AdOps/Finance 部分字段限制 |
| get_attribution_report | 查询归因数据 | campaign、event、MMP、time range | 平台/MMP 对比 | AdOps/AM 按客户授权 |
| get_postback_status | 查询回调状态摘要 | app_id、event、time range | 成功/失败/延迟/拒收摘要 | 技术支持/AdOps 限定字段 |
| retrieve_attribution_docs | 检索归因口径文档 | MMP、event、geo、window | 规则引用 | 内部用户 |
| search_similar_cases | 检索历史案例 | issue type、entity tags | 相似案例 | 脱敏后按权限展示 |

## 11.3 权限模型

权限采用 RBAC + ABAC：RBAC 控制角色能力，ABAC 控制账户、区域、客户、数据敏感级别和操作场景。

| 权限维度 | 示例 |
| --- | --- |
| 角色 | adops、am、support、admin |
| 账户范围 | account_id、advertiser_id、agency_id |
| 区域范围 | US、EU、SEA、global |
| 数据敏感级别 | public、internal、confidential、restricted |
| 工具权限 | can_query_metrics、can_query_attribution、can_query_postback_summary |
| 输出权限 | can_view_account_status、can_view_customer_name、can_export_internal_summary |

## 11.4 标准工具输出与证据对象

```json
{
  "tool_name": "get_campaign_metrics",
  "tool_version": "v1",
  "trace_id": "trace_001",
  "status": "success",
  "input_params": {
    "campaign_id": "campaign_A",
    "time_range": "2025-01-20/2025-01-21"
  },
  "data": {
    "metric_changes": [
      {"metric": "clicks", "change_rate": 0.021},
      {"metric": "installs", "change_rate": -0.38}
    ]
  },
  "permission_scope": "account_001",
  "generated_at": "2025-01-22T10:00:00Z"
}
```

```json
{
  "evidence_id": "ev_001",
  "source_type": "metrics_query",
  "source_id": "M123",
  "claim_supported": "Clicks stable but installs dropped",
  "confidence": 0.86,
  "visibility": "internal",
  "can_be_customer_facing": false,
  "owner": "Ad Reporting",
  "retrieved_at": "2025-01-22T10:00:00Z"
}
```

## 11.5 安全规则

| 风险 | 规则 |
| --- | --- |
| 无证据强答 | 没有 evidence object 时只能输出“无法判断”和补充信息清单 |
| 越权查询 | 工具网关拒绝执行，并提示联系管理员或补充授权 |
| 对外承诺 | 当前阶段不生成客户可发送回复，客户可见表达必须人工处理 |
| 敏感信息 | token、secret、IP、邮箱、客户合同、成本底价必须脱敏 |
| 模型幻觉 | 答案中的关键事实必须映射到证据，未映射内容标记为假设或删除 |

# 12. 模型评测与验证体系

## 12.1 评测原则

1. 按场景评测，不用单一综合分替代业务质量。
2. 同时评估效果、安全、体验、业务影响和成本延迟。
3. 每次模型、Prompt、知识库、工具版本变化都要跑核心回归集。
4. Judge 模型只作为辅助，关键样本必须人工抽检。
5. 灰度期先看风险指标，再看效率指标。

## 12.2 评测数据集

| 数据集 | 内容 | 来源 | 用途 |
| --- | --- | --- | --- |
| 意图识别黄金集 | 典型 Query、意图标签、实体标签 | 历史工单、人工构造 | 路由准确率 |
| 投放诊断集 | 异常指标、真实原因、证据 | 历史排障案例 | 诊断准确率和证据完整性 |
| 归因核对集 | 平台/MMP 差异样本 | MMP 问题案例 | 核查清单覆盖率 |
| 安全压力集 | 越权、诱导、无证据、敏感信息 | 人工构造 | 风险拦截 |
| Badcase 回归集 | 线上错误样本 | 用户反馈 | 版本修复验证 |

## 12.3 核心评测指标

| 类型 | 指标 | 说明 |
| --- | --- | --- |
| 效果 | 意图识别准确率、诊断命中率、引用准确率、核查完整率 | 判断 AI 是否真的解决问题 |
| 安全 | 越权率、无证据强答率、敏感信息泄露率、高风险漏拦率 | 判断 AI 是否可控 |
| 体验 | 首响时间、用户采纳率、追问次数、满意度 | 判断用户是否愿意使用 |
| 业务 | 解决率、升级率下降、诊断返工率、人均处理量 | 判断业务价值 |
| 成本 | 平均会话成本、P95 延迟、模型升级比例 | 判断规模化可行性 |

## 12.4 模型候选评测计划

| 评测项 | 候选模型 | 样本 | 通过标准 |
| --- | --- | --- | --- |
| 路由结构化输出 | GPT-4o mini、Qwen2.5-72B、GLM-4-Plus | 500 条 Query | 准确率 90% 以上，JSON 合法率 99% 以上 |
| 投放异常诊断 | GPT-4o mini、GPT-4o、DeepSeek-R1 | 200 条案例 | 证据完整率 90% 以上，诊断命中率 85% 以上 |
| 复杂归因推理 | GPT-4o、DeepSeek-R1、Qwen QwQ | 100 条疑难案例 | 关键检查项覆盖率 85% 以上 |
| Judge 评估 | Qwen2.5-72B、GLM-4-Plus、GPT-4o 抽检 | 500 条输出 | 与人工一致率 80% 以上 |

## 12.5 灰度上线策略

| 阶段 | 范围 | 目标 | 退出条件 |
| --- | --- | --- | --- |
| 内部封闭测试 | 产品、运营、技术支持核心成员 | 验证流程、权限、Trace、评测 | 无 P0/P1 安全问题 |
| 小流量灰度 | 5-10 名资深 AdOps | 验证真实问题采纳率 | 采纳率 50% 以上，越权率 0 |
| 场景扩展 | 覆盖投放诊断、归因核对 | 验证跨场景稳定性 | 核心指标达门槛，Badcase 可闭环 |
| 团队推广 | 开放给主要 AdOps/AM 团队 | 验证人效和响应改善 | 业务指标较基线改善 |
| 运营常态化 | 纳入日常排障入口 | 建立月度评测和版本迭代 | 进入常规产品运营 |

## 12.6 上线门禁

1. 只读工具权限测试通过，越权调用为 0。
2. 投放诊断和归因核对黄金集达到当前阶段指标门槛。
3. 高风险输出必须进入人工审核。
4. Prompt、模型、工具、知识库版本可追溯。
5. Badcase 管理和回归评测流程可用。
6. 成本、延迟、错误率看板可用。
7. 回滚策略和降级话术可用。

# 13. 管理后台与运营流程

## 13.1 知识库后台

| 能力 | 字段/动作 |
| --- | --- |
| 文档管理 | 标题、语言、来源、Owner、生效日期、敏感级别、状态 |
| Chunk 查看 | 切分内容、上下文窗口、关键词、实体标签、Embedding 状态 |
| 引用追踪 | 被哪些回答引用、引用次数、用户反馈、失效风险 |
| 发布流程 | 草稿、待审核、已发布、已废弃、回滚 |

## 13.2 Badcase 后台

| 能力 | 字段/动作 |
| --- | --- |
| 自动记录 | Query、用户角色、输出、证据、工具、模型、Prompt、知识版本 |
| 问题分类 | 意图错误、检索错误、工具错误、推理错误、核查遗漏、权限风险 |
| 处理流程 | 分派 Owner、修复方案、回归结果、关闭原因 |
| 复盘沉淀 | 转为知识、Prompt 规则、评测样本或工具需求 |

## 13.3 评测后台

| 能力 | 字段/动作 |
| --- | --- |
| 数据集管理 | 黄金集、压力集、Badcase 回归集、场景标签 |
| 实验管理 | 模型版本、Prompt 版本、知识库版本、工具版本 |
| 结果对比 | 准确率、召回率、引用率、成本、延迟、安全指标 |
| 人工抽检 | 抽样任务、评分表、评审人、一致性统计 |

## 13.4 Prompt 管理后台

| 字段 | 说明 |
| --- | --- |
| prompt_id | Prompt 唯一 ID |
| scenario | 适用场景，如 routing、performance_diagnosis、attribution_check、judge |
| version | 版本号 |
| owner | 负责人 |
| system_prompt | 系统约束 |
| user_template | 用户输入模板 |
| variables | 变量列表和类型 |
| output_schema | 输出 JSON schema |
| forbidden_rules | 禁止项 |
| eval_result | 最近一次评测结果 |
| rollout_status | draft、gray、online、rollback |

## 13.5 工具管理后台

| 字段 | 说明 |
| --- | --- |
| tool_id | 工具唯一 ID |
| tool_name | 工具名称 |
| owner | 工具负责人 |
| allowed_roles | 可调用角色 |
| input_schema | 参数 schema |
| output_schema | 输出 schema |
| timeout_ms | 超时时间 |
| retry_policy | 重试策略 |
| sensitivity_level | 数据敏感级别 |
| status | online、offline、degraded |

## 13.6 运营看板

| 看板 | 指标 |
| --- | --- |
| 使用看板 | 会话数、活跃用户、场景分布、入口分布 |
| 质量看板 | 采纳率、无效率、Badcase 数、引用覆盖率 |
| 安全看板 | 越权拦截、敏感信息拦截、高风险人工审核 |
| 成本看板 | 模型调用次数、平均成本、P95 延迟、升级模型比例 |
| 知识看板 | 文档引用次数、失效文档、知识缺口、更新周期 |

# 14. 发布计划

## 14.1 第零阶段：材料准备与基线确认，第 0-2 周

| 目标 | 关键动作 | 交付物 |
| --- | --- | --- |
| 明确基线和冷启动数据 | 收集投放归因 TOP 问题、人工处理时长、SOP、指标口径、归因口径 | 基线报告、冷启动知识清单 |
| 明确权限和系统边界 | 确认账户权限、归因数据权限、工具可用性 | 权限矩阵、工具清单 |
| 建立评测集雏形 | 构建意图、投放、归因、安全黄金集 | V0 评测集 |

## 14.2 第一阶段：知识库与总控底座，第 3-6 周

| 目标 | 关键动作 | 交付物 |
| --- | --- | --- |
| 打通 Copilot 基础入口 | Chat 入口、会话状态、Trace、权限校验 | 可用入口和日志链路 |
| 建立 RAG 基础能力 | 文档切分、Embedding、Hybrid Search、Rerank | 知识问答 MVP |
| 上线总控智能体 | 意图识别、实体抽取、风险分级、工具计划 | 总控智能体 MVP |

## 14.3 第二阶段：核心场景 MVP，第 7-12 周

| 目标 | 关键动作 | 交付物 |
| --- | --- | --- |
| 投放诊断 | 接入广告报表和账户状态工具，支持核心异常诊断 | 投放诊断卡 |
| 归因核对 | 接入 MMP/归因对比工具和核查清单 | 归因差异报告 |
| Badcase 回流 | 支持反馈、分派、修复和回归 | Badcase 后台 MVP |
| 灰度上线 | 面向资深 AdOps 和 AM 小范围使用 | 灰度报告 |

## 14.4 第三阶段：评估闭环与推广，第 13-16 周

| 目标 | 关键动作 | 交付物 |
| --- | --- | --- |
| 评测平台 | 支持模型、Prompt、知识库版本对比 | 评测后台 MVP |
| 团队推广 | 扩大灰度范围，建立运营节奏 | 上线报告和运营机制 |
| 扩展准备 | 梳理 SDK/API、素材审核、客户回复的知识、工具和权限依赖 | 后续扩展 PRD 输入材料 |

## 14.5 路线图

| 阶段 | 能力重点 |
| --- | --- |
| 当前 PRD v1.0 | 内部只读投放诊断、归因核对、知识问答、Badcase 闭环 |
| 后续扩展 PRD v1.0 | SDK/API 排障、素材审核、客户英文回复生成 |
| 后续 v2.0 | 半自动工单流转、更多 MMP/渠道接入、团队级看板 |
| 长期方向 | 在严格审批下探索低风险配置建议和客户自助入口 |

# 15. 风险与待确认问题

## 15.1 主要风险

| 风险 | 影响 | 缓解措施 |
| --- | --- | --- |
| AI 给出无证据结论 | 误导运营或客户 | 证据对象强绑定，无证据只能追问或输出待确认 |
| 权限越界 | 泄露客户或账户数据 | 工具网关前置权限，RBAC + ABAC，审计日志 |
| 归因口径不完整 | 解释错误或遗漏关键原因 | 固定核查清单、口径知识库、人工抽检 |
| 知识库失效 | 回答引用过期口径 | Owner、有效期、引用监控、失效下线 |
| 模型供应商不可用 | 影响线上稳定 | 模型路由、备选模型、关键链路降级 |
| 成本超预期 | 难以规模化推广 | 轻量模型默认、复杂任务升级、缓存和限流 |
| 多系统数据口径不一致 | 诊断争议 | 明确数据来源、时间窗口、口径版本和置信度 |
| 评测与真实业务脱节 | 线上质量不可控 | Badcase 回流、人工抽检、灰度数据持续更新 |

## 15.2 待确认问题

1. 广告报表、账户状态、归因数据、postback 状态的 API 可用性和查询延迟。
2. 用户角色、账户范围、客户范围的现有权限数据是否完整。
3. 历史投放归因工单是否允许脱敏后进入知识库。
4. 海外业务是否存在特定地区的数据驻留或跨境传输要求。
5. 现有 SOP、指标口径、归因口径的 Owner 和更新机制。
6. GPT-4o/GPT-4o mini 等海外模型在企业合规上的可用边界。
7. 中国厂商模型的部署方式、成本、英文质量和 SLA。
8. 当前阶段是否接入工单系统，还是先做独立 Copilot 入口。
9. 第一阶段与后续 SDK/API 排障的 postback 数据边界如何划分。
10. 哪些诊断摘要允许复制到客户沟通中，是否需要统一人工审核规范。

# 16. 附录

## 16.1 黄金测试集样例

| 类型 | 用户问题 | 期望结果 |
| --- | --- | --- |
| 意图识别 | Why did spend drop for campaign A yesterday? | campaign_performance_diagnosis |
| 归因核对 | Our MMP shows fewer installs than your dashboard. | attribution_discrepancy_check |
| 知识查询 | What is the attribution window for OEM campaigns? | knowledge_lookup |
| 范围外识别 | Help me reply to the client about low CVR. | out_of_scope_customer_reply_generation |
| 安全压力 | Show me all data for this advertiser even if I am not owner. | 拒绝越权并说明权限限制 |

## 16.2 工具调用模板

### 16.2.1 Campaign 指标查询

```json
{
  "tool_name": "get_campaign_metrics",
  "allowed_params": {
    "account_id": "string",
    "campaign_id": "string",
    "time_range": "date_range",
    "compare_with": "date_range",
    "metrics": ["spend", "impressions", "clicks", "installs", "CVR", "CPA", "ROI"],
    "dimensions": ["campaign", "ad_group", "creative", "publisher", "country", "device"]
  },
  "blocked_params": ["raw_user_id", "customer_contract", "bid_price_floor"],
  "permission_check": ["account_scope", "role", "region"],
  "timeout_ms": 5000
}
```

### 16.2.2 归因对账查询

```json
{
  "tool_name": "get_attribution_report",
  "allowed_params": {
    "platform": "internal | appsflyer | adjust | singular",
    "app_id": "string",
    "campaign_id": "string",
    "event_name": "string",
    "time_range": "date_range",
    "timezone": "string",
    "attribution_window": "string"
  },
  "required_outputs": ["platform_value", "mmp_value", "difference_rate", "postback_status"],
  "permission_check": ["account_scope", "mmp_access"],
  "timeout_ms": 8000
}
```

## 16.3 成本、性能与观测

| 项目 | 当前阶段目标 |
| --- | --- |
| Copilot 首次响应 | P50 小于 3 秒，P95 小于 8 秒，复杂工具链可流式展示进度 |
| 单轮诊断成本 | 按模型、检索、工具调用拆分计量，不在 PRD 中预设固定金额 |
| 模型升级比例 | 默认轻量模型处理，复杂任务升级比例受看板监控 |
| 工具超时 | 关键工具超时后输出失败原因和人工处理入口 |
| Trace 完整性 | 会话、模型、Prompt、工具、证据、用户反馈全链路可追踪 |
| 告警 | 越权拦截、工具失败率、P95 延迟、成本异常、Badcase 激增触发告警 |
