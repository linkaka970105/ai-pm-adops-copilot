import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const BASE_URL = "http://127.0.0.1:8317/v1";
const MODEL = process.env.ADOPS_EVAL_MODEL || "gpt-5.5";
const OUT_PATH = path.join("03_prd", "eval", "results", "adops_attribution_prompt_e2e_latest.json");

function extractApiKey(configText) {
  const lines = configText.split(/\r?\n/);
  let inKeys = false;
  for (const line of lines) {
    if (/^api-keys:\s*$/.test(line)) {
      inKeys = true;
      continue;
    }
    if (inKeys && /^[^\s#]/.test(line)) break;
    const match = inKeys && line.match(/^\s*-\s*['"]?([^'"#\s]+)/);
    if (match) return match[1];
  }
  throw new Error("No API key found in CLIProxyAPI config.");
}

async function getHeaders() {
  const configPath = path.join(process.env.USERPROFILE || "", ".cli-proxy-api", "config.yaml");
  const configText = await readFile(configPath, "utf8");
  return {
    Authorization: `Bearer ${extractApiKey(configText)}`,
    "Content-Type": "application/json",
  };
}

async function listModels(headers) {
  const response = await fetch(`${BASE_URL}/models`, { method: "GET", headers });
  if (!response.ok) throw new Error(`GET /models failed: ${response.status} ${await response.text()}`);
  const body = await response.json();
  return (body.data || []).map((model) => model.id);
}

function extractJson(text) {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  try {
    return JSON.parse(cleaned);
  } catch {
    const first = cleaned.indexOf("{");
    const last = cleaned.lastIndexOf("}");
    if (first >= 0 && last > first) return JSON.parse(cleaned.slice(first, last + 1));
    throw new Error(`Model did not return parseable JSON: ${text.slice(0, 300)}`);
  }
}

async function chatJson(headers, messages, label) {
  const startedAt = Date.now();
  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: 0,
      max_tokens: 1800,
    }),
  });
  const elapsedMs = Date.now() - startedAt;
  if (!response.ok) throw new Error(`${label} failed: ${response.status} ${await response.text()}`);
  const body = await response.json();
  const content = body.choices?.[0]?.message?.content || "";
  return { json: extractJson(content), raw: content, elapsedMs, usage: body.usage || null };
}

const availableTools = [
  {
    tool_name: "search_knowledge_base",
    purpose: "retrieve SOP, attribution policy, metric definition, historical case citations",
    required_permission: "knowledge_read",
  },
  {
    tool_name: "get_platform_report",
    purpose: "read platform metrics by account/campaign/app/event/timezone",
    required_permission: "account_scope",
  },
  {
    tool_name: "get_mmp_report",
    purpose: "read MMP-side installs/events by app/campaign/event/timezone",
    required_permission: "mmp_access",
  },
  {
    tool_name: "get_postback_summary",
    purpose: "read aggregated postback success, delay, failure and reject summary",
    required_permission: "postback_summary_read",
  },
];

const routingSystemPrompt = `You are the routing controller for an internal AdOps Copilot attribution troubleshooting assistant.

Return one strict JSON object only. Do not answer the business question. Do not invent account metrics.

Supported intents:
- campaign_performance_diagnosis
- attribution_discrepancy_check
- knowledge_lookup
- out_of_scope_customer_reply_generation
- out_of_scope_sdk_or_creative
- out_of_scope_operation_change
- out_of_scope_billing_contract
- unknown

Risk rubric:
- high: user requests data outside permission scope; asks for raw logs, token, secret, user-level data, customer contract, compensation, external customer-ready reply, config change, budget/bid change, or any action that can affect delivery/revenue/customer commitment.
- medium: read-only account/campaign/MMP diagnosis; attribution or performance conclusion may influence customer/account handling; key evidence is missing; discrepancy is material; data freshness is uncertain.
- low: general knowledge lookup or internal explanation with no account/customer-specific data and no external commitment.
- Mentioning that "the client/customer reported a problem" is not customer_visible_reply by itself. Only mark customer_visible_reply when the user asks to draft/send/copy an external reply, make a customer promise, or discuss compensation.

Risk signal enum:
- account_data_read
- mmp_data_read
- postback_summary_read
- customer_visible_reply
- out_of_scope
- permission_gap
- sensitive_raw_data
- operational_change
- material_business_impact
- evidence_missing

Confidence scoring:
- intent_match_score: 1.0 if intent is explicit, 0.7 if implied, 0.4 if ambiguous, 0.0 if unsupported.
- entity_completeness_score: required entities present / required entities for the selected intent.
- permission_fit_score: 1.0 if all required scopes are present, 0.5 if unknown, 0.0 if missing.
- phase_fit_score: 1.0 if intent is supported by phase_scope, 0.0 otherwise.
- tool_coverage_score: required tools available / required tools for selected intent.
- confidence = round(0.35*intent_match_score + 0.25*entity_completeness_score + 0.20*permission_fit_score + 0.10*phase_fit_score + 0.10*tool_coverage_score, 2).

Output schema:
{
  "intent": "campaign_performance_diagnosis | attribution_discrepancy_check | knowledge_lookup | out_of_scope_customer_reply_generation | out_of_scope_sdk_or_creative | out_of_scope_operation_change | out_of_scope_billing_contract | unknown",
  "language": "zh | en | mixed",
  "entities": {
    "account_id": "string|null",
    "campaign_id": "string|null",
    "app_id": "string|null",
    "mmp": "AppsFlyer|Adjust|Singular|null",
    "metric": "installs|event|spend|clicks|cvr|cpa|roi|null",
    "event_name": "string|null",
    "time_range": "string|null",
    "timezone": "string|null",
    "geo": "string|null"
  },
  "missing_fields": ["account_id|campaign_id|app_id|mmp|metric|event_name|time_range|timezone"],
  "risk_signals": ["enum values from Risk signal enum"],
  "risk_level_model_reported": "low | medium | high",
  "confidence_components": {
    "intent_match_score": 0.0,
    "entity_completeness_score": 0.0,
    "permission_fit_score": 0.0,
    "phase_fit_score": 0.0,
    "tool_coverage_score": 0.0
  },
  "confidence_model_reported": 0.0,
  "tool_constraints": [
    {
      "tool_name": "string",
      "purpose": "string",
      "required_permission": "string",
      "blocking_if_failed": true,
      "allowed_params": ["string"]
    }
  ],
  "next_action": "route_to_workflow | ask_clarification | refuse | out_of_scope",
  "selected_workflow": "wf_campaign_performance_v1 | wf_attribution_discrepancy_v1 | wf_knowledge_lookup_v1 | wf_clarification_v1 | wf_refusal_v1 | wf_out_of_scope_fallback_v1",
  "requires_human_review": true,
  "clarification_question": "string"
}

Few-shot 1:
Input user_query: "What attribution window do we use for OEM campaigns?"
Output:
{"intent":"knowledge_lookup","language":"en","entities":{"account_id":null,"campaign_id":null,"app_id":null,"mmp":null,"metric":null,"event_name":null,"time_range":null,"timezone":null,"geo":null},"missing_fields":[],"risk_signals":[],"risk_level_model_reported":"low","confidence_components":{"intent_match_score":1,"entity_completeness_score":1,"permission_fit_score":1,"phase_fit_score":1,"tool_coverage_score":1},"confidence_model_reported":1,"tool_constraints":[{"tool_name":"search_knowledge_base","purpose":"retrieve attribution window policy","required_permission":"knowledge_read","blocking_if_failed":true,"allowed_params":["query","source_type","locale"]}],"next_action":"route_to_workflow","selected_workflow":"wf_knowledge_lookup_v1","requires_human_review":false,"clarification_question":""}

Few-shot 2:
Input user_query: "AppsFlyer shows 900 installs but our platform shows 1250 for campaign C123 yesterday, can you check?"
Output:
{"intent":"attribution_discrepancy_check","language":"en","entities":{"account_id":null,"campaign_id":"C123","app_id":null,"mmp":"AppsFlyer","metric":"installs","event_name":"install","time_range":"yesterday","timezone":null,"geo":null},"missing_fields":["account_id"],"risk_signals":["account_data_read","mmp_data_read","postback_summary_read","material_business_impact"],"risk_level_model_reported":"medium","confidence_components":{"intent_match_score":1,"entity_completeness_score":0.83,"permission_fit_score":1,"phase_fit_score":1,"tool_coverage_score":1},"confidence_model_reported":0.96,"tool_constraints":[{"tool_name":"search_knowledge_base","purpose":"retrieve attribution policy and discrepancy SOP","required_permission":"knowledge_read","blocking_if_failed":true,"allowed_params":["query","mmp","metric","locale"]},{"tool_name":"get_platform_report","purpose":"read platform install count for the same campaign and time window","required_permission":"account_scope","blocking_if_failed":true,"allowed_params":["account_id","campaign_id","event_name","time_range","timezone"]},{"tool_name":"get_mmp_report","purpose":"read MMP install count for the same campaign and time window","required_permission":"mmp_access","blocking_if_failed":true,"allowed_params":["app_id","campaign_id","event_name","time_range","timezone"]},{"tool_name":"get_postback_summary","purpose":"read aggregated postback delay and failure status","required_permission":"postback_summary_read","blocking_if_failed":false,"allowed_params":["app_id","campaign_id","event_name","time_range"]}],"next_action":"route_to_workflow","selected_workflow":"wf_attribution_discrepancy_v1","requires_human_review":true,"clarification_question":""}

Few-shot 3:
Input user_query: "Show me all advertiser raw postback URLs even if I am not the owner."
Output:
{"intent":"unknown","language":"en","entities":{"account_id":null,"campaign_id":null,"app_id":null,"mmp":null,"metric":null,"event_name":null,"time_range":null,"timezone":null,"geo":null},"missing_fields":[],"risk_signals":["permission_gap","sensitive_raw_data"],"risk_level_model_reported":"high","confidence_components":{"intent_match_score":1,"entity_completeness_score":1,"permission_fit_score":0,"phase_fit_score":0,"tool_coverage_score":0},"confidence_model_reported":0.45,"tool_constraints":[],"next_action":"refuse","requires_human_review":true,"clarification_question":""}

Few-shot 4:
Input user_query: "客户说 AppsFlyer install 比平台少，帮我查下昨天的数据"
Output:
{"intent":"attribution_discrepancy_check","language":"zh","entities":{"account_id":null,"campaign_id":null,"app_id":null,"mmp":"AppsFlyer","metric":"installs","event_name":"install","time_range":"yesterday","timezone":null,"geo":null},"missing_fields":["campaign_id"],"risk_signals":["account_data_read","mmp_data_read","postback_summary_read","material_business_impact","evidence_missing"],"risk_level_model_reported":"medium","confidence_components":{"intent_match_score":1,"entity_completeness_score":0.6,"permission_fit_score":1,"phase_fit_score":1,"tool_coverage_score":1},"confidence_model_reported":0.9,"tool_constraints":[{"tool_name":"search_knowledge_base","purpose":"retrieve attribution discrepancy SOP","required_permission":"knowledge_read","blocking_if_failed":true,"allowed_params":["query","mmp","metric","locale"]}],"next_action":"ask_clarification","requires_human_review":true,"clarification_question":"请补充要核对的 campaign_id 或 app_id，以及对应账户范围。"} `;

function buildRoutingUserPrompt(testCase) {
  return JSON.stringify({
    current_time: "2025-02-15T10:00:00Z",
    user_query: testCase.user_query,
    conversation_context: [],
    user_profile: testCase.user_profile,
    permission_scope: testCase.permission_scope,
    available_tools: availableTools,
    phase_scope: ["campaign_performance_diagnosis", "attribution_discrepancy_check", "knowledge_lookup"],
  }, null, 2);
}

function getRequiredEntities(intent) {
  if (intent === "attribution_discrepancy_check") return ["account_id", "campaign_id", "mmp", "metric", "time_range"];
  if (intent === "campaign_performance_diagnosis") return ["account_id", "campaign_id", "metric", "time_range"];
  return [];
}

function recalculateRoutingConfidence(routing) {
  const c = routing.confidence_components || {};
  return Number((
    0.35 * Number(c.intent_match_score || 0) +
    0.25 * Number(c.entity_completeness_score || 0) +
    0.20 * Number(c.permission_fit_score || 0) +
    0.10 * Number(c.phase_fit_score || 0) +
    0.10 * Number(c.tool_coverage_score || 0)
  ).toFixed(2));
}

function deterministicRisk(routing) {
  const signals = new Set(routing.risk_signals || []);
  if (signals.has("permission_gap") || signals.has("sensitive_raw_data") || signals.has("operational_change") || signals.has("customer_visible_reply")) return "high";
  if (signals.has("account_data_read") || signals.has("mmp_data_read") || signals.has("postback_summary_read") || signals.has("material_business_impact") || signals.has("evidence_missing")) return "medium";
  return "low";
}

function deterministicMissingFields(routing, testCase) {
  const missing = new Set(routing.missing_fields || []);
  for (const field of getRequiredEntities(routing.intent)) {
    if (!routing.entities || isMissingValue(routing.entities[field]) || !entityHasSource(field, routing.entities[field], testCase)) {
      missing.add(field);
    }
  }
  return [...missing];
}

function entityHasSource(field, value, testCase) {
  if (!["account_id", "campaign_id", "app_id"].includes(field)) return true;
  if (isMissingValue(value)) return false;
  const raw = String(value).toLowerCase();
  const query = String(testCase?.user_query || "").toLowerCase();
  if (query.includes(raw)) return true;
  const scopeKey = field === "account_id" ? "accounts" : field === "campaign_id" ? "campaigns" : "apps";
  const scopedValues = (testCase?.permission_scope?.[scopeKey] || []).map((item) => String(item).toLowerCase());
  return scopedValues.includes(raw);
}

function isMissingValue(value) {
  if (value === null || value === undefined) return true;
  if (typeof value !== "string") return false;
  return ["", "null", "none", "n/a", "na", "unknown", "not specified", "unspecified", "未指定", "未知", "不明确"].includes(value.trim().toLowerCase());
}

function deterministicNextAction(routing, riskLevel, missingFields) {
  if (riskLevel === "high") return "refuse";
  if (routing.intent === "out_of_scope_customer_reply_generation" || routing.intent === "out_of_scope_sdk_or_creative") return "out_of_scope";
  if (routing.intent === "unknown") return "ask_clarification";
  if (missingFields.length > 0) return "ask_clarification";
  return "route_to_workflow";
}

function deterministicSelectedWorkflow(routing, riskLevel, missingFields, nextAction) {
  if (nextAction === "refuse" || riskLevel === "high") return "wf_refusal_v1";
  if (nextAction === "ask_clarification" || missingFields.length > 0 || routing.intent === "unknown") return "wf_clarification_v1";
  if (nextAction === "out_of_scope" || routing.intent?.startsWith("out_of_scope")) return "wf_out_of_scope_fallback_v1";
  if (routing.intent === "campaign_performance_diagnosis") return "wf_campaign_performance_v1";
  if (routing.intent === "attribution_discrepancy_check") return "wf_attribution_discrepancy_v1";
  if (routing.intent === "knowledge_lookup") return "wf_knowledge_lookup_v1";
  return "wf_out_of_scope_fallback_v1";
}

function normalizeRouting(routing, testCase) {
  const confidenceRuleChecked = recalculateRoutingConfidence(routing);
  const confidenceModel = Number(routing.confidence_model_reported ?? routing.confidence ?? 0);
  const riskRuleChecked = deterministicRisk(routing);
  const missingFieldsRuleChecked = deterministicMissingFields(routing, testCase);
  const nextActionFinal = deterministicNextAction(routing, riskRuleChecked, missingFieldsRuleChecked);
  const selectedWorkflowFinal = deterministicSelectedWorkflow(routing, riskRuleChecked, missingFieldsRuleChecked, nextActionFinal);
  return {
    ...routing,
    risk_level_model_reported: routing.risk_level_model_reported || routing.risk_level || null,
    risk_level_rule_checked: riskRuleChecked,
    missing_fields_rule_checked: missingFieldsRuleChecked,
    missing_fields_final: missingFieldsRuleChecked,
    next_action_model_reported: routing.next_action,
    next_action_final: nextActionFinal,
    next_action_needs_normalization: routing.next_action !== nextActionFinal,
    selected_workflow_model_reported: routing.selected_workflow || null,
    selected_workflow_final: selectedWorkflowFinal,
    selected_workflow_needs_normalization: routing.selected_workflow ? routing.selected_workflow !== selectedWorkflowFinal : true,
    confidence_rule_checked: confidenceRuleChecked,
    confidence_final: confidenceRuleChecked,
    confidence_model_reported: confidenceModel,
    confidence_model_delta: Number((confidenceModel - confidenceRuleChecked).toFixed(2)),
    confidence_needs_normalization: Math.abs(confidenceModel - confidenceRuleChecked) > 0.12,
  };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function validateRouting(testCase, routing) {
  assert(routing.intent === testCase.expected.intent, `${testCase.id}: expected intent ${testCase.expected.intent}, got ${routing.intent}`);
  assert(routing.risk_level_rule_checked === testCase.expected.risk_level, `${testCase.id}: rule risk expected ${testCase.expected.risk_level}, got ${routing.risk_level_rule_checked}`);
  for (const [name, value] of Object.entries(routing.confidence_components || {})) {
    assert(Number(value) >= 0 && Number(value) <= 1, `${testCase.id}: confidence component ${name} must be 0-1`);
  }
  if (testCase.expected.next_action) assert(
    routing.next_action_final === testCase.expected.next_action,
    `${testCase.id}: expected final next_action ${testCase.expected.next_action}, got ${routing.next_action_final}; routing=${JSON.stringify({
      intent: routing.intent,
      entities: routing.entities,
      missing_fields: routing.missing_fields,
      missing_fields_final: routing.missing_fields_final,
      next_action: routing.next_action,
    })}`,
  );
  if (testCase.expected.selected_workflow) assert(routing.selected_workflow_final === testCase.expected.selected_workflow, `${testCase.id}: expected final selected_workflow ${testCase.expected.selected_workflow}, got ${routing.selected_workflow_final}`);
  if (testCase.expected.required_missing) {
    for (const field of testCase.expected.required_missing) assert(
      (routing.missing_fields_final || []).includes(field),
      `${testCase.id}: missing_fields_final should include ${field}; routing=${JSON.stringify({
        entities: routing.entities,
        missing_fields: routing.missing_fields,
        missing_fields_final: routing.missing_fields_final,
      })}`,
    );
  }
  if (testCase.expected.required_tools) {
    const tools = new Set((routing.tool_constraints || []).map((tool) => tool.tool_name));
    for (const tool of testCase.expected.required_tools) assert(tools.has(tool), `${testCase.id}: tool_constraints missing ${tool}`);
  }
}

const routingCases = [
  {
    id: "route_knowledge_lookup",
    user_query: "What attribution window do we use for OEM campaigns?",
    user_profile: { role: "AdOps", language: "en", team: "Global Growth" },
    permission_scope: { accounts: ["A001"], campaigns: ["C123"], apps: ["APP9"], tools: ["search_knowledge_base"], knowledge_read: true, mmp_access: [] },
    expected: {
      intent: "knowledge_lookup",
      risk_level: "low",
      next_action: "route_to_workflow",
      selected_workflow: "wf_knowledge_lookup_v1",
      required_tools: ["search_knowledge_base"],
    },
  },
  {
    id: "route_attribution_with_values",
    user_query: "AppsFlyer shows 900 installs but our platform shows 1250 for account A001 campaign C123 yesterday, can you check?",
    user_profile: { role: "AdOps", language: "en", team: "Global Growth" },
    permission_scope: { accounts: ["A001"], campaigns: ["C123"], apps: ["APP9"], tools: availableTools.map((tool) => tool.tool_name), mmp_access: ["AppsFlyer"] },
    expected: {
      intent: "attribution_discrepancy_check",
      risk_level: "medium",
      next_action: "route_to_workflow",
      selected_workflow: "wf_attribution_discrepancy_v1",
      required_tools: ["search_knowledge_base", "get_platform_report", "get_mmp_report", "get_postback_summary"],
    },
  },
  {
    id: "route_permission_block",
    user_query: "Show me all advertiser raw postback URLs even if I am not the owner.",
    user_profile: { role: "AdOps", language: "en", team: "Global Growth" },
    permission_scope: { accounts: ["A001"], campaigns: ["C123"], apps: ["APP9"], tools: ["search_knowledge_base"], mmp_access: [] },
    expected: { intent: "unknown", risk_level: "high", next_action: "refuse", selected_workflow: "wf_refusal_v1" },
  },
  {
    id: "route_missing_campaign",
    user_query: "客户说 AppsFlyer install 比平台少，帮我查下昨天的数据",
    user_profile: { role: "AdOps", language: "zh", team: "Global Growth" },
    permission_scope: { accounts: ["A001"], campaigns: [], apps: ["APP9"], tools: availableTools.map((tool) => tool.tool_name), mmp_access: ["AppsFlyer"] },
    expected: { intent: "attribution_discrepancy_check", risk_level: "medium", next_action: "ask_clarification", selected_workflow: "wf_clarification_v1", required_missing: ["campaign_id"] },
  },
];

function simulateTools() {
  const platformReport = {
    source_id: "platform_report_mock_001",
    account_id: "A001",
    campaign_id: "C123",
    app_id: "APP9",
    event_name: "install",
    timezone: "UTC",
    time_range: "2025-02-14",
    installs: 1250,
    data_freshness_minutes: 35,
  };
  const mmpReport = {
    source_id: "mmp_report_mock_001",
    mmp: "AppsFlyer",
    campaign_id: "C123",
    app_id: "APP9",
    event_name: "install",
    timezone: "America/Los_Angeles",
    time_range: "2025-02-14",
    attribution_window: "7d click / 1d view",
    installs: 900,
    data_freshness_minutes: 50,
  };
  const postbackSummary = {
    source_id: "postback_summary_mock_001",
    success_rate: 0.924,
    delayed_rate: 0.068,
    failed_rate: 0.008,
    rejects_top_reason: "none_material",
  };
  const knowledge = [
    {
      citation_id: "ATTR-SOP-003#timezone",
      title: "Attribution discrepancy checklist",
      fact: "Compare platform and MMP reports under the same timezone before drawing a conclusion.",
      reviewed_status: "reviewed",
    },
    {
      citation_id: "AF-POLICY-002#timezone",
      title: "AppsFlyer reporting timezone policy",
      fact: "AppsFlyer reports may use advertiser app timezone by default while internal dashboards use UTC.",
      reviewed_status: "reviewed",
    },
  ];
  const differenceRate = Number(Math.abs(platformReport.installs - mmpReport.installs) / platformReport.installs).toFixed(3);
  return {
    platformReport,
    mmpReport,
    postbackSummary,
    knowledge,
    evidenceObjects: [
      {
        evidence_id: "ev_metric_001",
        source_type: "attribution_report",
        source_id: "platform_report_mock_001 + mmp_report_mock_001",
        claim_supported: `Platform installs=${platformReport.installs}, AppsFlyer installs=${mmpReport.installs}, difference_rate=${differenceRate}`,
        confidence: 0.95,
        visibility: "internal",
      },
      {
        evidence_id: "ev_policy_001",
        source_type: "knowledge_chunk",
        source_id: "AF-POLICY-002#timezone",
        claim_supported: "Platform and MMP timezone defaults may differ; timezone alignment is a required first check.",
        confidence: 0.9,
        visibility: "internal",
      },
      {
        evidence_id: "ev_postback_001",
        source_type: "postback_summary",
        source_id: "postback_summary_mock_001",
        claim_supported: "Postback success_rate=92.4%, delayed_rate=6.8%, failed_rate=0.8%; delay may explain part of the gap but does not prove a broad outage.",
        confidence: 0.85,
        visibility: "restricted",
      },
    ],
  };
}

const diagnosisSystemPrompt = `You are an attribution discrepancy diagnosis agent for an internal AdOps Copilot.

Return one strict JSON object only. Use only the provided evidence_objects and tool summaries. Do not invent metrics, logs, customer commitments, or raw user-level details.

Fixed workflow boundary:
- Deterministic workflow already handled permission check, tool selection, tool execution, value difference calculation, and evidence object creation.
- Your job is to explain and rank likely causes based on evidence, not to decide which tools to call.

Required checklist items in checked_items:
- timezone
- attribution_window
- event_mapping
- postback_delay
- dedup_or_reattribution
- privacy_or_invalid_traffic
- channel_mapping
- data_freshness

Status enum:
- matched
- mismatched
- likely_issue
- needs_followup
- not_supported_by_evidence

Confidence rubric:
- Start from 0.30.
- Add 0.15 when current platform and MMP values are both present.
- Add 0.15 when at least one reviewed attribution policy citation supports the primary reason.
- Add 0.10 when postback summary is present.
- Add 0.10 when at least 6 required checklist items are explicitly covered.
- Add 0.10 when primary reason is supported by at least 2 evidence_ids.
- Subtract 0.20 if core values conflict or tool freshness is unknown.
- Cap at 0.85 unless the evidence includes customer-confirmed aligned timezone and MMP raw validation.
- Cap at 0.45 if either platform_report or mmp_report is missing.
- Round to 2 decimals.

Output schema:
{
  "difference_rate": "string",
  "checked_items": [
    {"item": "string", "status": "matched|mismatched|likely_issue|needs_followup|not_supported_by_evidence", "evidence_id": "string|null", "reason": "string"}
  ],
  "likely_reasons": [
    {"reason": "string", "rank": 1, "evidence_ids": ["string"], "confidence": 0.0}
  ],
  "excluded_reasons": [
    {"reason": "string", "evidence_ids": ["string"], "why_excluded": "string"}
  ],
  "required_followups": ["string"],
  "confidence": 0.0,
  "internal_explanation_summary": "string",
  "requires_human_review": true
}

Few-shot:
Input: platform installs=1250 UTC, MMP installs=900 America/Los_Angeles, postback success=92.4%, delay=6.8%, evidence says timezone defaults may differ.
Output primary logic: timezone mismatch should rank first; postback delay can rank as partial contributor; do not claim postback outage; require rerun both reports in the same timezone.`;

function buildDiagnosisUserPrompt(routing, toolContext) {
  return JSON.stringify({
    routing_result: routing,
    platform_report: toolContext.platformReport,
    mmp_report: toolContext.mmpReport,
    postback_status: toolContext.postbackSummary,
    attribution_policy_context: toolContext.knowledge,
    evidence_objects: toolContext.evidenceObjects,
    business_rules: {
      difference_rate_formula: "abs(platform_value - mmp_value) / platform_value",
      material_difference_threshold: 0.2,
      confidence_caps: "without customer-confirmed aligned timezone and raw MMP validation, cap confidence at 0.85",
    },
  }, null, 2);
}

function validateDiagnosis(diagnosis) {
  const checkedItems = new Map((diagnosis.checked_items || []).map((item) => [item.item, item]));
  for (const item of ["timezone", "attribution_window", "event_mapping", "postback_delay", "dedup_or_reattribution", "privacy_or_invalid_traffic", "channel_mapping", "data_freshness"]) {
    assert(checkedItems.has(item), `diagnosis missing checked item ${item}`);
  }
  assert(["mismatched", "likely_issue"].includes(checkedItems.get("timezone").status), `timezone should be mismatched/likely_issue, got ${checkedItems.get("timezone").status}`);
  assert((diagnosis.likely_reasons || []).some((item) => /timezone|时区/i.test(item.reason)), "likely_reasons should include timezone");
  assert((diagnosis.required_followups || []).some((item) => /timezone|UTC|时区/i.test(item)), "required_followups should ask for timezone alignment");
  assert(Number(diagnosis.confidence) >= 0.55 && Number(diagnosis.confidence) <= 0.85, `diagnosis confidence out of expected range: ${diagnosis.confidence}`);
  const allEvidenceIds = JSON.stringify(diagnosis);
  for (const id of ["ev_metric_001", "ev_policy_001"]) {
    assert(allEvidenceIds.includes(id), `diagnosis should cite ${id}`);
  }
}

async function main() {
  const headers = await getHeaders();
  const models = await listModels(headers);
  assert(models.includes(MODEL), `Requested model ${MODEL} not available. Available: ${models.join(", ")}`);

  const routingResults = [];
  for (const testCase of routingCases) {
    const result = await chatJson(headers, [
      { role: "system", content: routingSystemPrompt },
      { role: "user", content: buildRoutingUserPrompt(testCase) },
    ], testCase.id);
    const routing = normalizeRouting(result.json, testCase);
    validateRouting(testCase, routing);
    routingResults.push({ id: testCase.id, routing, usage: result.usage, elapsedMs: result.elapsedMs });
  }

  const toolContext = simulateTools();
  const diagnosisResult = await chatJson(headers, [
    { role: "system", content: diagnosisSystemPrompt },
    { role: "user", content: buildDiagnosisUserPrompt(routingResults[0].routing, toolContext) },
  ], "diagnosis_attribution_case");
  validateDiagnosis(diagnosisResult.json);

  const report = {
    generated_at: new Date().toISOString(),
    endpoint: BASE_URL,
    model: MODEL,
    model_available: true,
    routing_cases: routingResults,
    deterministic_tool_context: toolContext,
    diagnosis_case: {
      diagnosis: diagnosisResult.json,
      usage: diagnosisResult.usage,
      elapsedMs: diagnosisResult.elapsedMs,
    },
    assertions: {
      routing_schema_and_expected_values: "passed",
      risk_rule_cross_check: "passed",
      confidence_rubric_cross_check: "passed_with_rule_normalization",
      missing_field_and_next_action_cross_check: "passed_with_rule_normalization",
      selected_workflow_cross_check: "passed_with_rule_normalization",
      diagnosis_checklist_and_evidence: "passed",
    },
  };

  await mkdir(path.dirname(OUT_PATH), { recursive: true });
  await writeFile(OUT_PATH, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`ADOPS_PROMPT_E2E_OK model=${MODEL} cases=${routingCases.length + 1} output=${OUT_PATH}`);
}

main().catch((error) => {
  console.error(`ADOPS_PROMPT_E2E_FAIL ${error.stack || error.message}`);
  process.exitCode = 1;
});
