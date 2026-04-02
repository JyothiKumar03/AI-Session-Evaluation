export const SOURCE_LABELS: Record<string, string> = {
  claude_code: "Claude Code",
  codex: "Codex",
  generic: "Generic",
};

export const SOURCE_COLORS: Record<string, string> = {
  claude_code: "bg-blue-100 text-blue-700 border-blue-200",
  codex: "bg-purple-100 text-purple-700 border-purple-200",
  generic: "bg-gray-100 text-gray-600 border-gray-200",
};

export const WORKFLOW_COLORS: Record<string, string> = {
  "plan-first": "bg-violet-100 text-violet-700 border-violet-200",
  "dive-in": "bg-blue-100 text-blue-700 border-blue-200",
  iterative: "bg-green-100 text-green-700 border-green-200",
  reactive: "bg-amber-100 text-amber-700 border-amber-200",
  exploratory: "bg-sky-100 text-sky-700 border-sky-200",
};
