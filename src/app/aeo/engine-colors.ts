import type { Engine } from "@/lib/aeo/visibility";

// CSS variables defined in aeo.module.css (with dark-theme variants).
export const ENGINE_COLORS: Record<Engine, string> = {
  ChatGPT: "var(--aeo-engine-chatgpt)",
  Perplexity: "var(--aeo-engine-perplexity)",
  Gemini: "var(--aeo-engine-gemini)",
  "Google AI Overview": "var(--aeo-engine-overview)",
};
