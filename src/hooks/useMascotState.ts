import { useEffect, useRef, useState } from "react";
import {
  MASCOT_EVENTS,
  type MascotState,
  type MascotEventPayloadMap,
} from "@/lib/mascot-events";

const DEFAULT_MESSAGE = "Lista para asistir con precisión. Como diría Holmes: primero los hechos.";

const getFirstName = (value?: string | null) => {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return trimmed.split(/\s+/)[0] || null;
};

type MascotSnapshot = {
  state: MascotState;
  message: string;
  pulseKey: number;
  userName: string | null;
};

const createSnapshot = (): MascotSnapshot => ({
  state: "idle",
  message: DEFAULT_MESSAGE,
  pulseKey: 0,
  userName: null,
});

export const useMascotState = () => {
  const [snapshot, setSnapshot] = useState<MascotSnapshot>(createSnapshot);
  const resetTimerRef = useRef<number | null>(null);

  const clearResetTimer = () => {
    if (resetTimerRef.current) {
      window.clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
  };

  const scheduleReset = (delay = 3600) => {
    clearResetTimer();
    resetTimerRef.current = window.setTimeout(() => {
      setSnapshot((current) => ({
        ...current,
        state: "idle",
        message: current.userName ? `${getFirstName(current.userName)}. He regresado y sigo a su disposición.` : DEFAULT_MESSAGE,
      }));
    }, delay);
  };

  const updateSnapshot = (
    next: Partial<MascotSnapshot> & { message?: string; state?: MascotState },
    resetDelay?: number,
  ) => {
    setSnapshot((current) => ({
      ...current,
      ...next,
      pulseKey: current.pulseKey + 1,
    }));

    if (typeof resetDelay === "number") {
      scheduleReset(resetDelay);
    } else if (next.state && next.state !== "idle") {
      scheduleReset();
    }
  };

  useEffect(() => {
    const onWelcome = (event: Event) => {
      const detail = (event as CustomEvent<MascotEventPayloadMap[typeof MASCOT_EVENTS.WELCOME]>).detail || {};
      const userName = detail.userName?.trim() || null;

      updateSnapshot(
        {
          state: userName ? "call_by_name" : "welcome",
          message: userName ? `Buenos días, ${getFirstName(userName)}. ¿Desea que empecemos por los hechos?` : "Bienvenido al laboratorio.",
          userName,
        },
        5000,
      );
    };

    const onDashboardEntered = (event: Event) => {
      const detail = (event as CustomEvent<MascotEventPayloadMap[typeof MASCOT_EVENTS.DASHBOARD_ENTERED]>).detail || {};
      const userName = detail.userName?.trim() || null;

      updateSnapshot(
        {
          state: userName ? "call_by_name" : "welcome",
          message: userName ? `Bienvenido de vuelta, ${getFirstName(userName)}. Todo está listo, por una vez.` : "Bienvenido de vuelta al laboratorio.",
          userName,
        },
        5000,
      );
    };

    const onThinking = (event: Event) => {
      const detail = (event as CustomEvent<MascotEventPayloadMap[typeof MASCOT_EVENTS.THINKING]>).detail || {};
      updateSnapshot(
        {
          state: "thinking",
          message: detail.reason ? `Estoy analizando: ${detail.reason}. Como diría Holmes, conviene observar antes de hablar.` : "Estoy revisando los datos con calma. La prisa rara vez mejora una idea.",
        },
        3200,
      );
    };

    const onTaskSuggested = (event: Event) => {
      const detail = (event as CustomEvent<MascotEventPayloadMap[typeof MASCOT_EVENTS.TASK_SUGGESTED]>).detail || {};
      const count = detail.proposals?.length || detail.tasks?.length || 0;
      updateSnapshot(
        {
          state: "suggesting",
          message: detail.message || (detail.agentName
            ? `Le propongo ${count || 3} tareas bien enfocadas para ${detail.agentName}. Un plan sin métricas suele ser simple decoración.`
            : `Le propongo ${count || 3} tareas bien enfocadas para avanzar. Un plan sin métricas suele ser simple decoración.`),
        },
        4200,
      );
    };

    const onProgressDetected = (event: Event) => {
      const detail = (event as CustomEvent<MascotEventPayloadMap[typeof MASCOT_EVENTS.PROGRESS_DETECTED]>).detail || {};
      updateSnapshot(
        {
          state: "celebrating",
          message: `Avance detectado: ${detail.milestone}. Notable. La realidad, de vez en cuando, coopera.`,
        },
        3600,
      );
    };

    const onSuccess = (event: Event) => {
      const detail = (event as CustomEvent<MascotEventPayloadMap[typeof MASCOT_EVENTS.SUCCESS]>).detail || {};
      updateSnapshot(
        {
          state: detail.rewardType === "food" ? "eating" : "celebrating",
          message: detail.label || (detail.rewardType === "food" ? "Excelente. Un pequeño premio ayuda a sostener el ritmo." : "Magnífico. Los datos, por una vez, cooperaron."),
        },
        3800,
      );
    };

    const onError = (event: Event) => {
      const detail = (event as CustomEvent<MascotEventPayloadMap[typeof MASCOT_EVENTS.ERROR]>).detail || {};
      updateSnapshot(
        {
          state: "alert",
          message: detail.message || "Se presentó una incidencia. La reviso de inmediato. Incluso el buen gusto tiene sus límites.",
        },
        5200,
      );
    };

    const onGuideWeb = (event: Event) => {
      const detail = (event as CustomEvent<MascotEventPayloadMap[typeof MASCOT_EVENTS.GUIDE_WEB]>).detail || {};
      updateSnapshot(
        {
          state: "guide_web",
          message: detail.topic ? `Vamos a explorar: ${detail.topic}. Nada de turismo intelectual innecesario.` : "Le propongo un recorrido breve y útil por la web. Nada de turismo intelectual innecesario.",
        },
        4200,
      );
    };

    window.addEventListener(MASCOT_EVENTS.WELCOME, onWelcome);
    window.addEventListener(MASCOT_EVENTS.DASHBOARD_ENTERED, onDashboardEntered);
    window.addEventListener(MASCOT_EVENTS.THINKING, onThinking);
    window.addEventListener(MASCOT_EVENTS.TASK_SUGGESTED, onTaskSuggested);
    window.addEventListener(MASCOT_EVENTS.PROGRESS_DETECTED, onProgressDetected);
    window.addEventListener(MASCOT_EVENTS.SUCCESS, onSuccess);
    window.addEventListener(MASCOT_EVENTS.ERROR, onError);
    window.addEventListener(MASCOT_EVENTS.GUIDE_WEB, onGuideWeb);

    return () => {
      clearResetTimer();
      window.removeEventListener(MASCOT_EVENTS.WELCOME, onWelcome);
      window.removeEventListener(MASCOT_EVENTS.DASHBOARD_ENTERED, onDashboardEntered);
      window.removeEventListener(MASCOT_EVENTS.THINKING, onThinking);
      window.removeEventListener(MASCOT_EVENTS.TASK_SUGGESTED, onTaskSuggested);
      window.removeEventListener(MASCOT_EVENTS.PROGRESS_DETECTED, onProgressDetected);
      window.removeEventListener(MASCOT_EVENTS.SUCCESS, onSuccess);
      window.removeEventListener(MASCOT_EVENTS.ERROR, onError);
      window.removeEventListener(MASCOT_EVENTS.GUIDE_WEB, onGuideWeb);
    };
  }, []);

  return {
    state: snapshot.state,
    message: snapshot.message,
    pulseKey: snapshot.pulseKey,
    userName: snapshot.userName,
  };
};

