import fs from "node:fs";
import path from "node:path";

const outDir = path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, "$1");

function esc(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/\n/g, "&#xa;");
}

function style(parts) {
  return parts.filter(Boolean).join(";");
}

const colors = {
  blue: ["#EFF8FF", "#2E90FA"],
  cyan: ["#ECFEFF", "#06B6D4"],
  green: ["#ECFDF3", "#22C55E"],
  orange: ["#FFF7ED", "#F97316"],
  purple: ["#F5F3FF", "#8B5CF6"],
  red: ["#FEF3F2", "#F04438"],
  yellow: ["#FFFBEB", "#F59E0B"],
  gray: ["#F8FAFC", "#64748B"],
};

function boxStyle(colorKey, extra = "") {
  const [fill, stroke] = colors[colorKey] || colors.gray;
  return style([
    "rounded=1",
    "whiteSpace=wrap",
    "html=1",
    `fillColor=${fill}`,
    `strokeColor=${stroke}`,
    "fontColor=#101828",
    "fontSize=13",
    "fontStyle=1",
    "spacing=8",
    "shadow=1",
    extra,
  ]);
}

function laneStyle(colorKey) {
  const [fill, stroke] = colors[colorKey] || colors.gray;
  return style([
    "swimlane",
    "html=1",
    "startSize=34",
    "horizontal=1",
    "rounded=1",
    "collapsible=0",
    `fillColor=${fill}`,
    `strokeColor=${stroke}`,
    "fontStyle=1",
    "fontSize=15",
    "fontColor=#101828",
    "container=1",
    "recursiveResize=0",
  ]);
}

function text(id, value, x, y, w, h, size = 14, color = "#475467", bold = false) {
  return `<mxCell id="${id}" value="${esc(value)}" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontSize=${size};fontColor=${color};fontStyle=${bold ? 1 : 0};" vertex="1" parent="1"><mxGeometry x="${x}" y="${y}" width="${w}" height="${h}" as="geometry" /></mxCell>`;
}

function vertex(id, value, x, y, w, h, colorKey, parent = "1", extra = "") {
  return `<mxCell id="${id}" value="${esc(value)}" style="${boxStyle(colorKey, extra)}" vertex="1" parent="${parent}"><mxGeometry x="${x}" y="${y}" width="${w}" height="${h}" as="geometry" /></mxCell>`;
}

function lane(id, value, x, y, w, h, colorKey) {
  return `<mxCell id="${id}" value="${esc(value)}" style="${laneStyle(colorKey)}" vertex="1" parent="1"><mxGeometry x="${x}" y="${y}" width="${w}" height="${h}" as="geometry" /></mxCell>`;
}

function edge(id, source, target, label = "", color = "#344054", dashed = false, points = [], extra = "") {
  const pointXml = points.length
    ? `<Array as="points">${points.map(([x, y]) => `<mxPoint x="${x}" y="${y}" />`).join("")}</Array>`
    : "";
  return `<mxCell id="${id}" value="${esc(label)}" style="${style([
    "edgeStyle=orthogonalEdgeStyle",
    "rounded=1",
    "orthogonalLoop=1",
    "jettySize=auto",
    "html=1",
    `strokeColor=${color}`,
    "endArrow=block",
    "endFill=1",
    dashed ? "dashed=1" : "",
    "fontColor=#344054",
    "fontSize=12",
    extra,
  ])}" edge="1" parent="1" source="${source}" target="${target}"><mxGeometry relative="1" as="geometry">${pointXml}</mxGeometry></mxCell>`;
}

function diagram(name, width, height, cells) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="drawio" version="30.2.4">
  <diagram name="${esc(name)}">
    <mxGraphModel dx="${width}" dy="${height}" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="${width}" pageHeight="${height}" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
        ${cells.join("\n        ")}
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
`;
}

function write(name, xml) {
  fs.writeFileSync(path.join(outDir, name), xml, "utf8");
}

write("adops_attribution_workflow.drawio", diagram("端到端业务流程", 1680, 900, [
  text("t1", "AdOps Copilot 投放归因排障端到端业务流程", 40, 24, 900, 40, 26, "#101828", true),
  text("t2", "更新后流程强调：固定 workflow + 规则层负责稳定性；LLM 只用于路由候选、Query 改写、证据解释、知识回答和安全表达整理。", 40, 66, 1260, 30, 14),
  lane("l1", "入口与总控：确定性前置 + LLM 路由候选", 40, 110, 1600, 170, "blue"),
  lane("l2", "Workflow 执行：固定核查清单 + RAG/工具信息供给", 40, 310, 1600, 230, "orange"),
  lane("l3", "诊断交付与治理：规则安全检查 + 离线评测回流", 40, 570, 1600, 240, "purple"),
  vertex("n1", "用户问题\nMMP installs 低于平台", 80, 58, 190, 64, "blue", "l1"),
  vertex("n2", "session_init\ntrace + 页面上下文", 310, 58, 190, 64, "cyan", "l1"),
  vertex("n3", "pre_guard\n登录态 / 权限前置", 540, 58, 190, 64, "cyan", "l1"),
  vertex("n4", "LLM route candidate\nintent / entities / risk_signals", 770, 48, 230, 84, "green", "l1"),
  vertex("n5", "schema_guard\nJSON / enum / tool 白名单", 1040, 58, 210, 64, "yellow", "l1"),
  vertex("n6", "rule_normalizer\nrisk_final / confidence_final", 1290, 58, 230, 64, "yellow", "l1"),
  vertex("n7", "workflow_dispatcher\n选择固定 workflow", 80, 70, 210, 68, "yellow", "l2"),
  vertex("n8", "固定核查清单\n时区 / 窗口 / event / postback", 330, 70, 240, 68, "orange", "l2"),
  vertex("n9", "RAG Query 改写 LLM\n中英 query + 实体过滤", 610, 58, 240, 84, "green", "l2"),
  vertex("n10", "RAG 检索 + Rerank\nSOP / 口径 / 历史案例", 890, 70, 240, 68, "orange", "l2"),
  vertex("n11", "只读工具查询\n平台报表 / MMP / Postback", 1170, 70, 250, 68, "orange", "l2"),
  vertex("n12", "Evidence Builder\n引用与工具结果归一", 680, 160, 260, 60, "yellow", "l2"),
  vertex("n13", "场景诊断 LLM\n原因排序 / 已排除项 / next actions", 80, 70, 260, 78, "green", "l3"),
  vertex("n14", "delivery_guard 规则\n越权 / 敏感字段 / 无证据强答", 390, 70, 260, 78, "red", "l3"),
  vertex("n15", "安全交付整理 LLM\n内部摘要 / 脱敏表达", 700, 70, 250, 78, "green", "l3"),
  vertex("n16", "诊断卡展示\n采纳 / 追问 / 升级", 1000, 70, 230, 78, "blue", "l3"),
  vertex("n17", "反馈与 Badcase\n知识 / Prompt / 工具回流", 1280, 70, 250, 78, "purple", "l3"),
  vertex("n18", "Judge AI 离线评测\n灰度 / 回归 / 抽检", 1280, 160, 250, 60, "purple", "l3"),
  edge("e1", "n1", "n2"),
  edge("e2", "n2", "n3"),
  edge("e3", "n3", "n4"),
  edge("e4", "n4", "n5"),
  edge("e5", "n5", "n6"),
  edge("e6", "n6", "n7", "routing_final", "#344054", false, [[1535, 260], [120, 300]]),
  edge("e7", "n7", "n8"),
  edge("e8", "n8", "n9"),
  edge("e9", "n9", "n10"),
  edge("e10", "n9", "n11", "工具计划", "#EA580C", false, [[730, 335], [1295, 335]]),
  edge("e11", "n10", "n12", "引用", "#EA580C"),
  edge("e12", "n11", "n12", "工具结果", "#EA580C"),
  edge("e13", "n12", "n13", "evidence objects", "#16A34A", false, [[700, 540], [120, 560]]),
  edge("e14", "n13", "n14", "诊断草稿", "#16A34A"),
  edge("e15", "n14", "n15", "guard_decision", "#DC2626"),
  edge("e16", "n15", "n16"),
  edge("e17", "n16", "n17", "feedback", "#7C3AED", true),
  edge("e18", "n17", "n18", "offline", "#7C3AED", true),
]));

write("adops_attribution_swimlane.drawio", diagram("端到端泳道图", 1800, 1180, [
  text("t1", "AdOps Copilot 投放归因排障端到端泳道图", 40, 24, 900, 40, 28, "#101828", true),
  text("t2", "在线链路：用户提问 → 总控确定性前置 → LLM 路由候选 → 规则复算 → 固定 workflow → 场景诊断 → 安全交付。离线链路：反馈、Badcase、Judge AI 和版本回流。", 40, 68, 1460, 34, 14),
  lane("u", "用户 / AM / AdOps", 40, 120, 1720, 130, "blue"),
  lane("c", "Copilot 总控与规则层", 40, 270, 1720, 190, "cyan"),
  lane("s", "场景智能体与固定 workflow", 40, 480, 1720, 170, "green"),
  lane("d", "RAG、数据工具与证据系统", 40, 670, 1720, 250, "orange"),
  lane("g", "知识运营 / 评测后台", 40, 940, 1720, 180, "purple"),
  vertex("u1", "提出问题\nMMP installs 低于平台 28%", 110, 48, 230, 62, "blue", "u"),
  vertex("u2", "查看诊断卡\n采纳 / 追问 / 升级", 1370, 48, 230, 62, "blue", "u"),
  vertex("c1", "创建会话\ntrace + page context", 90, 58, 180, 60, "cyan", "c"),
  vertex("c2", "pre_guard\n登录态 / RBAC / 敏感词", 310, 58, 190, 60, "cyan", "c"),
  vertex("c3", "LLM 路由候选\nintent / entities / risk_signals", 540, 48, 230, 80, "green", "c"),
  vertex("c4", "schema_guard\nJSON / enum / tool schema", 810, 58, 210, 60, "yellow", "c"),
  vertex("c5", "rule_normalizer\nrisk_final / confidence_final", 1060, 58, 230, 60, "yellow", "c"),
  vertex("c6", "workflow_dispatcher\n下发范围和工具约束", 1330, 58, 230, 60, "yellow", "c"),
  vertex("c7", "delivery_guard\n规则拦截 + 脱敏决策", 1330, 128, 230, 50, "red", "c"),
  vertex("s1", "加载固定归因 workflow\n8 个必查项", 420, 54, 250, 66, "green", "s"),
  vertex("s2", "场景诊断 LLM\n基于证据解释与排序", 1080, 54, 270, 66, "green", "s"),
  vertex("d1", "RAG Query 改写 LLM\nsemantic/entity/checklist query", 290, 48, 260, 66, "green", "d"),
  vertex("d2", "知识检索 + Rerank\nSOP / 口径 / 历史案例", 70, 138, 230, 58, "orange", "d"),
  vertex("d3", "平台报表工具\nplatform installs=1250", 350, 138, 230, 58, "orange", "d"),
  vertex("d4", "MMP 归因报表\nmmp installs=900", 630, 138, 230, 58, "orange", "d"),
  vertex("d5", "Postback 摘要\nsuccess=92.4% / delay=6.8%", 910, 138, 250, 58, "orange", "d"),
  vertex("d6", "Evidence Builder\n统一 evidence_id / 来源 / 可见性", 1220, 118, 310, 70, "yellow", "d"),
  vertex("g1", "Badcase 记录\n无效 / 漏项 / 检索错 / 数据错", 1320, 48, 250, 60, "purple", "g"),
  vertex("g2", "Judge AI 离线评测\n灰度 / 回归 / 抽检", 1010, 48, 240, 60, "purple", "g"),
  vertex("g3", "知识与评测回流\nSOP / Golden Set / Chunk", 700, 48, 250, 60, "purple", "g"),
  vertex("g4", "Prompt / 工具 / 规则更新\n版本 / 灰度 / 回滚", 390, 48, 250, 60, "purple", "g"),
  text("g5", "Judge AI 不在正常在线链路中逐次拦截，只用于抽检、回归和版本治理。", 80, 130, 760, 26, 13, "#7C3AED", true),
  edge("e1", "u1", "c1"),
  edge("e2", "c1", "c2"),
  edge("e3", "c2", "c3"),
  edge("e4", "c3", "c4"),
  edge("e5", "c4", "c5"),
  edge("e6", "c5", "c6"),
  edge("e7", "c6", "s1", "固定 workflow", "#16A34A"),
  edge("e8", "s1", "d1", "证据需求", "#EA580C"),
  edge("e9", "d1", "d2", "query", "#EA580C", false, [[170, 735], [170, 820]]),
  edge("e10", "d1", "d3", "工具参数", "#EA580C"),
  edge("e11", "d1", "d4", "工具参数", "#EA580C"),
  edge("e12", "d1", "d5", "工具参数", "#EA580C"),
  edge("e13", "d2", "d6", "引用", "#EA580C"),
  edge("e14", "d3", "d6", "报表", "#EA580C"),
  edge("e15", "d4", "d6", "MMP", "#EA580C"),
  edge("e16", "d5", "d6", "postback", "#EA580C"),
  edge("e17", "d6", "s2", "证据对象返回", "#16A34A"),
  edge("e18", "s2", "c7", "诊断草稿", "#16A34A"),
  edge("e19", "c7", "u2", "安全交付", "#2563EB"),
  edge("e20", "u2", "g1", "反馈 / Badcase", "#7C3AED", true, [[1710, 185], [1710, 960]]),
  edge("e21", "g1", "g2", "", "#7C3AED", true),
  edge("e22", "g2", "g3", "", "#7C3AED", true),
  edge("e23", "g3", "g4", "", "#7C3AED", true),
]));

write("adops_attribution_case_flow.drawio", diagram("真实案例流程", 1600, 860, [
  text("t1", "真实案例：MMP installs 比平台低 28% 的端到端排障", 40, 24, 900, 40, 26, "#101828", true),
  text("t2", "展示单个问题如何经过路由、规则复算、固定归因 workflow、RAG/工具取数、证据对象、诊断和人工确认。", 40, 66, 1200, 30, 14),
  vertex("n1", "1. 用户提问\nClient says MMP installs are 28% lower", 70, 130, 240, 74, "blue"),
  vertex("n2", "2. 总控路由候选 LLM\nintent=attribution_discrepancy_check", 360, 120, 270, 94, "green"),
  vertex("n3", "3. Schema + 规则复算\nrisk=medium / confidence_final", 680, 120, 270, 94, "yellow"),
  vertex("n4", "4. 固定归因 workflow\n时区 / 窗口 / event / postback", 1000, 120, 270, 94, "orange"),
  vertex("n5", "5. RAG Query 改写\n中英 query + source_type 过滤", 210, 300, 270, 76, "green"),
  vertex("n6", "6. 只读工具查询\n平台=1250 / MMP=900 / Postback", 540, 300, 300, 76, "orange"),
  vertex("n7", "7. Evidence Builder\nev_metric / ev_policy / ev_postback", 900, 300, 310, 76, "yellow"),
  vertex("n8", "8. 归因诊断 LLM\n原因排序 + 已排除项 + follow-up", 400, 500, 320, 86, "green"),
  vertex("n9", "9. Delivery Guard\n脱敏 / 无证据强答 / 人工确认", 780, 500, 320, 86, "red"),
  vertex("n10", "10. 内部诊断卡\n不生成客户可直接发送回复", 1160, 500, 300, 86, "blue"),
  vertex("n11", "11. 用户反馈\n采纳 / 追问 / 升级", 760, 690, 260, 70, "purple"),
  vertex("n12", "12. 离线治理\nBadcase + Judge AI + Prompt/知识回流", 1080, 690, 330, 70, "purple"),
  edge("e1", "n1", "n2"),
  edge("e2", "n2", "n3"),
  edge("e3", "n3", "n4"),
  edge("e4", "n4", "n5", "证据需求", "#EA580C", false, [[1130, 250], [345, 250]]),
  edge("e5", "n5", "n6"),
  edge("e6", "n6", "n7"),
  edge("e7", "n7", "n8", "evidence objects", "#16A34A", false, [[1050, 430], [560, 430]]),
  edge("e8", "n8", "n9"),
  edge("e9", "n9", "n10"),
  edge("e10", "n10", "n11", "人工确认", "#7C3AED", true, [[1310, 650], [890, 650]]),
  edge("e11", "n11", "n12", "Badcase", "#7C3AED", true),
]));

write("adops_attribution_architecture.drawio", diagram("系统架构", 1680, 980, [
  text("t1", "AdOps Copilot 投放归因排障系统架构", 40, 24, 900, 40, 26, "#101828", true),
  text("t2", "架构把 LLM 能力、规则引擎、工具网关、RAG 和评测治理拆成可替换、可审计的工程组件。", 40, 66, 1280, 30, 14),
  lane("l1", "英文业务前台", 40, 120, 1600, 130, "blue"),
  lane("l2", "AI 工作流中台", 40, 280, 1600, 250, "cyan"),
  lane("l3", "数据、RAG 与工具层", 40, 560, 1600, 210, "orange"),
  lane("l4", "治理与运营后台", 40, 800, 1600, 130, "purple"),
  vertex("f1", "Copilot Chat\nCampaign 侧边栏", 100, 50, 230, 58, "blue", "l1"),
  vertex("f2", "诊断结果卡\n归因核查卡", 430, 50, 230, 58, "blue", "l1"),
  vertex("f3", "证据引用卡\n用户反馈入口", 760, 50, 230, 58, "blue", "l1"),
  vertex("m1", "Prompt Runner\n变量渲染 + trace", 70, 55, 210, 66, "cyan", "l2"),
  vertex("m2", "Model Router\nQwen / DeepSeek / GLM", 320, 55, 220, 66, "green", "l2"),
  vertex("m3", "总控 Workflow\nsession / pre_guard / route", 580, 45, 240, 86, "cyan", "l2"),
  vertex("m4", "Schema Guard\nJSON / enum / tool schema", 860, 55, 230, 66, "yellow", "l2"),
  vertex("m5", "Rule Engine\nrisk_final / confidence_final", 1130, 55, 240, 66, "yellow", "l2"),
  vertex("m6", "Workflow Dispatcher\n固定场景流转", 70, 155, 230, 66, "yellow", "l2"),
  vertex("m7", "场景智能体\n投放诊断 / 归因核对 / 知识回答", 340, 145, 300, 86, "green", "l2"),
  vertex("m8", "Delivery Guard\n规则拦截 + 安全交付整理", 700, 145, 300, 86, "red", "l2"),
  vertex("m9", "Trace / Cost / Audit\n模型、Prompt、工具版本", 1060, 155, 300, 66, "gray", "l2"),
  vertex("d1", "RAG Query Rewrite\n中英 query / entity filters", 80, 58, 260, 66, "green", "l3"),
  vertex("d2", "Hybrid Search + Rerank\nBM25 / bge-m3 / gte-rerank", 390, 58, 300, 66, "orange", "l3"),
  vertex("d3", "Tool Gateway\n报表 / MMP / Postback 只读工具", 740, 58, 300, 66, "orange", "l3"),
  vertex("d4", "Evidence Store\n统一 evidence object", 1090, 58, 260, 66, "yellow", "l3"),
  vertex("d5", "权限与数据边界\nRBAC / ABAC / 字段脱敏", 1390, 58, 170, 66, "red", "l3"),
  vertex("g1", "知识库管理\nSOP / 口径 / Chunk", 100, 48, 240, 58, "purple", "l4"),
  vertex("g2", "Prompt 管理\n变量 / Schema / 版本", 420, 48, 240, 58, "purple", "l4"),
  vertex("g3", "Badcase 管理\n分类 / Owner / 修复", 740, 48, 240, 58, "purple", "l4"),
  vertex("g4", "评测后台 + Judge AI\n黄金集 / 灰度 / 回归", 1060, 48, 270, 58, "purple", "l4"),
  edge("e1", "f1", "m1", "", "#2563EB"),
  edge("e2", "m1", "m2"),
  edge("e3", "m2", "m3"),
  edge("e4", "m3", "m4"),
  edge("e5", "m4", "m5"),
  edge("e6", "m5", "m6"),
  edge("e7", "m6", "m7"),
  edge("e8", "m7", "d1", "检索计划", "#EA580C"),
  edge("e9", "m7", "d3", "工具计划", "#EA580C", false, [[490, 540], [890, 540]]),
  edge("e10", "d1", "d2"),
  edge("e11", "d2", "d4", "citations", "#EA580C"),
  edge("e12", "d3", "d4", "tool results", "#EA580C"),
  edge("e13", "d4", "m7", "evidence", "#16A34A"),
  edge("e14", "m7", "m8", "诊断草稿"),
  edge("e15", "m8", "f2", "安全交付", "#2563EB"),
  edge("e16", "f3", "g3", "", "#7C3AED", true, [[1630, 190], [1630, 930], [860, 930]]),
  edge("e17", "g3", "g4", "", "#7C3AED", true),
  edge("e18", "g4", "g2", "Prompt 回归", "#7C3AED", true),
  edge("e19", "g1", "d2", "知识入库", "#7C3AED", true),
]));

write("adops_attribution_state_machine.drawio", diagram("智能体状态机", 1520, 860, [
  text("t1", "AdOps Copilot 智能体状态机", 40, 24, 760, 40, 26, "#101828", true),
  text("t2", "状态机约束 Agent 不能自由跳步：权限、Schema、规则复算、工具查询、证据归一和安全交付都必须显式经过。", 40, 66, 1240, 30, 14),
  vertex("s1", "已接收\ntrace + context", 70, 130, 180, 64, "blue"),
  vertex("s2", "前置权限检查\npre_guard", 300, 130, 180, 64, "cyan"),
  vertex("s3", "LLM 路由候选\nintent/entities", 530, 130, 190, 64, "green"),
  vertex("s4", "Schema Guard\nJSON/enum/tool", 770, 130, 190, 64, "yellow"),
  vertex("s5", "规则归一\nrisk/confidence/action", 1010, 130, 210, 64, "yellow"),
  vertex("s6", "Workflow 分发\n固定场景", 1260, 130, 180, 64, "orange"),
  vertex("s7", "待用户补充", 180, 330, 180, 64, "yellow"),
  vertex("s8", "权限拒绝 / 范围外", 420, 330, 190, 64, "red"),
  vertex("s9", "证据计划生成\n固定核查清单", 660, 330, 210, 64, "orange"),
  vertex("s10", "RAG/工具执行中\nQuery 改写 + 只读查询", 920, 330, 240, 64, "orange"),
  vertex("s11", "证据汇总中\nEvidence Builder", 1210, 330, 210, 64, "yellow"),
  vertex("s12", "诊断生成中\n场景 LLM", 300, 540, 190, 64, "green"),
  vertex("s13", "安全检查中\ndelivery_guard", 540, 540, 190, 64, "red"),
  vertex("s14", "可交付\n内部诊断卡", 780, 540, 190, 64, "blue"),
  vertex("s15", "人工审核", 780, 650, 190, 64, "yellow"),
  vertex("s16", "已反馈", 1260, 540, 180, 64, "purple"),
  vertex("s17", "Badcase 回流\n知识/Prompt/评测", 970, 710, 240, 64, "purple"),
  vertex("s18", "Judge AI 离线评测\n不阻塞在线回答", 1240, 710, 240, 64, "purple"),
  edge("e1", "s1", "s2"),
  edge("e2", "s2", "s3"),
  edge("e3", "s3", "s4"),
  edge("e4", "s4", "s5"),
  edge("e5", "s5", "s6"),
  edge("e6", "s5", "s7", "缺字段", "#F59E0B", false, [[1115, 250], [270, 250]]),
  edge("e7", "s5", "s8", "高风险/越权", "#DC2626", false, [[1115, 280], [515, 280]]),
  edge("e8", "s6", "s9"),
  edge("e9", "s9", "s10"),
  edge("e10", "s10", "s11"),
  edge("e11", "s11", "s12", "evidence", "#16A34A", false, [[1315, 470], [395, 470]]),
  edge("e12", "s12", "s13"),
  edge("e13", "s13", "s14"),
  edge("e14", "s13", "s15", "需人工", "#F59E0B", false, [[635, 650]]),
  edge("e15", "s14", "s16"),
  edge("e16", "s15", "s14", "确认后", "#F59E0B"),
  edge("e17", "s16", "s17", "无效/漏项", "#7C3AED", true, [[1350, 680], [1090, 680]]),
  edge("e18", "s17", "s18", "", "#7C3AED", true),
]));
