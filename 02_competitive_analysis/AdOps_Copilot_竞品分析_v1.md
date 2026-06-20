# 第二阶段\-竞品分析\-林扬宇

|姓名|林扬宇|
|---|---|
|所属行业|移动互联网广告, K12教育直播|
|工作经历<br>|- 第一段：读书郎双师直播课 后端开发 2019\-07\~2020\-04<br>- 第二段：有米科技广告投放系统 后端开发 2020\-05\~2023\-03<br>- 第三段：有米科技广告投放系统 产品经理 2023\-04\~2025\-06|

## 竞品识别与定义

### 竞品全景图

> 请从以下三个维度，尽可能多地列出潜在的竞品，并最终选择2\-3个进行深入分析。

- **直接竞品**

|类型|代表产品|为什么算直接竞品|
|---|---|---|
|移动营销测量 AI 助手|AppsFlyer AI Assistant<br>|直接面向移动营销和 MMP 数据场景，支持用自然语言理解 campaign performance、KPI 对比、趋势调查、配置问题、事件定义和平台设置任务。AppsFlyer 官方说明其 AI Assistant 可作为 analytics 与 setup 的上下文层，帮助理解 campaign performance、investigating trends、checking configuration issues、clarifying event definitions 等问题。|
|PPC/广告账户诊断 AI<br>|Optmyzr Sidekick \+ PPC Investigator<br>|面向广告投手和 PPC 团队，支持性能分析、数据探索、优化机会发现和 workflow action；PPC Investigator 可用 cause chart 和 root cause analysis 在几分钟内分析 performance changes。|
|广告平台内置智能诊断/分析|Google Ads / Meta Ads / TikTok Ads 后台中的智能建议、诊断、自动化规则|可替代部分投手排障和优化工作，但通常只覆盖单一媒体平台，无法统一解释 MMP、BI、SDK、客户工单和跨渠道数据口径。|

- **间接竞品**：

|类型|代表产品|相关性|
|---|---|---|
|客服/工单 AI Copilot|**Zendesk AI / Zendesk Copilot**|与我们在“知识库检索、工单总结、回复生成、转人工、服务质量提升”上高度相似。Zendesk Copilot 官方定位是为客服代理和管理员提供基于知识、政策和服务上下文的实时指导，推荐下一步行动并优化 workflow。|
|客服 AI Agent|Intercom Fin|Fin AI Agent 支持客服场景下的自动回答、跨 email/live chat/phone 的处理、外部系统动作和人工 handoff，适合作为“客户支持自动化”类参考，但缺少广告业务数据和 MMP/SDK 排障能力。|
|技术排障/Incident AI|Datadog Bits AI / Incident AI|与我们在“根因分析、事故摘要、相关问题发现、自然语言查询、专家协同排查”上相似。Datadog Incident AI 可在 Slack 或 Datadog Incident Management 中生成事故摘要、识别 related incidents，并触发 Bits AI SRE investigation。|
|通用企业知识库 AI|Glean、Microsoft Copilot、Notion AI、Confluence AI|可解决知识检索和总结问题，但对移动广告投放指标、归因、SDK、媒体审核、客户回复等垂直场景缺少开箱即用的业务语义。|

- **替代品竞品**：

|替代方式|当前使用方式|核心问题|
|---|---|---|
|人工问资深同事|AM/运营在飞书群、企业微信群、Slack 群里问资深同事|依赖个人经验，响应不稳定，经验无法沉淀|
|人工查 SOP/FAQ|翻内部文档、平台帮助中心、MMP 文档、SDK 文档|文档分散、版本不一致、搜索效率低|
|人工查广告后台 \+ MMP \+ BI|运营在多个后台手工拆指标|系统割裂，口径不一致，排查时间长|
|Jira/Zendesk 工单|把问题提交技术或产品团队排查|流转慢、重复问题多、客户等待时间长|
|固定 BI 看板/报警|通过规则发现 CPI、CPA、ROAS 异常|能发现异常，但通常不能解释原因和生成行动建议|

### 核心分析对象确认

> 从上述全景图中，选择2\-3个最具代表性的竞品（建议至少包含1个直接竞品）作为本报告的深度分析对象。

- **深度分析对象 1：AppsFlyer AI Assistant**

代表“移动营销测量平台内置 AI 助手”，与我们的 MMP、归因、投放数据诊断场景最接近。

- **深度分析对象 2：Optmyzr Sidekick \+ PPC Investigator**

代表“广告账户优化与根因分析工具”，与我们的投放异常诊断、指标拆解、行动建议场景最接近。

- **深度分析对象 3：Zendesk AI / Zendesk Copilot**

代表“客服/工单/知识库 AI Copilot”，与我们的 AM 客户回复、知识检索、转人工、经验沉淀场景最接近。

## 竞品深度剖析

### 竞品 A：AppsFlyer AI Assistant

> 请从产品定位、功能、技术、商业模式等多个维度，全面分析该竞品。

**基本信息**

|**维度**|**内容**|
|---|---|
|产品名称|AppsFlyer AI Assistant|
|公司背景|AppsFlyer 是移动归因、营销测量与数据协作平台，AI Assistant 属于其 Agentic AI / AI Assistant 能力体系|
|核心用户|移动 App 广告主、UA Manager、增长团队、营销分析师、MMP 使用者、数据分析人员|
|核心场景|用自然语言分析 campaign performance、对比 KPI、调查趋势变化、理解配置问题、查询事件定义、指导平台 setup|
|产品入口|AppsFlyer 平台内，支持在 AI Assistant 中直接提问，也支持在 My Dashboards 图表中使用 Analyze with AI；管理员可在 Account \& Profile 中开启或关闭 AI Assistant。|
|定价模式|公开页面强调 Book a demo、Sign up free 等入口，具体 AI Assistant 是否单独计费需以 AppsFlyer 商务方案为准；公开资料未披露统一公开价格。|

**SWOT分析**：

- **优势**：

    - **垂直场景非常接近。** AppsFlyer AI Assistant 直接覆盖移动营销数据分析、campaign performance、ROAS、installs、event definitions、partner configurations 等问题，和我们产品中的 MMP/归因排障、指标分析高度相似。

    - **数据上下文强。** 它天然处在 MMP 平台内，能够直接读取 campaign、geo、media source、ad、platform、cost、ROI、ROAS、retention、revenue 等维度数据。AppsFlyer Help Center 示例显示用户可以询问最高 ROAS campaign、媒体来源收入、CPI、地理分布、趋势变化等问题。

    - **交互方式贴近数据分析。** 支持普通自然语言问题，也支持对图表进行 Analyze with AI，生成图表摘要、解释趋势波动、对比 top performers 和 period\-over\-period changes。

    - **隐私与归因知识壁垒。** AppsFlyer 的核心平台数据包括 attribution、postback、partner setup、event definitions、cost integrations 等，这些是普通通用 LLM 难以直接掌握的业务知识。

- **劣势**：

    - **平台边界明显。** 它主要围绕 AppsFlyer 平台数据和 setup 进行回答，对广告平台后台、SDK 服务端日志、内部 BI、客户聊天记录、媒体审核政策等外部系统的直接覆盖有限。

    - **更像“营销数据分析助手”，不是完整 AdOps 排障中枢。** 对我们产品设想中的“客户问题收集 → 内部知识检索 → 数据诊断 → 技术工单升级 → 客户话术生成 → 经验沉淀”完整链路覆盖不足。

    - **难以处理非 AppsFlyer 客户。** 如果广告主使用 Adjust、Singular、Branch、自研归因或 OEM 数据，AppsFlyer AI Assistant 的价值会降低。

- **机会**：

    - 移动广告信号损失、SKAN、隐私归因、事件回传、成本对账、素材级分析越来越复杂，广告团队需要“懂归因 \+ 懂投放 \+ 懂配置”的 AI 助手。

    - AppsFlyer 验证了一个方向：广告运营人员愿意用自然语言问 campaign performance 和 setup 问题，这说明 AdOps Copilot 有用户心智基础。

- **威胁**：

    - 如果 MMP 厂商把 AI Assistant 扩展到更完整的工单、知识库、外部广告平台连接和客户回复生成，则会向我们的产品空间扩张。

    - 广告主如果深度绑定 AppsFlyer，可能更倾向于在 MMP 内完成大部分分析，而不是再引入一个外部排障助手。

**关键功能拆解**：

|分析维度|功能模块|功能描述|AI 在其中的角色|
|---|---|---|---|
|核心功能|自然语言营销数据问答|用户可以询问 campaign、media source、geo、ROI、ROAS、CPI、revenue、spend 等指标表现|将自然语言转为数据查询和分析逻辑，生成回答、摘要和可视化解释|
|核心功能|Analyze with AI|对 dashboard 中的图表直接解释趋势、波动、highlights、lowlights 和 key takeaways|读取当前图表上下文，生成图表摘要和波动解释|
|核心功能|异常趋势解释|用户可问“为什么 installs drop this week？”“哪个 geo contributed most to spike？”等问题|通过维度拆解找出影响变化的 campaign、geo、media source 等因素|
|辅助功能|Setup / 配置问答|支持 OneLink、dashboard filter、custom metrics、activity view vs LTV 等平台使用问题|基于产品文档和配置知识进行 RAG 问答|
|辅助功能|Follow\-up next steps<br>|AI Assistant 会建议 relevant next steps，例如继续 drill into another dimension、compare periods 或 explore related metric|体现交互智能和下一步排查引导能力|

**AI策略深度剖析**：

- **技术实现推测**：

    - **意图路由：**用户问题大概率先被分为“数据分析类”“趋势解释类”“产品/配置问答类”“setup guidance 类”。

    - **数据分析链路：** 对 campaign performance 问题，系统可能将自然语言转为语义层查询或 SQL/API 请求，再结合当前 dashboard 上下文生成解释。

    - **RAG 链路：** 对 OneLink、event definitions、partner configurations、measurement logic 等问题，系统更可能检索 AppsFlyer 产品文档和帮助中心知识库。

    - **生成与封装：** 最终回答会把数据结果、图表上下文、维度拆解和下一步建议封装为自然语言。

- **数据壁垒分析**：

    - AppsFlyer 最大壁垒不是通用大模型，而是 **MMP 归因数据 \+ partner setup \+ event definitions \+ cost integrations \+ AppsFlyer 平台操作知识**。

    - 这种数据天然靠近移动广告转化链路，对“广告投放智能排障助手”非常有借鉴价值。

- **AI功能呈现方式**：

    - 更偏“内嵌式 AI 分析助手”，不是独立 chatbot。入口位于平台页面和 dashboard 上下文中，适合数据分析人员边看报表边追问。

- **商业模式与定价**：

    - 未见 AI Assistant 的统一公开价格。更可能作为 AppsFlyer 平台能力或商业套餐的一部分，而不是面向所有用户独立收费。

**AI 冰山模型分析**

|层级|判断|
|---|---|
|功能模块|平台内 AI 图标、自然语言问答、dashboard 图表分析、趋势解释、setup guidance（https://www\.appsflyer\.com/products/agentic\-ai/ai\-assistant/ ，https://support\.appsflyer\.com/hc/en\-us/articles/38423389662609\-AI\-Assistant）|
|模型能力|对营销指标、归因口径、campaign 维度和平台配置理解较强；对非 AppsFlyer 数据源和跨团队协作链路能力有限|
|交互智能|能建议 follow\-up next steps，适合连续追问和维度 drill\-down|
|AI Persona|类似“营销数据分析师 \+ AppsFlyer 平台专家”，语气偏专业、分析型、数据导向|
|数据策略|平台一方数据 \+ MMP 归因知识 \+ 产品帮助文档 \+ 用户分析行为反馈|
|安全边界|主要风险在于数据权限、客户数据隔离、归因解释误导；应避免把相关性误说成因果|

**动态工作流推演**

```Plain Text
用户输入：为什么上周印尼安卓 CPI 升高？
↓
意图识别：营销数据异常分析 / CPI 波动解释
↓
上下文识别：当前 dashboard、时间范围、app、campaign、geo、media source、platform
↓
数据查询：花费、installs、clicks、media source、geo、campaign、ad、period comparison
↓
指标拆解：CPI = cost / installs，进一步拆 cost、install volume、geo/campaign/media source contribution
↓
结果生成：说明主要驱动因素、变化幅度、top contributors
↓
下一步建议：建议继续查看某 media source、geo、campaign 或对比上期
```

### 竞品B：Optmyzr Sidekick \+ PPC Investigator

#### 基本信息

|维度|内容|
|---|---|
|产品名称|Optmyzr Sidekick \+ PPC Investigator|
|公司背景|Optmyzr 成立于 2013 年，是 B2B paid media management and automation platform，帮助数字营销人员管理和优化付费媒体 campaign。|
|核心用户|PPC 专家、搜索广告优化师、代理商投手、Google Ads / Microsoft Ads / Amazon Ads / Meta Ads 账户管理人员|
|核心场景|PPC 账户分析、performance change 根因分析、PMax/Shopping/Search 优化、预算监控、KPI alerts、Rule Engine 自动化|
|产品入口|Optmyzr 平台内，Sidekick 作为内置 AI\-powered PPC assistant；PPC Investigator 作为根因分析工具|
|商业模式与定价|Optmyzr Pricing 页面显示完整 PPC toolkit 起价为 €209/月，并包含 account audits、performance reports、budget monitoring、KPI alerts、data insights、Rule Engine、MCP connection 等能力。|

#### SWOT 分析

- **优势：**

    - **广告账户优化场景强。** Optmyzr Sidekick 直接面向 PPC 工作流，支持理解 performance、explore data、uncover optimization opportunities 和 take action across workflows。

    - **根因分析工具成熟。** PPC Investigator 官方说明可生成 cause chart 和 root cause analysis，在几分钟内理解 performance changes。

    - **广告操作工具链完整。** 除 AI 助手外，还包括 budget monitoring、KPI alerts、account audits、Rule Engine、PMax insights、cross\-platform reporting 等，适合成熟 PPC 团队。

    - **能从“分析”走向“行动”。** Sidekick 不只是回答问题，也能引导优化动作、生成可视化、构建 Rule Engine 策略；这对 AdOps Copilot 后续从“问答”走向“建议执行”很有参考价值。

- **劣势：**

    - **偏 PPC/Search，不是移动 App 广告全链路。** 它更强在 Google Ads、Microsoft Ads、PMax、Shopping、Search 等场景，对 App 安装归因、SKAN、MMP postback、SDK 展示日志、OEM 渠道等移动广告问题覆盖不足。

    - **更像账户优化平台，不是客户服务排障平台。** 它不以 AM 客户回复、历史工单沉淀、平台审核政策问答为核心。

    - **价格门槛相对高。** 对小团队而言，€209/月起步的 PPC toolkit 适合成熟广告团队，但若只是处理内部排障知识问答，可能显得过重。

- **机会：**

    - 证明“指标波动 → 根因图谱 → 可执行建议”的产品逻辑成立。

    - 我们可以借鉴 PPC Investigator 的“指标因果拆解/贡献度分析”能力，但迁移到移动广告的 CPI、CPA、ROAS、归因差异、SDK 错误、素材审核和客户工单场景。

- **威胁：**

    - 如果 Optmyzr 或类似 PPC 平台扩展到移动 App 广告、MMP 连接和客户支持场景，会成为更直接的竞品。

    - 随着广告平台 API 和 MCP 生态成熟，通用 AI 客户端可能通过 MCP 接入广告数据并做基础诊断。

#### 关键功能拆解

|分析维度|功能模块|功能描述|AI 在其中的角色|
|---|---|---|---|
|核心功能|Sidekick AI 助手|在平台内用自然语言分析 PPC 数据、生成可视化、解释报告、发现优化机会|作为对话式分析入口，结合 GenAI、ML 和 Optmyzr 优化逻辑输出建议|
|核心功能|PPC Investigator|对 clicks、impressions、conversions、cost/conversion、CTR、ROAS 等指标变化做 cause chart/root cause analysis|通过指标拆解和维度贡献分析解释 performance changes|
|核心功能|Rule Engine|构建自定义规则和策略，自动化账户优化|AI 可辅助生成和解释规则，帮助用户从洞察走向执行|
|辅助功能|Budget Monitoring / KPI Alerts|监控预算和关键指标异常|AI 可总结异常、推荐检查方向|
|辅助功能|MCP connection|定价页提到支持 Claude、ChatGPT 和其他 AI 工具的 MCP connection|让外部 AI 客户端访问结构化 PPC 功能和账户上下文|

#### AI 策略深度剖析

- **技术实现推测：**

    - **结构化广告语义层：** 对 Google Ads、Microsoft Ads、Amazon Ads、Meta Ads 等 API 数据做统一指标语义层。

    - **根因分析算法：** 通过 cause chart 拆解指标变化，判断变化来自哪一层，例如 clicks、CPC、conversion rate、device、geo、campaign、ad group、keyword 等。

    - **LLM \+ 专有规则结合：** Sidekick 官方称其结合 generative AI、Optmyzr 自身的 ML 和 optimization logic。

- **数据壁垒分析：**

    - 广告账户历史数据、优化规则、PPC workflow、账户结构、campaign/ad group/keyword/feed/placement 维度数据是核心壁垒。

    - 另一个壁垒是积累多年的 paid media 操作逻辑，例如哪些异常应该看 Quality Score、merchant feed、budget pacing、PMax search terms 等。

- **AI 功能呈现方式：**

    - 更像“广告优化专家 Sidekick”，不只是 AI chat。它在账户管理工作流里提供分析、指导、可视化和动作建议。

- **商业模式与定价：**

    - SaaS 订阅，公开起价 €209/月，随账户数、广告花费规模和高级功能变化。

#### AI 冰山模型分析

|层级|判断|
|---|---|
|功能模块|PPC 工具后台、Sidekick 对话窗口、PPC Investigator cause chart、Rule Engine、alerts、dashboards|
|模型能力|擅长 PPC 数据拆解、趋势解释、账户优化建议；对移动 App 归因和 SDK 技术问题能力弱|
|交互智能|能支持多轮追问、分析复杂账户问题、生成可视化和策略|
|AI Persona|类似“资深 PPC 专家 / 优化顾问”，强调保持用户在控制中|
|数据策略|广告平台 API 数据 \+ 历史账户数据 \+ 优化规则 \+ benchmark \+ 用户执行反馈|
|安全边界|涉及自动化调整时需要强人工确认；错误建议可能直接影响广告预算|

#### 动态工作流推演

```Plain Text
用户输入：为什么这个 Google Ads 账户本周 CPA 上升？
↓
意图识别：PPC performance change root cause analysis
↓
账户上下文加载：账户、campaign、时间范围、指标、目标 KPI
↓
数据查询：cost、conversions、CPC、CTR、CVR、device、geo、campaign、ad group 等
↓
根因拆解：通过 cause chart 判断 CPA 上升主要来自 cost 增长、conversion rate 下降或流量结构变化
↓
优化建议：推荐预算、关键词、placement、feed、规则、alerts 或 PMax 调整
↓
行动入口：用户可进入 Rule Engine 或 workflow 执行
```

## 市场机会与差异化定位

### 竞品对比矩阵

> 将所有竞品（包括我们自己设想的产品）放入一个矩阵中进行横向对比，可以直观地看到差异和机会。

|**分析维度**|**AppsFlyer AI Assistant**|**Optmyzr Sidekick \+ PPC Investigator**|**替代品（人工\+BI\+SOP）**|**我们的产品：AdOps Copilot**|
|---|---|---|---|---|
|核心功能|移动营销数据问答、KPI 对比、趋势解释、配置和事件定义指导|PPC 数据分析、根因图谱、优化建议、Rule Engine、自动化|人工查后台、问同事、翻文档、提工单|广告投放排障、归因解释、SDK/审核问题诊断、客户回复生成、经验沉淀|
|场景适配度|对 MMP/移动归因强，对完整 AdOps 流转中等|对 PPC/Search 强，对移动 App 广告中等偏弱|灵活但低效|专注移动互联网广告全链路排障|
|AI 技术/效果|NL 数据分析 \+ RAG 产品问答 \+ dashboard context|GenAI \+ ML \+ 优化逻辑 \+ root cause/cause chart|N/A|RAG \+ 广告指标拆解 \+ NL2SQL/数据查询 Agent \+ 历史工单相似检索 \+ 高风险转人工|
|数据壁垒|AppsFlyer 平台归因数据、event definitions、partner config|广告账户数据、PPC workflow、优化规则、benchmark|个人经验和散落文档|广告平台数据 \+ MMP \+ BI \+ SDK 日志 \+ 审核政策 \+ 内部 SOP \+ 历史工单|
|用户体验|嵌在 AppsFlyer dashboard 内，适合数据分析人员|嵌在 Optmyzr 工作流内，适合 PPC 专家|分散、靠人工沟通|嵌入飞书/Slack/工单/广告后台，面向 AM、AdOps、UA、技术支持|
|输出形式|数据答案、图表摘要、趋势解释、下一步建议|cause chart、root cause、优化建议、可视化、策略|截图、聊天记录、人工总结|可能原因排序、证据、排查步骤、客户话术、是否升级人工|
|定价策略|未见统一公开 AI Assistant 单独价格，通常随平台商业方案|SaaS 订阅，公开起价 €209/月|人力成本、沟通成本、机会成本|可采用内部 SaaS seat \+ 数据连接器 \+ AI 调用量；也可作为广告平台内部工具|
|独特优势|MMP 数据上下文|PPC 根因分析和优化自动化|人类经验灵活|垂直融合“广告数据诊断 \+ 归因/SDK/审核知识 \+ 客户服务话术 \+ 工单升级”|
|最大短板|受限于 AppsFlyer 生态|偏 PPC，不覆盖完整移动广告排障|低效、不稳定、难沉淀|冷启动需要构建高质量知识库和数据连接，权限治理要求高|

### 差异化策略

> 基于以上矩阵，总结市场空白点，并清晰定义我们产品的独特价值和差异化竞争策略。

- **市场空白/痛点**：

当前市场上已经出现三类能力：

```Plain Text
1. MMP 平台内 AI：懂归因和营销数据，但不覆盖完整广告运营流转。
2. PPC 优化 AI：懂广告账户和指标变化，但偏搜索/PPC，不懂移动 App 归因、SDK、OEM 和素材审核。
3. 客服/工单 AI：懂服务流程和客户回复，但不懂广告投放、MMP、BI、SDK、平台政策。
```

真正的空白是：**面向移动互联网广告行业的垂直 AdOps 排障 Copilot**。它需要同时懂：

```Plain Text
广告指标：CPM、CTR、CPC、CPI、CPA、ROAS、LTV
投放链路：Campaign、Creative、Placement、Geo、OS、Budget、Bid
归因链路：MMP、SKAN、SAN、postback、event mapping、attribution window
技术链路：SDK request、fill、show、click、callback、error code
审核链路：行业限制、素材违规、落地页一致性、资质要求
服务链路：客户问题、内部SOP、历史工单、升级流程、回复话术
```

- **我们的差异化策略**：

    - **技术差异化：广告排障专用 Agent 架构**

    我们不做通用客服机器人，而是设计广告排障专用工作流：

    ```Plain Text
    问题意图识别
    → 缺失字段追问
    → RAG 检索内部 SOP / MMP 文档 / SDK 文档 / 审核政策 / 历史工单
    → 数据查询 Agent 调用广告后台 / MMP / BI / 日志
    → 广告指标链路拆解
    → 可能原因排序
    → 证据引用
    → 客户回复生成
    → 高风险问题转人工
    → 结果沉淀案例库
    ```

    - **场景差异化：深耕移动互联网广告全链路**

    相比 AppsFlyer 的 MMP 内分析、Optmyzr 的 PPC 优化、Zendesk 的泛客服，我们聚焦移动互联网广告运营排障，覆盖以下高频问题：

    ```Plain Text
    投放异常：消耗掉、CPA升、CPI升、ROAS降
    归因异常：平台/MMP/BI数据不一致
    SDK异常：有请求无填充、有填充无展示、点击不上报
    审核异常：素材拒审、行业限制、落地页不一致
    客户沟通：如何解释、如何要补充信息、如何升级技术
    ```

    - **体验差异化：我们将AI功能以悬浮icon与弹窗的形式集成到广告后台，使用方便快捷**

    - **输出差异化：同时服务内部排障和外部客户回复**

    竞品常常只输出数据答案或客服回复。我们应输出双层答案：

    ```Plain Text
    内部诊断版：可能原因、证据、数据路径、排查步骤、升级对象
    客户回复版：专业、稳妥、可发给客户的话术
    ```

    - **商业模式差异化：作为广告平台客户服务能力，提升客户成功效率和续费率**

