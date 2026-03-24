// JARVIS v2 API response types — derived from jarvis/src/jarvis/contracts.py + gateway/schemas.py

export type TurnStatus =
  | "RECEIVED"
  | "VALIDATED"
  | "CONTEXT_BUILDING"
  | "ROUTING"
  | "WAITING_APPROVAL"
  | "EXECUTING_TOOLS"
  | "SLOW_PATH_DEBATE"
  | "FINALIZING"
  | "COMPLETE"
  | "CANCELLED"
  | "FAILED";

export interface ChatResponse {
  turn_id: string;
  session_id: string;
  status: string;
  turn_status: TurnStatus;
  stream_url: string | null;
  final_response: string | null;
  still_running: boolean;
}

export interface TurnResponse {
  turn_id: string;
  session_id: string;
  status: TurnStatus;
  final_response: string | null;
  tool_runs?: ToolRun[];
}

export interface ToolRun {
  tool_run_id: string;
  tool_name: string;
  tool_args: Record<string, unknown>;
  risk_tier: string;
  status: string;
  tool_result?: Record<string, unknown>;
  cognitive_assessment?: CognitiveAssessment;
  warnings?: string[];
}

export interface CognitiveAssessment {
  task_id: string;
  selected_agent_id: string;
  risk_flags: string[];
  recommendation: string;
}

export interface Session {
  session_id: string;
  created_at: string;
  updated_at: string;
  turn_count: number;
  summary?: string;
}

export interface SystemStatus {
  status: "healthy" | "degraded";
  degraded_states: string[];
  dependencies: Record<string, DependencyStatus>;
}

export interface DependencyStatus {
  ok: boolean;
  circuit_state?: string;
  configured?: boolean;
}

export interface CognitiveEloResponse {
  available: boolean;
  rankings: CognitiveAgent[];
}

export interface CognitiveAgent {
  agent_id: string;
  style: string;
  elo: number;
  games_played: number;
  wins: number;
}

export interface ControlRoomResponse {
  pending_approvals: Approval[];
  executing_tool_runs: ToolRun[];
  recent_audits: AuditEvent[];
}

export interface Approval {
  approval_id: string;
  tool_run_id: string;
  tool_name: string;
  tool_args: Record<string, unknown>;
  risk_tier: string;
  created_at: string;
  expires_at: string;
}

export interface AuditEvent {
  audit_id: string;
  event_type: string;
  event_data: Record<string, unknown>;
  created_at: string;
}

export interface MemoryResponse {
  settings: { cross_session_memory_enabled: boolean };
  memories: Memory[];
  facts: Fact[];
}

export interface Memory {
  memory_id: string;
  content: string;
  created_at: string;
}

export interface Fact {
  fact_id: string;
  fact_key: string;
  fact_value: string;
  created_at: string;
  updated_at: string;
}

export interface Tool {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
  required_scopes: string[];
  risk_tier: string;
}

export interface Workflow {
  workflow_id: string;
  title: string;
  status: string;
  origin: string;
  created_at: string;
  updated_at: string;
}

export interface WorkflowDetail {
  workflow: Workflow;
  steps: WorkflowStep[];
  artifacts: WorkflowArtifact[];
  agents: WorkflowAgent[];
}

export interface WorkflowStep {
  step_id: string;
  step_name: string;
  status: string;
  tool_run_id?: string;
}

export interface WorkflowArtifact {
  artifact_id: string;
  filename: string;
  mime_type: string;
  sha256: string;
  created_at: string;
}

export interface WorkflowAgent {
  agent_id: string;
  alias: string;
  sandbox_root?: string;
}

export interface CalendarEvent {
  event_id: string;
  summary: string;
  location?: string;
  start_at: string;
  end_at?: string;
}

export interface InboxMessage {
  message_id: string;
  sender: string;
  subject: string;
  body?: string;
  is_read: boolean;
  created_at: string;
}

export interface Notification {
  notification_id: string;
  trigger_type: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

export interface UsageResponse {
  total_turns: number;
  total_tokens: number;
  daily_usage: Record<string, number>;
}

export interface UserSettings {
  user_id: string;
  cross_session_memory_enabled: boolean;
  proactive_enabled: boolean;
}

// WebSocket event types
export type WSEventType =
  | "turn.started"
  | "policy.precheck"
  | "assistant.delta"
  | "assistant.final"
  | "tool.proposed"
  | "tool.approval_required"
  | "tool.approved"
  | "tool.started"
  | "tool.result"
  | "turn.cancelled"
  | "turn.failed"
  | "audit.written"
  | "workflow.created"
  | "workflow.cancelled"
  | "workflow.resumed"
  | "workflow.artifact.created"
  | "workflow.agent.spawned"
  | "workflow.dashboard"
  | "voice.partial_transcript"
  | "voice.final_transcript"
  | "voice.tts_cancelled";

export interface WSEvent {
  type: WSEventType;
  turn_id: string | null;
  session_id: string;
  seq: number;
  timestamp: string;
  payload: Record<string, unknown>;
}
