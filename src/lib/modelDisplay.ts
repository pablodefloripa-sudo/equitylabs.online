/* Nombres de modelo legibles para el usuario — sin números ni ":free".
   El usuario ve "Kimi", "DeepSeek", "Claude", "NVIDIA Nemotron" — nunca
   "moonshotai/kimi-k2.5" ni "nvidia/...-30b-a3b-reasoning:free". */

const MODEL_DISPLAY: Record<string, string> = {
  'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free': 'NVIDIA Nemotron',
  'nvidia/nemotron-3-nano-30b-a3b:free': 'NVIDIA Nemotron',
  'nvidia/nemotron-3-ultra-550b-a55b:free': 'NVIDIA Nemotron',
  'deepseek/deepseek-v4-flash': 'DeepSeek',
  'deepseek/deepseek-v4-pro': 'DeepSeek Pro',
  'moonshotai/kimi-k2.5': 'Kimi',
  'moonshotai/kimi-k2-thinking': 'Kimi',
  'moonshotai/kimi-k2': 'Kimi',
  'anthropic/claude-haiku-4.5': 'Claude',
  'qwen/qwen3-vl-8b-thinking': 'Qwen',
  'qwen/qwen3.7-flash': 'Qwen',
  'google/gemma-4-26b-a4b-it:free': 'Gemma',
};

/** Devuelve el nombre genérico de marca; fallback: último segmento sin :free ni versión. */
export const modelDisplayName = (model?: string | null): string | null => {
  if (!model) return null;
  if (MODEL_DISPLAY[model]) return MODEL_DISPLAY[model];

  // Fallback genérico: marca sin sufijo :free
  const clean = model.split('/').pop()?.split(':')[0] || model;
  // Quitar versiones tipo -v4-flash, -k2.5, -4.5, -30b-a3b (deja la marca base)
  const brand = clean
    .replace(/[-_ ]?(v?\d[\w.-]*|30b|a3b|nano|omni|flash|reasoning|latest|exp|thinking|mini|ultra|super|haiku|sonnet|opus)$/i, '')
    .replace(/[-_]+$/, '')
    .trim();
  return brand || clean;
};
