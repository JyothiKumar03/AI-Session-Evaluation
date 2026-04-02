import {
  Lightbulb,
  Target,
  Activity,
  Brain,
  Shield,
  Rocket,
  Workflow,
} from "lucide-react";
import type { MetricKey } from "@/types";

export const METRIC_KEYS: MetricKey[] = [
  "prompt_clarity",
  "context_management",
  "iteration_efficiency",
  "critical_thinking",
  "error_recovery",
  "ai_leverage",
  "workflow_structure",
];

export const METRIC_LABELS: Record<MetricKey, string> = {
  prompt_clarity: "Prompt Clarity",
  context_management: "Context Management",
  iteration_efficiency: "Iteration Efficiency",
  critical_thinking: "Critical Thinking",
  error_recovery: "Error Recovery",
  ai_leverage: "AI Leverage",
  workflow_structure: "Workflow Structure",
};

export const METRIC_META: Record<
  MetricKey,
  { label: string; Icon: React.ElementType; description: string }
> = {
  prompt_clarity: {
    label: "Prompt Clarity",
    Icon: Lightbulb,
    description: "How clearly goals were communicated",
  },
  context_management: {
    label: "Context Management",
    Icon: Target,
    description: "How well context was maintained",
  },
  iteration_efficiency: {
    label: "Iteration Efficiency",
    Icon: Activity,
    description: "Speed and effectiveness of iterations",
  },
  critical_thinking: {
    label: "Critical Thinking",
    Icon: Brain,
    description: "Depth of reasoning and analysis",
  },
  error_recovery: {
    label: "Error Recovery",
    Icon: Shield,
    description: "How well errors were handled",
  },
  ai_leverage: {
    label: "AI Leverage",
    Icon: Rocket,
    description: "How effectively AI capabilities were used",
  },
  workflow_structure: {
    label: "Workflow Structure",
    Icon: Workflow,
    description: "Organisation and flow of work",
  },
};
