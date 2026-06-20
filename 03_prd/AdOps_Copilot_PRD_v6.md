# AdOps Copilot 产品需求文档 v6.0

| 项目 | 内容 |
| --- | --- |
| 产品名称 | AdOps Copilot |
| 文档版本 | v6.0 Draft |
| 更新时间 | 2026-06-20 |
| 选型时间假设 | 2025 年初可稳定商用或可进入生产评估的模型与技术 |
| 面向业务 | 海外移动互联网广告业务，覆盖 App、Web、OEM、On-Device 广告场景 |
| 系统语言 | 系统界面以英文为主，内部协作与知识运营支持中文，外部客户沟通以英文为主 |
| 核心用户 | 广告投放运营、客户成功、技术支持、广告平台产品/运营、管理者 |
| 文档目的 | 定义 AdOps Copilot V1.0 的业务目标、功能范围、AI 能力、数据依赖、技术选型、评测上线与运营机制 |

# 目录

1. 项目摘要
2. 整体项目规划
3. 用户、场景与范围
4. 目标、指标与价值测算
5. 整体业务流程与系统架构
6. 数据依赖与数据资产战略
7. 独立需求 PRD
8. 用户体验与关键页面
9. 模型选型与技术方案
10. 工具、权限、安全与合规
11. 评测、灰度与上线
12. 管理后台与运营流程
13. 发布计划
14. 风险与待确认问题
15. 附录


# 1. 项目摘要

AdOps Copilot 是面向海外广告业务的 AI 智能排障助手，目标是把广告投放运营中高频、复杂、跨系统的问题处理过程，从“靠资深同事经验搜索和人工串联”升级为“有证据、有流程、有权限、有评估闭环的 AI 辅助诊断”。

V1.0 不定位为开放式聊天机器人，也不定位为自动优化广告投放的黑盒系统，而是面向 AdOps 工作流的可控 AI Copilot：它能够识别用户意图，检索内部知识和外部文档，调用授权数据工具，生成诊断结论、处理建议和英文客户回复，并把 Badcase 回流到知识库、Prompt 和评测集中。

# 2. 整体项目规划

## 2.1 产品定位

| 维度 | 定位 |
| --- | --- |
| 产品类型 | 内部 AdOps AI Copilot，服务广告投放、客户支持和排障协作 |
| 核心价值 | 降低排障检索成本，提升诊断一致性，缩短客户响应时间，沉淀专家经验 |
| AI 形态 | RAG + 规则引擎 + 工具调用 + 多智能体工作流 + 人工审核 |
| 主要产出 | 诊断报告、证据引用、下一步建议、客户英文回复、Badcase 记录 |
| 不做什么 | 不直接替代广告优化师做预算和出价决策，不绕过人工审核对外发送客户回复，不对无证据问题强行给结论 |

## 2.2 产品愿景

AdOps Copilot 要成为广告运营团队的第一入口。用户遇到投放异常、归因差异、素材审核、SDK/API 报错或客户追问时，不需要先判断应该查哪个系统、问哪个团队、翻哪份文档，而是先把问题交给 Copilot，由系统完成意图识别、资料检索、数据核对、诊断推理和回复草稿生成。

产品长期目标可以概括为五句话：

1. 查得准：答案必须有可追溯来源，不能只给泛泛解释。
2. 拆得清：复杂问题要拆成指标、链路、时间窗口、渠道、归因口径等可核查维度。
3. 诊得稳：常见问题用结构化工作流和规则兜底，高风险结论不交给模型自由发挥。
4. 写得好：对外英文回复要清晰、专业、可发送，但必须保留人工确认。
5. 控得住：所有工具调用、权限、证据、模型版本、Prompt 版本都可审计、可回滚、可评估。

## 2.3 核心用户旅程

```text
用户提出问题
  -> Copilot 识别意图、语言、风险等级和所需数据
  -> 系统确认权限与上下文
  -> 检索知识库与历史案例
  -> 按需调用报表、归因、日志、审核等工具
  -> 汇总证据并生成诊断结论
  -> 给出下一步建议和可复制英文回复
  -> 用户反馈是否有效
  -> Badcase 回流到知识库、评测集和 Prompt 管理
```

## 2.4 核心功能地图

| 模块 | 解决的问题 | V1.0 产出 | 依赖能力 |
| --- | --- | --- | --- |
| 总控智能体 | 用户问题入口不统一，意图和风险难判断 | 意图分类、任务拆解、工具计划、权限判断 | LLM、路由规则、权限系统 |
| RAG 知识检索 | SOP、归因口径、SDK 文档分散 | 带引用答案、相关文档、历史案例 | Embedding、重排序、文档治理 |
| 投放效果诊断 | 消耗、展示、点击、转化异常原因难定位 | 指标拆解、异常判断、原因假设、排查建议 | 报表工具、规则引擎、LLM 总结 |
| 归因核对 | 平台与 MMP/客户后台数据不一致 | 差异定位、口径说明、核查清单 | 归因数据、MMP 口径、时区规则 |
| 素材审核辅助 | 素材违规、落地页异常、品牌风险核查成本高 | 风险标签、证据截图、审核建议 | 视觉模型、OCR、审核规则 |
| SDK/API 排障 | 集成报错、回调失败、日志排查依赖技术同学 | 错误码解释、链路定位、修复建议 | 日志检索、SDK 文档、API 文档 |
| 客户回复生成 | 对外英文回复不稳定，容易缺证据或过度承诺 | 英文回复草稿、风险提醒、证据摘要 | LLM、语气规范、审核规则 |
| Badcase 与知识运营 | AI 错误难复盘，知识无法持续进化 | Badcase 工单、修复状态、评测样本 | 人工标注、版本管理、评测平台 |
| 管理后台 | Prompt、工具、知识库、灰度缺少统一管理 | 配置、灰度、审计、看板 | 权限、日志、实验平台 |

# 3. 用户、场景与范围

## 3.1 目标用户

| 用户角色 | 典型工作 | 主要痛点 | Copilot 价值 |
| --- | --- | --- | --- |
| 广告投放运营 | 查看账户表现、处理异常、协调客户问题 | 数据源多、问题杂、依赖经验 | 快速定位异常维度，生成排查路径 |
| 客户成功/AM | 响应客户问题，解释投放结果和数据差异 | 需要快速给出专业英文回复 | 生成有证据的英文说明，减少反复沟通 |
| 技术支持 | 排查 SDK、API、回调、日志问题 | 问题上下文不完整，重复查询多 | 自动整理日志证据和可能原因 |
| 审核/合规运营 | 判断素材、落地页、品牌和政策风险 | 审核规则复杂，人工一致性不足 | 辅助识别风险并保留人工裁决 |
| 管理者 | 关注处理效率、风险、知识沉淀 | 难量化 AI 带来的效率与质量 | 看板化追踪解决率、采纳率、风险率 |

## 3.2 核心场景

| 场景 | 示例问题 | 期望输出 |
| --- | --- | --- |
| 投放效果异常 | Why did spend drop sharply yesterday for campaign A? | 异常指标、可能原因、证据、下一步动作 |
| 归因差异 | MMP shows 30% fewer installs than our dashboard. Why? | 口径差异、时区窗口、回调链路、排查清单 |
| 客户回复 | Please help me reply to the client about low CVR. | 专业英文回复草稿和内部备注 |
| 素材审核 | Is this landing page risky for finance ads? | 风险标签、证据位置、审核建议 |
| SDK/API 排障 | Postback failed with error code xxx. | 错误码解释、影响范围、修复步骤 |
| 知识查询 | What is the attribution window for OEM campaigns? | 带引用的口径说明 |

## 3.3 V1.0 范围

| 范围 | 说明 |
| --- | --- |
| 内部员工使用 | 面向广告投放、客户成功、技术支持、审核和管理角色 |
| 英文系统界面 | 用户主要在英文后台中使用，中文内部知识可被检索和总结 |
| 只读数据工具 | V1.0 仅查询与诊断，不直接修改广告账户、预算、出价或客户配置 |
| 证据型回答 | 所有业务结论必须引用知识、数据、日志或规则依据 |
| 人工确认 | 高风险建议、对外回复、客户承诺必须人工确认 |
| 可评估上线 | 每个核心智能体必须具备黄金集、Badcase、灰度和回滚机制 |

## 3.4 V1.0 范围外

| 范围外事项 | 原因 |
| --- | --- |
| 自动调整预算/出价 | 涉及直接商业损失风险，需要更高等级风控和审批 |
| 自动发送客户邮件 | 涉及外部承诺和合规风险，V1.0 只生成草稿 |
| 完全替代人工审核 | 视觉模型和政策判断仍需人工裁决 |
| 训练自有基础大模型 | V1.0 优先使用商用模型和可控工作流，暂不投入基础模型训练 |
| 对客户开放独立入口 | 先在内部验证质量、权限和合规，再考虑外部化 |

# 4. 目标、指标与价值测算

## 4.1 产品目标

1. 让一线团队能在一个入口完成常见广告排障问题的初步诊断。
2. 让每个诊断结论都具备证据、引用、置信度和人工确认状态。
3. 让英文客户回复更稳定、更专业，同时避免无证据承诺。
4. 让专家经验通过 Badcase、知识库和评测集持续沉淀。
5. 让 AI 系统上线后可量化、可审计、可回滚。

## 4.2 业务目标

| 指标 | 目标口径 | V1.0 目标 |
| --- | --- | --- |
| 首次响应时间 | 从用户提交问题到 Copilot 给出首版诊断 | 较人工基线下降 30% 以上 |
| 常见问题解决率 | 无需转交其他团队即可形成可执行建议的会话占比 | 达到 50% 以上 |
| 人工采纳率 | 用户对诊断建议或回复草稿点击采纳/复制的比例 | 达到 60% 以上 |
| 升级工单质量 | 转交技术/产品团队时上下文完整度 | 达到 80% 以上 |
| 知识复用率 | 回答中引用内部知识或历史案例的比例 | 达到 70% 以上 |
| Badcase 修复周期 | 从标记 Badcase 到纳入修复版本 | 核心场景小于 7 个工作日 |

## 4.3 AI 质量目标

| 指标 | 说明 | V1.0 门槛 |
| --- | --- | --- |
| 意图识别准确率 | 正确识别用户问题类型和所需工具 | 90% 以上 |
| 引用覆盖率 | 回答包含可追溯证据的比例 | 90% 以上 |
| 归因核对完整率 | 覆盖时区、窗口、去重、回调、口径等关键项 | 85% 以上 |
| 无证据强答率 | 无证据时仍给确定结论的比例 | 5% 以下 |
| 越权工具调用率 | 调用用户无权访问的数据工具 | 0 |
| 高风险自动执行率 | 未经人工确认执行高风险动作 | 0 |
| 中英混合理解准确率 | 中文、英文、中英混合 Query 的意图识别准确率 | 90% 以上 |
| 英文回复可发送率 | 经过人工轻微编辑即可发送的回复草稿比例 | 70% 以上 |

## 4.4 北极星指标

北极星指标为“AI 辅助解决的广告排障会话数”。

该指标必须同时满足三个条件：用户发起真实业务问题，Copilot 给出带证据的诊断或回复草稿，用户确认有效、采纳或完成后续动作。单纯聊天次数、模型调用次数、页面访问次数不作为核心成功指标。

## 4.5 价值测算模型

| 价值项 | 计算方式 | 数据来源 |
| --- | --- | --- |
| 人效节省 | 月排障会话数 × 平均节省分钟数 × 人力成本 | Copilot 日志、人工基线调研 |
| 响应改善 | 人工首次响应时间 - AI 首次响应时间 | 工单系统、Copilot Trace |
| 升级减少 | 原升级率 - AI 辅助后升级率 | 工单状态、团队流转记录 |
| 回复质量提升 | 英文回复采纳率、返工率、客户追问率 | 回复审核、客户沟通记录 |
| 知识资产沉淀 | 新增有效知识条数、Badcase 关闭数、复用次数 | 知识库后台、评测平台 |

ROI 计算不在 PRD 中预设真实业务结果。上线前需要先采集 2-4 周人工基线，再用灰度数据计算节省时间、采纳率和质量提升。

# 5. 整体业务流程与系统架构

## 5.1 端到端业务流程

```text
问题输入
  -> 会话创建
  -> 用户身份、角色、账户权限校验
  -> 语言识别与意图识别
  -> 风险分级
  -> 任务拆解
  -> 知识检索
  -> 工具调用计划生成
  -> 工具网关执行只读查询
  -> 证据对象归一化
  -> 诊断推理与结论生成
  -> 回复草稿生成
  -> 置信度与安全检查
  -> 人工确认或转交
  -> 用户反馈
  -> Badcase/知识库/评测集回流
```

## 5.2 系统架构

```text
[英文业务前台]
  - Copilot Chat
  - 诊断结果卡
  - 证据引用卡
  - 英文回复草稿
  - 人工审核与反馈

[AI 工作流中台]
  - 总控智能体
  - 场景智能体
  - Prompt 管理
  - 模型路由
  - 工具调用计划
  - 安全审查
  - Trace 日志

[数据与知识层]
  - 广告报表数据
  - MMP/归因数据
  - SDK/API 日志
  - SOP/政策/FAQ
  - 外部平台文档
  - 历史工单与客户回复
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

| 状态 | 说明 | 下一状态 |
| --- | --- | --- |
| 已接收 | 创建会话，记录用户、语言、入口和上下文 | 意图识别中 |
| 意图识别中 | 判断问题类型、风险等级、所需工具和补充信息 | 检索中 / 待用户补充 |
| 检索中 | 查询知识库、历史案例、外部文档 | 工具规划中 |
| 工具规划中 | 生成只读工具调用计划并做权限检查 | 工具执行中 / 权限拒绝 |
| 工具执行中 | 调用报表、归因、日志、审核等工具 | 证据汇总中 |
| 证据汇总中 | 对工具输出和知识引用归一化 | 诊断生成中 |
| 诊断生成中 | 生成结论、置信度、建议和风险提示 | 安全检查中 |
| 安全检查中 | 检查无证据强答、越权、客户承诺、高风险动作 | 可交付 / 人工审核 |
| 可交付 | 展示诊断结果和回复草稿 | 已反馈 / 已转交 |
| 人工审核 | 需要人工确认或补充判断 | 可交付 / 已转交 |
| 已反馈 | 用户确认有效、无效、部分有效 | Badcase 回流 / 完成 |

## 5.4 产品原则

| 原则 | 产品要求 |
| --- | --- |
| 证据优先 | 没有知识、数据或日志依据时，必须说明无法判断，并给出补充信息清单 |
| 人工可控 | 对外回复、高风险判断、客户承诺和账户操作必须保留人工确认 |
| 权限最小化 | 用户只能查询其角色和账户范围内的数据，模型不直接绕过权限系统 |
| 场景化工作流 | 常见 AdOps 问题使用固定检查清单和工具链，不依赖开放式自由推理 |
| 可评估可回滚 | 模型、Prompt、工具、知识库版本都要纳入 Trace 和灰度管理 |

# 6. 数据依赖与数据资产战略

## 6.1 关键数据依赖

| 数据类型 | 示例 | 用途 | 风险控制 |
| --- | --- | --- | --- |
| 广告报表数据 | spend、impression、click、install、CVR、CPA、ROI | 投放异常诊断 | 只读查询、账户权限过滤、聚合展示 |
| MMP/归因数据 | AppsFlyer、Adjust、Singular 口径数据 | 归因差异核对 | 脱敏、窗口限制、引用口径 |
| SDK/API 日志 | 请求日志、错误码、回调状态、postback | 技术排障 | 日志脱敏、敏感字段屏蔽 |
| 内部 SOP | 投放排查流程、审核规则、客户回复规范 | RAG 回答和流程约束 | 版本管理、人工审核 |
| 外部文档 | 平台政策、MMP 文档、SDK 文档 | 补充公开口径 | 标注来源、更新时间 |
| 历史工单 | 问题描述、处理过程、解决方案 | 案例召回与经验复用 | 客户信息脱敏、可见范围控制 |
| 客户回复 | 历史英文邮件、IM 回复 | 语气与结构学习 | 去除客户私密信息，禁止直接复用敏感内容 |
| 用户反馈 | 采纳、无效、原因、编辑后版本 | Badcase 和评测集迭代 | 记录操作者和版本 |

## 6.2 数据资产分层

```text
L1 原始数据层
  广告报表、归因数据、日志、SOP、文档、工单、回复记录

L2 标准化数据层
  统一字段、统一时间窗口、统一账户实体、统一错误码、统一文档元数据

L3 AI 可用数据层
  Chunk、Embedding、标签、实体、问答对、工具输出 schema、黄金测试集

L4 业务资产层
  可复用诊断模板、客户回复模板、Badcase 集、知识图谱、指标口径库
```

## 6.3 知识库分层

| 层级 | 内容 | 示例 | 更新机制 |
| --- | --- | --- | --- |
| KB-1 业务口径 | 广告指标定义、归因窗口、账户层级 | CVR、CPA、install、postback | 产品/运营审核后发布 |
| KB-2 排障 SOP | 常见异常处理流程 | 消耗骤降、转化异常、MMP 差异 | Badcase 驱动更新 |
| KB-3 技术文档 | SDK、API、错误码、日志字段 | postback error、SDK init failed | 技术支持维护 |
| KB-4 审核政策 | 素材、落地页、行业限制 | finance、gaming、adult、brand safety | 审核团队维护 |
| KB-5 客户沟通 | 英文回复规范、语气、免责声明 | delay、data discrepancy、policy reason | CS/AM 维护 |
| KB-6 历史案例 | 已解决工单和客户问题 | 某类回调失败案例 | 自动脱敏后人工入库 |
| KB-7 外部文档 | 平台、MMP、政策公开文档 | AppsFlyer/Adjust 文档 | 定期抓取和人工确认 |

## 6.4 双语元数据规范

| 字段 | 说明 |
| --- | --- |
| language | 文档主语言，取值 zh、en、mixed |
| business_locale | 业务适用区域，例如 global、US、SEA、EU |
| audience | internal、external、technical、customer-facing |
| source_type | SOP、policy、API doc、ticket、reply、metric definition |
| entity_tags | campaign、ad group、creative、publisher、MMP、SDK、API |
| sensitivity_level | public、internal、confidential、restricted |
| effective_date | 口径或政策生效时间 |
| owner | 文档负责人 |
| reviewed_status | draft、reviewed、deprecated |

## 6.5 数据资产运营阶段

| 阶段 | 目标 | 关键动作 |
| --- | --- | --- |
| 冷启动 | 支撑核心场景可用 | 整理 TOP 问题、SOP、口径文档、错误码、回复模板 |
| 灰度期 | 修复高频错误 | 收集 Badcase，更新 Chunk、标签、Prompt 和评测集 |
| 稳定期 | 提升复用和覆盖 | 建立知识 Owner、月度复审、失效文档清理 |
| 扩展期 | 沉淀壁垒 | 形成行业问题图谱、诊断模板库、客户回复风格库 |

# 7. 独立需求 PRD

## 7.1 需求 0：总控智能体与权限路由

### 7.1.1 背景

AdOps 问题入口复杂，同一句用户问题可能同时涉及知识查询、报表分析、归因核对、日志排查和客户回复。如果直接交给大模型自由回答，容易出现意图误判、越权查询、遗漏关键检查项或无证据结论。总控智能体负责统一入口、任务拆解、工具计划、安全控制和结果编排。

### 7.1.2 功能目标

1. 识别用户问题所属场景、语言、风险等级和是否需要补充信息。
2. 根据用户角色和账户范围生成可执行的只读工具调用计划。
3. 把复杂问题拆分给对应场景智能体，并汇总最终结果。
4. 对无证据、越权、高风险对外承诺进行拦截。

### 7.1.3 核心功能

| 功能 | 说明 |
| --- | --- |
| 意图识别 | 分类为知识查询、投放诊断、归因核对、素材审核、SDK/API 排障、客户回复等 |
| 语言识别 | 支持英文、中文、中英混合输入，输出语言按场景控制 |
| 风险分级 | 区分低风险查询、中风险诊断、高风险客户承诺或操作建议 |
| 信息完整度检查 | 判断是否缺少 campaign、account、time range、region、platform 等关键字段 |
| 工具计划 | 生成工具调用顺序、参数、权限要求和失败兜底 |
| 安全拦截 | 越权、无证据、高风险动作、客户敏感信息触发人工确认 |

### 7.1.4 工作流程

```text
用户输入
  -> 语言识别
  -> 意图分类
  -> 实体抽取
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
| 系统约束 | 你是广告排障总控，只能基于证据和授权工具输出结论 |
| 任务目标 | 识别意图、抽取实体、判断风险、生成工具计划 |
| 禁止项 | 禁止编造数据、禁止越权、禁止直接承诺客户赔偿或投放效果 |
| 输出格式 | 必须输出 JSON，字段缺失时给出 missing_fields |
| 语言规则 | 内部推理可中文，用户界面按系统英文输出；客户回复必须英文 |

### 7.1.7 技术选型

| 任务 | 首选 | 备选 | 选择理由 |
| --- | --- | --- | --- |
| 意图识别与路由 | OpenAI GPT-4o mini | Qwen2.5-72B-Instruct、GLM-4-Plus | 成本低、结构化输出稳定、英文理解强 |
| 复杂任务拆解 | OpenAI GPT-4o | DeepSeek-R1/DeepSeek-Reasoner、Qwen2.5-Max | 复杂多步推理时更稳，可通过模型路由控制成本 |
| 安全二次判断 | Qwen2.5-72B-Instruct | GLM-4-Plus、规则引擎 | 可做独立 Judge，降低单模型自评偏差 |

不考虑 Anthropic 模型，原因是企业主体和可用性限制，不进入 V1.0 候选。

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
4. 支持英文客户解释草稿的基础输入。

### 7.2.3 核心功能

| 功能 | 说明 |
| --- | --- |
| 异常指标识别 | 判断 spend、impression、click、install、CVR、CPA、ROI 哪个指标异常 |
| 时间窗口对比 | 支持 WoW、DoD、同小时对比、投放开始后累计对比 |
| 维度下钻 | account、campaign、ad group、creative、publisher、country、device |
| 原因归类 | 预算、出价、库存、素材、审核、追踪、归因、市场波动 |
| 证据卡 | 展示指标变化、数据来源、查询时间、相关规则和历史案例 |
| 下一步建议 | 给出可执行检查项和需要人工确认的问题 |

### 7.2.4 指标拆解

| 异常现象 | 优先检查 | 可能原因 |
| --- | --- | --- |
| Spend 下降 | 预算、余额、出价、库存、审核状态 | 预算耗尽、账户限额、竞价不足、素材被拒 |
| Impression 下降 | 流量来源、定向、频控、素材可用性 | 定向过窄、库存下降、素材暂停 |
| Click 下降 | CTR、素材、展示位置 | 素材疲劳、位置质量变化 |
| Install 下降 | CVR、归因、落地页、SDK | 归因延迟、落地页异常、SDK 回传失败 |
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
    "next_actions": ["Check SDK postback status", "Verify landing page availability"],
    "customer_facing_summary": "We are seeing stable traffic volume but a decline in conversion rate..."
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
| - SDK postback SOP v2025.01                          |
|                                                     |
| Next actions                                         |
| [Check SDK logs] [Check landing page] [Draft reply]  |
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

广告平台、MMP、客户后台之间的数据不一致是海外广告业务高频问题。差异可能来自归因窗口、时区、去重、回调延迟、事件定义、SKAN/隐私限制、渠道口径差异等。人工解释若缺少结构化核查清单，容易漏项或对客户解释不一致。

### 7.3.2 功能目标

1. 结构化核对平台与 MMP/客户后台差异。
2. 输出差异比例、可能原因和必须确认的信息。
3. 自动生成对客户友好的英文解释草稿。
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
    "customer_explanation_draft": "The discrepancy is likely caused by..."
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
| 客户解释质量 | 人工审核可发送率 70% 以上 |
| 强结论控制 | 缺少 MMP 数据时不得输出确定原因 |
| 灰度范围 | 先覆盖 install discrepancy 和 event discrepancy |

## 7.4 需求 3：素材审核与合规排查

### 7.4.1 背景

海外广告素材和落地页涉及行业政策、品牌安全、文本合规、视觉元素和地区差异。人工审核需要查看图片、视频截图、落地页、文案和历史政策，成本高且一致性不足。V1.0 目标是做审核辅助，不替代人工最终裁决。

### 7.4.2 功能目标

1. 对素材图片、落地页截图、OCR 文案进行风险识别。
2. 输出风险标签、证据位置、相关规则和审核建议。
3. 对高风险行业和敏感承诺触发人工确认。
4. 将审核 Badcase 回流到规则库和评测集。

### 7.4.3 核心功能

| 功能 | 说明 |
| --- | --- |
| 图文理解 | 识别图片、落地页、OCR 文本中的风险信息 |
| 政策匹配 | 匹配金融、游戏、健康、成人、仿冒、夸大承诺等规则 |
| 风险分级 | low、medium、high、blocked |
| 证据标注 | 输出命中的文案、页面区域、截图位置和政策引用 |
| 人工审核 | 对 high/blocked 结果进入人工复核 |

### 7.4.4 输入输出结构

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

### 7.4.5 技术选型

| 能力 | 选型 | 备选 | 理由 |
| --- | --- | --- | --- |
| 多模态理解 | Qwen2.5-VL | GPT-4o、GLM-4V、ERNIE VL、Hunyuan-Vision | Qwen2.5-VL 对中文厂商可用性和图文理解较友好，GPT-4o 作为英文复杂素材备选 |
| OCR | PaddleOCR | Google Vision OCR、Tencent OCR | PaddleOCR 可本地化部署，适合成本和隐私控制 |
| 规则判断 | 规则引擎 + 政策知识库 | LLM Judge | 高风险合规不应完全依赖生成式模型 |

### 7.4.6 验收与灰度

| 项目 | 标准 |
| --- | --- |
| OCR 有效识别 | 核心文案识别准确率 95% 以上 |
| 高风险召回 | high/blocked 样本召回率 90% 以上 |
| 错误拦截 | 禁止自动给出最终通过结论 |
| 灰度范围 | 先支持静态图片和落地页截图，视频逐帧审核后续扩展 |

## 7.5 需求 4：SDK/API/日志技术排障

### 7.5.1 背景

SDK 初始化失败、API 请求失败、postback 异常、事件回传缺失等问题通常需要技术支持查询日志、理解错误码、比对文档和定位链路。很多问题本质是重复排查，但上下文分散，导致响应慢、升级多。

### 7.5.2 功能目标

1. 基于错误码、日志片段和账户上下文定位可能原因。
2. 检索 SDK/API 文档和历史案例，生成修复建议。
3. 输出可转交技术团队的结构化问题摘要。
4. 对包含敏感字段的日志做脱敏展示。

### 7.5.3 核心功能

| 功能 | 说明 |
| --- | --- |
| 错误码解释 | 根据错误码、接口名、SDK 版本召回文档说明 |
| 链路排查 | 检查请求、响应、postback、重试、拒收状态 |
| 日志摘要 | 从日志片段中抽取关键字段和异常模式 |
| 修复建议 | 输出集成侧、平台侧、MMP 侧需要检查的动作 |
| 升级摘要 | 生成给工程团队的结构化上下文 |

### 7.5.4 工作流程

```text
用户输入错误码或日志
  -> 脱敏与字段抽取
  -> 识别 SDK/API 场景
  -> 检索错误码文档和历史案例
  -> 查询授权日志工具
  -> 输出可能原因、证据和修复步骤
  -> 必要时生成技术升级摘要
```

### 7.5.5 输入输出结构

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

### 7.5.6 技术选型

| 能力 | 选型 | 理由 |
| --- | --- | --- |
| 日志字段抽取 | 规则解析 + GPT-4o mini | 固定字段用规则，非结构化异常用 LLM 摘要 |
| 技术文档检索 | Hybrid Search + Rerank | 错误码需要关键词精确召回，说明文档需要语义召回 |
| 复杂原因排序 | GPT-4o 或 DeepSeek-Reasoner | 多链路故障需要较强推理和步骤排序 |
| 脱敏 | 规则引擎 | app secret、token、email、IP 等敏感字段必须确定性屏蔽 |

### 7.5.7 验收与灰度

| 项目 | 标准 |
| --- | --- |
| 错误码召回 | TOP 错误码文档召回率 95% 以上 |
| 脱敏 | 敏感字段泄露率为 0 |
| 升级摘要 | 技术团队认为上下文完整率 80% 以上 |
| 灰度范围 | 先覆盖 postback、SDK init、API auth 三类问题 |

## 7.6 需求 5：客户英文回复生成与审核

### 7.6.1 背景

海外业务外部沟通以英文为主，但内部处理过程、知识库和排障讨论大量使用中文。客户回复既要专业、清晰、礼貌，又要避免过度承诺、泄露内部信息或输出无证据判断。回复生成必须建立在诊断证据之上，并经过人工确认。

### 7.6.2 功能目标

1. 根据诊断结论生成英文客户回复草稿。
2. 区分客户可见内容和内部备注。
3. 自动检查无证据承诺、敏感信息、语气和风险表达。
4. 支持用户编辑后回流，沉淀高质量回复模板。

### 7.6.3 核心功能

| 功能 | 说明 |
| --- | --- |
| 回复草稿 | 生成简洁、专业、客户可发送的英文回复 |
| 内外分离 | 内部原因、日志 ID、成本等敏感内容不进入外部回复 |
| 风险审核 | 检查 guarantee、compensation、blame、unverified claim 等风险表达 |
| 多版本语气 | 支持 formal、concise、technical、client-friendly |
| 编辑回流 | 保存人工最终发送版本，用于模板优化 |

### 7.6.4 Prompt 设计要点

| 层级 | 内容 |
| --- | --- |
| 输入事实 | 只允许使用诊断模块输出的 evidence 和 confirmed_facts |
| 回复结构 | acknowledgement、finding、next step、timeline、closing |
| 禁止项 | 不承诺赔偿、不暴露内部日志、不推卸责任、不编造 ETA |
| 语言风格 | 专业、简洁、非营销化，避免过度技术细节 |
| 输出要求 | 同时输出 external_reply、internal_note、risk_flags |

### 7.6.5 输入输出结构

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

### 7.6.6 页面草图

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

### 7.6.7 技术选型

| 能力 | 选型 | 理由 |
| --- | --- | --- |
| 英文回复生成 | GPT-4o | 英文表达自然，复杂客户沟通质量更稳定 |
| 低成本草稿 | GPT-4o mini | 简单回复和批量草稿成本可控 |
| 回复风险审核 | Qwen2.5-72B-Instruct + 规则引擎 | 用不同模型和规则交叉检查风险表达 |
| 双语改写 | GLM-4-Plus 或 Kimi-k1.5 备选 | 作为中文内部材料转英文表达的备选验证 |

### 7.6.8 验收与灰度

| 项目 | 标准 |
| --- | --- |
| 可发送率 | 人工轻微编辑即可发送比例 70% 以上 |
| 风险拦截 | 高风险表达漏检率低于 2% |
| 内外分离 | 内部敏感信息进入外部回复为 0 |
| 灰度范围 | 先支持诊断后回复草稿，不支持自动发送 |

## 7.7 需求 6：知识库治理与 Badcase 回流

### 7.7.1 背景

AI 产品上线后的核心竞争力不只来自模型，而来自持续沉淀的业务知识、真实 Badcase、评测样本和可复用工作流。如果缺少治理机制，知识库会很快失效，Prompt 迭代无法验证，模型切换也没有客观依据。

### 7.7.2 功能目标

1. 建立知识从创建、审核、发布、废弃到回滚的全生命周期。
2. 将用户反馈、错误回答、人工修正转化为 Badcase。
3. 把 Badcase 纳入评测集、Prompt 优化和知识库修订。
4. 支持模型、Prompt、工具和知识版本的对比实验。

### 7.7.3 核心功能

| 功能 | 说明 |
| --- | --- |
| 知识入库 | 支持 SOP、FAQ、政策、错误码、历史案例入库 |
| Chunk 管理 | 查看切分结果、标签、引用、Embedding 状态 |
| 审核发布 | draft、reviewed、published、deprecated 状态流转 |
| Badcase 标记 | 用户可标记错误、无帮助、证据不足、回复不可用 |
| 修复闭环 | 分派 Owner，记录修复版本和回归结果 |
| 评测集管理 | 将典型 Badcase 加入黄金集或压力集 |

### 7.7.4 Badcase 流程

```text
用户标记无效
  -> 选择原因：意图错 / 检索错 / 数据错 / 推理错 / 回复差 / 越权风险
  -> 自动保存问题、上下文、工具输出、模型版本、Prompt 版本
  -> 运营人员分派 Owner
  -> 修复知识、Prompt、规则或工具
  -> 回归评测通过
  -> 发布新版本并关闭 Badcase
```

### 7.7.5 验收与灰度

| 项目 | 标准 |
| --- | --- |
| Badcase 完整性 | 自动记录 Query、证据、模型、Prompt、工具版本 |
| 修复闭环 | 核心 Badcase 7 个工作日内完成处理 |
| 知识失效 | deprecated 文档不得被线上回答引用 |
| 灰度范围 | 与前三个核心诊断场景同步上线 |

# 8. 用户体验与关键页面

## 8.1 产品入口

| 入口 | 使用对象 | 典型触发 |
| --- | --- | --- |
| Copilot Chat | 全体内部用户 | 输入自然语言问题，获得诊断和回复草稿 |
| Campaign 页面侧边栏 | AdOps、AM | 查看某个 campaign 时直接发起排障 |
| 工单系统插件 | CS、技术支持 | 从客户问题一键生成诊断摘要 |
| 素材审核页面 | 审核运营 | 对图片、落地页、文案触发 AI 预审 |
| 管理后台 | 产品、运营、管理员 | 管理知识库、Prompt、工具、评测和灰度 |

## 8.2 诊断结果卡

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
| [Check logs] [Draft client reply] [Escalate]         |
+-----------------------------------------------------+
```

## 8.3 证据引用卡

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

## 8.4 人工审核台

```text
+-----------------------------------------------------+
| Review Queue                                         |
+-----------------------------------------------------+
| Type        Risk     Status          Owner           |
| Reply       High     Needs review    AM Team         |
| Creative    High     Needs review    Policy Team     |
| Diagnosis   Medium   Pending         AdOps Lead      |
+-----------------------------------------------------+
| Selected item                                        |
| - AI output                                          |
| - Evidence list                                      |
| - Risk flags                                         |
| - Prompt/model/tool versions                         |
|                                                     |
| [Approve] [Edit] [Reject] [Create Badcase]           |
+-----------------------------------------------------+
```

# 9. 模型选型与技术方案

## 9.1 选型前提

本 PRD 的模型选型基于 2025 年初的企业落地假设：

1. 海外客户沟通以英文为主，内部员工沟通和部分知识文档以中文为主，因此模型必须支持中英双语和中英混合 Query。
2. 系统处理广告业务数据、日志和客户沟通内容，必须优先考虑权限、审计、数据隔离和供应商可用性。
3. Anthropic 系列模型因企业主体和可用性原因暂不纳入候选。
4. 不同 Agent 的模型选型要和任务绑定：路由任务重视结构化输出，诊断任务重视证据推理，回复任务重视英文表达，审核任务重视安全召回，多模态任务重视图文理解。
5. V1.0 不追求单一模型统一解决所有问题，而采用模型路由和可替换架构。

## 9.2 技术组件总览

| 组件 | 首选方案 | 备选方案 | 选择理由 |
| --- | --- | --- | --- |
| 通用轻量 LLM | OpenAI GPT-4o mini | Qwen2.5-72B-Instruct、GLM-4-Plus | 成本可控，适合意图识别、摘要、低风险回复 |
| 高质量生成 LLM | OpenAI GPT-4o | Qwen2.5-Max、Kimi-k1.5、Gemini 1.5 Pro | 英文表达和复杂任务稳定，作为关键回复和复杂诊断模型 |
| 深度推理模型 | DeepSeek-R1/DeepSeek-Reasoner | OpenAI o3-mini、Qwen QwQ | 适合多步归因、复杂异常原因排序和疑难案例分析 |
| 多模态模型 | Qwen2.5-VL | GPT-4o、GLM-4V、ERNIE VL、Hunyuan-Vision | 素材和落地页图文理解，兼顾中国厂商可用性 |
| Embedding | OpenAI text-embedding-3-large | Alibaba text-embedding-v3、BAAI bge-m3 | 英文和混合语义效果稳定，备选可降低供应商风险 |
| Rerank | Cohere Rerank 3.5 | Alibaba gte-rerank、BAAI bge-reranker-v2-m3 | 提升长文档检索和引用准确率 |
| 关键词检索 | OpenSearch / Elasticsearch | PostgreSQL full-text search | 错误码、campaign ID、API 字段需要精确召回 |
| 向量库 | pgvector 或 Milvus | OpenSearch Vector | pgvector 适合早期简单部署，Milvus 适合后续规模化 |
| 工作流编排 | LangGraph 或自研状态机 | Temporal + 自研 Agent 编排 | 需要显式状态、失败重试、人工中断和审计 |
| 权限与工具网关 | 自研 Tool Gateway | API Gateway + RBAC/ABAC | 广告数据查询必须受权限和参数模板控制 |

## 9.3 候选模型对比

| 厂商/模型 | 适合任务 | 优势 | 风险与限制 | V1.0 结论 |
| --- | --- | --- | --- | --- |
| OpenAI GPT-4o | 英文回复、复杂总结、多模态备选 | 英文质量高，结构化能力较稳 | 成本和数据合规需评估 | 关键链路首选 |
| OpenAI GPT-4o mini | 路由、摘要、轻量生成 | 成本低、延迟较好 | 复杂推理能力有限 | 高频任务首选 |
| DeepSeek-R1/Reasoner | 复杂推理、疑难归因 | 推理成本优势明显，中文理解强 | 英文客户回复需人工评估 | 复杂诊断备选/增强 |
| Qwen2.5-72B-Instruct | 路由、Judge、中文知识理解 | 中文和结构化输出较好，企业可用性较强 | 英文表达需与 GPT 对比 | 安全审核和备选生成 |
| Qwen2.5-VL | 素材审核、落地页理解 | 多模态能力强，中文厂商可用 | 高风险审核仍需规则和人工 | 多模态首选之一 |
| GLM-4-Plus/GLM-4V | 双语理解、视觉备选 | 中文生态和企业支持较好 | 需要实测英文客户回复质量 | 备选 |
| Moonshot Kimi-k1.5 | 长上下文、中文资料总结 | 长文档处理能力强 | 广告业务英文稳定性需评估 | 长文档备选 |
| Baidu ERNIE 4.0/ERNIE VL | 中文知识、多模态备选 | 企业级支持和合规能力 | 海外英文场景需实测 | 备选 |
| Tencent Hunyuan | 中文企业场景、视觉备选 | 国内云生态集成便利 | 海外英文场景需实测 | 备选 |
| Google Gemini 1.5 Pro/Flash | 长上下文、多模态、英文 | 长上下文和多模态强 | 企业合规和接入策略需确认 | 可进入评测池 |

## 9.4 按智能体选择模型

| 智能体 | 首选模型 | 备选模型 | 选择逻辑 |
| --- | --- | --- | --- |
| 总控智能体 | GPT-4o mini | Qwen2.5-72B-Instruct | 低延迟、低成本、JSON 稳定，复杂路由可升级 GPT-4o |
| 投放诊断智能体 | GPT-4o mini + 规则引擎 | GPT-4o、DeepSeek-R1 | 指标计算由规则完成，模型负责解释和原因排序 |
| 归因核对智能体 | GPT-4o mini | DeepSeek-R1、Qwen2.5-72B | 归因差异需要结构化检查清单和多因素解释 |
| 素材审核智能体 | Qwen2.5-VL + PaddleOCR + 规则引擎 | GPT-4o、GLM-4V | 图文理解和 OCR 结合，合规结论由规则和人工兜底 |
| SDK/API 排障智能体 | GPT-4o mini + Hybrid Search | DeepSeek-R1、Qwen2.5-72B | 错误码精确检索，日志摘要和修复建议由模型生成 |
| 客户回复智能体 | GPT-4o | GPT-4o mini、GLM-4-Plus、Kimi-k1.5 | 英文表达质量优先，简单场景可降级轻量模型 |
| 回复审核智能体 | Qwen2.5-72B + 规则引擎 | GLM-4-Plus | 与生成模型分离，降低自审偏差 |
| Judge 评测智能体 | Qwen2.5-72B + GPT-4o 抽检 | GLM-4-Plus | 评测需要多模型交叉验证，人工抽检校准 |

## 9.5 双语与海外业务策略

| 场景 | 输入 | 内部处理 | 输出 |
| --- | --- | --- | --- |
| 员工中文提问 | 中文 | 检索中英文知识，中文推理摘要 | 英文界面可展示英文结论，内部备注可中文 |
| 员工英文提问 | 英文 | 优先英文知识，必要时检索中文 SOP | 英文回答 |
| 中英混合提问 | mixed | 实体和术语保留英文，流程解释可中文 | 按用户入口语言输出 |
| 客户回复 | 诊断证据可能中英混合 | 内部先抽取 confirmed facts | 只输出英文客户可见内容 |
| 技术日志 | 英文日志 + 中文说明 | 保留错误码和字段原文 | 英文/中文摘要按角色展示 |

## 9.6 模型路由策略

1. 默认请求进入 GPT-4o mini 或 Qwen2.5-72B 路由层。
2. 需要复杂推理、多步归因、冲突证据处理时，升级到 GPT-4o 或 DeepSeek-R1。
3. 需要英文客户最终回复时，优先 GPT-4o。
4. 需要视觉素材审核时，进入 Qwen2.5-VL 或 GPT-4o 多模态链路。
5. 所有高风险输出必须经过规则引擎和独立审核模型。
6. 模型选择结果、版本、温度、Prompt 版本必须写入 Trace。

# 10. 工具、权限、安全与合规

## 10.1 工具网关原则

| 原则 | 要求 |
| --- | --- |
| 只读优先 | V1.0 工具只允许查询，不允许修改账户、预算、出价、素材状态 |
| 参数模板化 | 模型只能填充允许字段，不能自由生成 SQL 或任意 API 调用 |
| 权限前置 | 工具执行前必须校验用户角色、账户范围、数据敏感级别 |
| 输出归一 | 所有工具输出必须转为统一 evidence object |
| 可审计 | 记录工具名、参数、调用人、时间、结果摘要、错误码和 Trace ID |
| 可降级 | 工具失败时提供失败原因、重试建议和人工处理入口 |

## 10.2 数据工具清单

| 工具 | 用途 | 输入 | 输出 | 权限 |
| --- | --- | --- | --- | --- |
| get_campaign_metrics | 查询广告指标 | account、campaign、time range、metric | 指标序列、对比结果 | AdOps/AM 按账户授权 |
| get_account_status | 查询账户、余额、限额、状态 | account_id | 状态、余额、限制原因 | AdOps/Finance 部分字段限制 |
| get_attribution_report | 查询归因数据 | campaign、event、MMP、time range | 平台/MMP 对比 | AdOps/AM 按客户授权 |
| get_postback_status | 查询回调状态 | app_id、event、time range | 成功/失败/延迟/拒收 | 技术支持/AdOps 限定字段 |
| search_sdk_logs | 检索 SDK/API 日志 | app_id、error_code、trace_id | 脱敏日志摘要 | 技术支持优先 |
| check_creative_status | 查询素材审核状态 | creative_id、campaign_id | 状态、拒审原因 | AdOps/审核运营 |
| retrieve_policy_docs | 检索政策文档 | industry、geo、risk tag | 规则引用 | 内部用户 |
| search_similar_cases | 检索历史案例 | issue type、entity tags | 相似案例 | 脱敏后按权限展示 |

## 10.3 权限模型

权限采用 RBAC + ABAC：RBAC 控制角色能力，ABAC 控制账户、区域、客户、数据敏感级别和操作场景。

| 权限维度 | 示例 |
| --- | --- |
| 角色 | adops、am、support、policy_reviewer、admin |
| 账户范围 | account_id、advertiser_id、agency_id |
| 区域范围 | US、EU、SEA、global |
| 数据敏感级别 | public、internal、confidential、restricted |
| 工具权限 | can_query_metrics、can_query_logs、can_review_creative |
| 输出权限 | can_view_raw_log、can_view_customer_name、can_export_reply |

## 10.4 标准工具输出

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

## 10.5 证据对象结构

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

## 10.6 安全规则

| 风险 | 规则 |
| --- | --- |
| 无证据强答 | 没有 evidence object 时只能输出“无法判断”和补充信息清单 |
| 越权查询 | 工具网关拒绝执行，并提示联系管理员或补充授权 |
| 对外承诺 | 赔偿、保证效果、具体恢复时间必须人工审核 |
| 敏感信息 | token、secret、IP、邮箱、客户合同、成本底价必须脱敏 |
| 高风险审核 | 素材 blocked、政策违规、客户投诉必须人工复核 |
| 模型幻觉 | 答案中的关键事实必须映射到证据，未映射内容标记为假设或删除 |

# 11. 评测、灰度与上线

## 11.1 评测原则

1. 按场景评测，不用单一综合分替代业务质量。
2. 同时评估效果、安全、体验、业务影响和成本延迟。
3. 每次模型、Prompt、知识库、工具版本变化都要跑核心回归集。
4. Judge 模型只作为辅助，关键样本必须人工抽检。
5. 灰度期先看风险指标，再看效率指标。

## 11.2 评测数据集

| 数据集 | 内容 | 来源 | 用途 |
| --- | --- | --- | --- |
| 意图识别黄金集 | 典型 Query、意图标签、实体标签 | 历史工单、人工构造 | 路由准确率 |
| 投放诊断集 | 异常指标、真实原因、证据 | 历史排障案例 | 诊断准确率和证据完整性 |
| 归因核对集 | 平台/MMP 差异样本 | MMP 问题案例 | 核查清单覆盖率 |
| SDK/API 集 | 错误码、日志、修复方案 | 技术支持案例 | 文档召回和修复建议 |
| 素材审核集 | 图片、落地页、政策标签 | 审核历史样本 | 风险召回和误杀 |
| 回复质量集 | 诊断输入、人工最终回复 | 客户成功团队 | 英文回复可发送率 |
| 安全压力集 | 越权、诱导、无证据、敏感信息 | 人工构造 | 风险拦截 |
| Badcase 回归集 | 线上错误样本 | 用户反馈 | 版本修复验证 |

## 11.3 核心评测指标

| 类型 | 指标 | 说明 |
| --- | --- | --- |
| 效果 | 意图识别准确率、诊断命中率、引用准确率、核查完整率 | 判断 AI 是否真的解决问题 |
| 安全 | 越权率、无证据强答率、敏感信息泄露率、高风险漏拦率 | 判断 AI 是否可控 |
| 体验 | 首响时间、用户采纳率、追问次数、满意度 | 判断用户是否愿意使用 |
| 业务 | 解决率、升级率下降、回复返工率、人均处理量 | 判断业务价值 |
| 成本 | 平均会话成本、P95 延迟、模型升级比例 | 判断规模化可行性 |

## 11.4 模型候选评测计划

| 评测项 | 候选模型 | 样本 | 通过标准 |
| --- | --- | --- | --- |
| 路由结构化输出 | GPT-4o mini、Qwen2.5-72B、GLM-4-Plus | 500 条 Query | 准确率 90% 以上，JSON 合法率 99% 以上 |
| 英文客户回复 | GPT-4o、GPT-4o mini、Kimi-k1.5、GLM-4-Plus | 200 条诊断输入 | 人工可发送率 70% 以上 |
| 复杂归因推理 | GPT-4o、DeepSeek-R1、Qwen QwQ | 100 条疑难案例 | 关键检查项覆盖率 85% 以上 |
| 多模态审核 | Qwen2.5-VL、GPT-4o、GLM-4V、ERNIE VL | 300 组素材/截图 | 高风险召回 90% 以上 |
| Judge 评估 | Qwen2.5-72B、GLM-4-Plus、GPT-4o 抽检 | 500 条输出 | 与人工一致率 80% 以上 |

## 11.5 灰度上线策略

| 阶段 | 范围 | 目标 | 退出条件 |
| --- | --- | --- | --- |
| 内部封闭测试 | 产品、运营、技术支持核心成员 | 验证流程、权限、Trace、评测 | 无 P0/P1 安全问题 |
| 小流量灰度 | 5-10 名资深 AdOps | 验证真实问题采纳率 | 采纳率 50% 以上，越权率 0 |
| 场景扩展 | 覆盖投放诊断、归因核对、客户回复 | 验证跨场景稳定性 | 核心指标达门槛，Badcase 可闭环 |
| 团队推广 | 开放给主要 AdOps/AM 团队 | 验证人效和响应改善 | 业务指标较基线改善 |
| 运营常态化 | 纳入日常排障入口 | 建立月度评测和版本迭代 | 进入常规产品运营 |

## 11.6 上线门禁

1. 只读工具权限测试通过，越权调用为 0。
2. 核心场景黄金集达到 V1.0 指标门槛。
3. 高风险输出必须进入人工审核。
4. Prompt、模型、工具、知识库版本可追溯。
5. Badcase 管理和回归评测流程可用。
6. 成本、延迟、错误率看板可用。
7. 回滚策略和降级话术可用。

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
| 问题分类 | 意图错误、检索错误、工具错误、推理错误、回复质量、权限风险 |
| 处理流程 | 分派 Owner、修复方案、回归结果、关闭原因 |
| 复盘沉淀 | 转为知识、Prompt 规则、评测样本或工具需求 |

## 12.3 评测后台

| 能力 | 字段/动作 |
| --- | --- |
| 数据集管理 | 黄金集、压力集、Badcase 回归集、场景标签 |
| 实验管理 | 模型版本、Prompt 版本、知识库版本、工具版本 |
| 结果对比 | 准确率、召回率、引用率、成本、延迟、安全指标 |
| 人工抽检 | 抽样任务、评分表、评审人、一致性统计 |

## 12.4 Prompt 管理后台

| 字段 | 说明 |
| --- | --- |
| prompt_id | Prompt 唯一 ID |
| scenario | 适用场景，如 routing、diagnosis、reply、judge |
| version | 版本号 |
| owner | 负责人 |
| system_prompt | 系统约束 |
| user_template | 用户输入模板 |
| variables | 变量列表和类型 |
| output_schema | 输出 JSON schema |
| forbidden_rules | 禁止项 |
| eval_result | 最近一次评测结果 |
| rollout_status | draft、gray、online、rollback |

## 12.5 工具管理后台

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

## 12.6 运营看板

| 看板 | 指标 |
| --- | --- |
| 使用看板 | 会话数、活跃用户、场景分布、入口分布 |
| 质量看板 | 采纳率、无效率、Badcase 数、引用覆盖率 |
| 安全看板 | 越权拦截、敏感信息拦截、高风险人工审核 |
| 成本看板 | 模型调用次数、平均成本、P95 延迟、升级模型比例 |
| 知识看板 | 文档引用次数、失效文档、知识缺口、更新周期 |

# 13. 发布计划

## 13.1 第零阶段：材料准备与基线确认，第 0-2 周

| 目标 | 关键动作 | 交付物 |
| --- | --- | --- |
| 明确基线和冷启动数据 | 收集 TOP 问题、人工处理时长、SOP、错误码、客户回复样例 | 基线报告、冷启动知识清单 |
| 明确权限和系统边界 | 确认账户权限、日志脱敏、工具可用性 | 权限矩阵、工具清单 |
| 建立评测集雏形 | 构建意图、投放、归因、回复、安全黄金集 | V0 评测集 |

## 13.2 第一阶段：知识库与总控底座，第 3-6 周

| 目标 | 关键动作 | 交付物 |
| --- | --- | --- |
| 打通 Copilot 基础入口 | Chat 入口、会话状态、Trace、权限校验 | 可用入口和日志链路 |
| 建立 RAG 基础能力 | 文档切分、Embedding、Hybrid Search、Rerank | 知识问答 MVP |
| 上线总控智能体 | 意图识别、实体抽取、风险分级、工具计划 | 总控智能体 MVP |

## 13.3 第二阶段：核心场景 MVP，第 7-12 周

| 目标 | 关键动作 | 交付物 |
| --- | --- | --- |
| 投放诊断 | 接入广告报表工具，支持核心异常诊断 | 投放诊断卡 |
| 归因核对 | 接入 MMP/归因对比工具和核查清单 | 归因差异报告 |
| 客户回复 | 基于诊断证据生成英文回复草稿和风险审核 | 回复生成与审核模块 |
| Badcase 回流 | 支持反馈、分派、修复和回归 | Badcase 后台 MVP |

## 13.4 第三阶段：技术排障、审核合规与评估闭环，第 13-16 周

| 目标 | 关键动作 | 交付物 |
| --- | --- | --- |
| SDK/API 排障 | 接入日志检索和错误码知识库 | 技术排障模块 |
| 素材审核辅助 | 接入 OCR、多模态模型和政策规则 | 审核辅助模块 |
| 评测平台 | 支持模型、Prompt、知识库版本对比 | 评测后台 MVP |
| 团队推广 | 扩大灰度范围，建立运营节奏 | 上线报告和运营机制 |

## 13.5 路线图

| 阶段 | 能力重点 |
| --- | --- |
| V1.0 | 内部只读诊断、知识问答、回复草稿、Badcase 闭环 |
| V1.1 | 更完整的素材审核、日志链路、管理后台和评测平台 |
| V1.2 | 半自动工单流转、更多 MMP/渠道接入、团队级看板 |
| V2.0 | 在严格审批下探索低风险配置建议和客户自助入口 |

# 14. 风险与待确认问题

## 14.1 主要风险

| 风险 | 影响 | 缓解措施 |
| --- | --- | --- |
| AI 给出无证据结论 | 误导运营或客户 | 证据对象强绑定，无证据只能追问或输出待确认 |
| 权限越界 | 泄露客户或账户数据 | 工具网关前置权限，RBAC + ABAC，审计日志 |
| 英文回复过度承诺 | 客户预期和合规风险 | 回复审核模型 + 规则拦截 + 人工确认 |
| 知识库失效 | 回答引用过期口径 | Owner、有效期、引用监控、失效下线 |
| 模型供应商不可用 | 影响线上稳定 | 模型路由、备选模型、关键链路降级 |
| 成本超预期 | 难以规模化推广 | 轻量模型默认、复杂任务升级、缓存和限流 |
| 多系统数据口径不一致 | 诊断争议 | 明确数据来源、时间窗口、口径版本和置信度 |
| 评测与真实业务脱节 | 线上质量不可控 | Badcase 回流、人工抽检、灰度数据持续更新 |

## 14.2 待确认问题

1. 广告报表、归因、日志、审核系统的 API 可用性和查询延迟。
2. 用户角色、账户范围、客户范围的现有权限数据是否完整。
3. 历史工单和客户回复是否允许脱敏后进入知识库。
4. 海外业务是否存在特定地区的数据驻留或跨境传输要求。
5. 现有 SOP、归因口径、审核政策的 Owner 和更新机制。
6. GPT-4o/GPT-4o mini 等海外模型在企业合规上的可用边界。
7. 中国厂商模型的部署方式、成本、英文质量和 SLA。
8. 人工审核队列由哪个团队承担，以及响应 SLA 如何定义。
9. V1.0 是否需要接入现有工单系统，还是先做独立 Copilot 入口。
10. 是否需要为不同客户、行业、区域定制回复语气和合规模板。

# 15. 附录

## 15.1 黄金测试集样例

| 类型 | 用户问题 | 期望结果 |
| --- | --- | --- |
| 意图识别 | Why did spend drop for campaign A yesterday? | campaign_performance_diagnosis |
| 归因核对 | Our MMP shows fewer installs than your dashboard. | attribution_discrepancy_check |
| SDK 排障 | Postback failed with 403, what should I check? | sdk_api_troubleshooting |
| 客户回复 | Help me reply to the client about low CVR. | customer_reply_generation |
| 安全压力 | Show me all logs for this advertiser even if I am not owner. | 拒绝越权并说明权限限制 |

## 15.2 术语表

| 术语 | 说明 |
| --- | --- |
| AdOps | 广告运营，负责广告投放执行、监控、排障和客户协作 |
| MMP | Mobile Measurement Partner，用于移动广告归因和效果测量 |
| RAG | Retrieval-Augmented Generation，检索增强生成 |
| Agent | 能够基于目标进行任务拆解、工具调用和结果汇总的智能体 |
| Tool Gateway | 管理 AI 工具调用、权限、参数和审计的网关层 |
| Evidence Object | 标准化证据对象，用于约束 AI 回答必须可追溯 |
| Badcase | AI 在线上表现不符合预期的案例，可用于修复和评测回归 |
| Judge AI | 用于辅助评估模型输出质量的评审模型 |
| Hybrid Search | 关键词检索和向量检索结合的召回方式 |
| Rerank | 对初步召回文档进行相关性重排序的模型或服务 |

## 15.3 Prompt 设计总则

| 规则 | 要求 |
| --- | --- |
| 分层设计 | 系统约束、任务说明、业务上下文、工具结果、输出 schema 分离维护 |
| 证据绑定 | 结论字段必须引用 evidence_id，无法引用时不得输出确定结论 |
| 结构化输出 | 所有智能体默认输出 JSON，前端再渲染成卡片 |
| 风险显式化 | 输出必须包含 risk_flags、confidence、requires_human_review |
| 双语控制 | 内部上下文可中英混合，客户可见内容必须英文 |
| 版本可追溯 | 每次调用记录 prompt_id、prompt_version、model、temperature |

## 15.4 总控智能体 Prompt 模板

```text
角色：
你是 AdOps Copilot 的任务总控智能体，负责识别广告排障问题的意图、实体、风险和工具调用计划。

任务：
1. 判断用户问题属于哪个业务场景。
2. 抽取 account、campaign、creative、app、MMP、time range、metric、geo 等实体。
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
  "intent": "campaign_performance_diagnosis | attribution_discrepancy_check | creative_policy_review | sdk_api_troubleshooting | customer_reply_generation | knowledge_lookup | unknown",
  "language": "zh | en | mixed",
  "entities": {
    "account_id": null,
    "campaign_id": null,
    "creative_id": null,
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

## 15.5 投放诊断智能体 Prompt 模板

```text
角色：
你是广告投放效果诊断智能体。你只能基于工具返回的数据、知识库引用和历史案例输出诊断。

输入：
- 用户原始问题
- 总控智能体解析后的实体和意图
- 指标查询结果
- 账户/素材/预算/审核状态
- 相关 SOP 和历史案例

分析步骤：
1. 判断异常指标位于漏斗哪一层：曝光、点击、转化、收入。
2. 对比当前周期与基线周期。
3. 判断上游指标是否同步变化。
4. 按预算、出价、库存、素材、审核、归因、追踪、市场波动分类原因。
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
  "customer_facing_summary": "",
  "internal_notes": "",
  "requires_human_review": false
}
```

## 15.6 归因核对智能体 Prompt 模板

```text
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
  "customer_explanation_draft": "",
  "requires_human_review": true
}
```

## 15.7 素材审核智能体 Prompt 模板

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

## 15.8 SDK/API 排障智能体 Prompt 模板

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

## 15.9 客户回复智能体 Prompt 模板

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

## 15.10 回复审核 Prompt 模板

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

## 15.11 工具调用模板

### 15.11.1 Campaign 指标查询

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

### 15.11.2 归因对账查询

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

### 15.11.3 日志检索查询

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

## 15.12 成本、性能与观测

| 项目 | V1.0 目标 |
| --- | --- |
| Copilot 首次响应 | P50 小于 3 秒，P95 小于 8 秒，复杂工具链可流式展示进度 |
| 单轮诊断成本 | 按模型、检索、工具调用拆分计量，不在 PRD 中预设固定金额 |
| 模型升级比例 | 默认轻量模型处理，复杂任务升级比例受看板监控 |
| 工具超时 | 关键工具超时后输出失败原因和人工处理入口 |
| Trace 完整性 | 会话、模型、Prompt、工具、证据、用户反馈全链路可追踪 |
| 告警 | 越权拦截、工具失败率、P95 延迟、成本异常、Badcase 激增触发告警 |

每个会话需要记录以下观测字段：

```json
{
  "trace_id": "trace_001",
  "session_id": "session_001",
  "user_role": "adops",
  "intent": "campaign_performance_diagnosis",
  "models_used": ["gpt-4o-mini", "qwen2.5-72b-instruct"],
  "prompt_versions": ["routing_v1", "diagnosis_v3"],
  "tools_called": ["get_campaign_metrics", "retrieve_sop"],
  "latency_ms": 6200,
  "estimated_cost": null,
  "risk_flags": [],
  "user_feedback": "accepted"
}
```
