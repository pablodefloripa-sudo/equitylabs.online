import { trackFirebaseEvent } from "@/integrations/firebase";

export const MASCOT_EVENTS = {
  WELCOME: "eq:welcome",
  DASHBOARD_ENTERED: "eq:dashboard-entered",
  THINKING: "eq:thinking",
  TASK_SUGGESTED: "eq:task-suggested",
  PROGRESS_DETECTED: "eq:progress-detected",
  SUCCESS: "eq:success",
  ERROR: "eq:error",
  GUIDE_WEB: "eq:guide-web",
} as const;

export type MascotState =
  | "idle"
  | "welcome"
  | "thinking"
  | "suggesting"
  | "team_builder"
  | "celebrating"
  | "eating"
  | "alert"
  | "guide_web"
  | "call_by_name";

export type MascotEventPayloadMap = {
  [MASCOT_EVENTS.WELCOME]: { userName?: string; agentId?: string };
  [MASCOT_EVENTS.DASHBOARD_ENTERED]: { userName?: string; agentId?: string };
  [MASCOT_EVENTS.THINKING]: { reason?: string };
  [MASCOT_EVENTS.TASK_SUGGESTED]: {
    source?: string;
    agentName?: string;
    proposals?: string[];
    tasks?: string[];
    message?: string;
  };
  [MASCOT_EVENTS.PROGRESS_DETECTED]: {
    milestone: string;
    progress?: number;
    source?: string;
  };
  [MASCOT_EVENTS.SUCCESS]: { label?: string; rewardType?: "food" | "celebration" };
  [MASCOT_EVENTS.ERROR]: { message: string; code?: string };
  [MASCOT_EVENTS.GUIDE_WEB]: { route?: string; topic?: string };
};

export type MascotEventName = keyof MascotEventPayloadMap;

export const emitMascotEvent = <T extends MascotEventName>(
  name: T,
  detail: MascotEventPayloadMap[T],
) => {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new CustomEvent(name, { detail }));
  const analyticsEventName: Record<MascotEventName, string> = {
    [MASCOT_EVENTS.WELCOME]: "eq_welcome",
    [MASCOT_EVENTS.DASHBOARD_ENTERED]: "eq_dashboard_entered",
    [MASCOT_EVENTS.THINKING]: "eq_thinking",
    [MASCOT_EVENTS.TASK_SUGGESTED]: "eq_task_suggested",
    [MASCOT_EVENTS.PROGRESS_DETECTED]: "eq_progress_detected",
    [MASCOT_EVENTS.SUCCESS]: "eq_success",
    [MASCOT_EVENTS.ERROR]: "eq_error",
    [MASCOT_EVENTS.GUIDE_WEB]: "eq_guide_web",
  };

  const analyticsPayload = (() => {
    switch (name) {
      case MASCOT_EVENTS.WELCOME:
      case MASCOT_EVENTS.DASHBOARD_ENTERED:
        return {
          user_name: (detail as MascotEventPayloadMap[typeof MASCOT_EVENTS.WELCOME]).userName || null,
          agent_id: (detail as MascotEventPayloadMap[typeof MASCOT_EVENTS.WELCOME]).agentId || null,
        };
      case MASCOT_EVENTS.THINKING:
        return { reason: detail.reason || null };
      case MASCOT_EVENTS.TASK_SUGGESTED:
        return {
          source: detail.source || null,
          agent_name: detail.agentName || null,
          proposal_count: detail.proposals?.length || detail.tasks?.length || 0,
        };
      case MASCOT_EVENTS.PROGRESS_DETECTED:
        return {
          source: detail.source || null,
          milestone: detail.milestone,
          progress: detail.progress ?? null,
        };
      case MASCOT_EVENTS.SUCCESS:
        return {
          label: detail.label || null,
          reward_type: detail.rewardType || null,
        };
      case MASCOT_EVENTS.ERROR:
        return {
          code: detail.code || null,
          message: detail.message,
        };
      case MASCOT_EVENTS.GUIDE_WEB:
        return {
          route: detail.route || null,
          topic: detail.topic || null,
        };
      default:
        return {};
    }
  })();

  void trackFirebaseEvent(analyticsEventName[name], analyticsPayload);
};

const PROGRESS_KEYWORDS = [
  "hecho",
  "listo",
  "completado",
  "completa",
  "logrado",
  "avance",
  "entregado",
  "publicado",
  "enviado",
  "aprobado",
  "cerrado",
  "finalizado",
  "done",
  "completed",
  "published",
  "sent",
  "approved",
  "finished",
];

export const detectProgressMilestone = (text: string) => {
  const normalized = text.toLowerCase();
  const match = PROGRESS_KEYWORDS.find((keyword) => normalized.includes(keyword));

  if (!match) return null;

  const sentenceMatch = text.match(/[^.!?\n]+(?:[.!?]|\n|$)/);
  return sentenceMatch?.[0]?.trim() || match;
};
