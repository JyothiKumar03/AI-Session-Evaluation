import type { Message } from "../../types/transcript";

function format_messages(messages: Message[]): string {
  return messages
    .map((m) => `[${m.index}] ${m.role.toUpperCase()}: ${m.content}`)
    .join("\n");
}

export function build_extract_prompt(messages: Message[]): string {
  return `You are an expert software engineering coach analyzing an AI-assisted coding session.

Below is a full transcript of a coding session between an engineer (USER) and an AI assistant (ASSISTANT).

TRANSCRIPT:
${format_messages(messages)}

═══════════════════════════════════════════════════════
BEFORE YOU ANALYZE — READ THESE RULES CAREFULLY
═══════════════════════════════════════════════════════

NOISE MESSAGES — MUST still be included in segment ranges (every index 0 to ${messages.length - 1} must appear in exactly one segment), but do NOT treat them as meaningful user intent when scoring or writing summaries:
- Slash commands: content starting with <command-name> (e.g. /model, /clear) — CLI operations, not user intent
- Local command output: content wrapped in <local-command-stdout> or <local-command-caveat> — system output, not user thought
- Tool results: a USER message that is purely a tool result (e.g. "claude.md", stdout of a bash command) — AI tool output echoed back, not a user action
- IDE context injections: content inside <ide_selection> tags — passive editor state, not a deliberate user message

Group noise messages into the nearest logical segment. Never skip a message index — if the only messages are noise, create a segment for them and describe them accurately as system/CLI operations.

INTERRUPTIONS — if you see "[Request interrupted by user]", the user aborted the AI mid-response. This is a meaningful signal:
- It belongs to its own segment or marks the boundary between segments
- It indicates the AI's response was not satisfying or the user changed direction
- It must lower iteration_efficiency and workflow_structure scores
- It must appear in improvements

FABRICATION RULE — only report what actually happened in the transcript:
- Do NOT infer that scaffolding, implementation, or any work was completed unless the ASSISTANT messages show it happening
- Do NOT credit the user for "effectively using AI" if the AI only ran trivial commands (e.g. ls) or was interrupted before producing output
- Strengths must be grounded in specific messages — if you cannot point to a message that supports it, do not include it

SCORING RULES:
- critical_thinking and error_recovery scores must reflect actual verification or error-handling behavior in the transcript — if there was nothing to verify or no errors occurred, note that in the rationale and use confidence ≤ 0.5
- ai_leverage must reflect the actual tasks the AI was given — a single ls call or an interrupted session is low leverage

═══════════════════════════════════════════════════════
OUTPUT STRUCTURE
═══════════════════════════════════════════════════════

── SEGMENTS ──
Break the transcript into contiguous logical phases. Each segment must have:
- phase: one of planning | implementation | debugging | refactoring | testing | documentation | clarification | off-track
- message_range: { start: start_index, end: end_index } (inclusive — every message index must appear in exactly one segment, no gaps)
- summary: what actually happened in this segment — be specific, not aspirational. Reference the actual content of messages.
- signals: boolean flags about user behavior in this segment
  • user_provided_context: did the user supply relevant background or files?
  • user_had_clear_goal: was the user's intent unambiguous?
  • ai_response_was_actionable: did the ASSISTANT produce something usable (not just thinking/tool calls with no output)?
  • user_reviewed_output: did the user explicitly react to or validate the AI's response?
- scores: per-metric scores (1–10) for this segment (same 7 metrics as overall)
- commentary: 1 sentence grounded in what actually happened in the segment

── OVERALL SCORES ──
Score these 7 metrics for the whole session (1–10, confidence 0.0–1.0, rationale grounded in specific messages):
1. prompt_clarity       — Are the user's real instructions (ignoring noise) clear and specific?
2. context_management   — Does the user maintain/provide relevant context across turns?
3. iteration_efficiency — How efficiently are tasks resolved? Interruptions and re-asks must reduce this.
4. critical_thinking    — Does the user verify/question AI output? Low confidence if there was nothing to verify.
5. error_recovery       — How well does the user handle errors? Low confidence if no errors occurred.
6. ai_leverage          — Is AI used for high-value tasks? Rate based on what was actually asked, not what was intended.
7. workflow_structure   — Is there a logical flow? Interruptions and direction changes must reduce this.

── SUMMARY & INSIGHTS ──
- snapshot_summary: 5-8 sentences/points describing what actually happened and the session quality — do not describe intent as outcome
- strengths: 2-4 things the user genuinely did well, each tied to a specific message or behavior visible in the transcript
- improvements: 2-4 specific, actionable things to improve — interruptions, vague re-asks, and unverified outputs must appear here if present
- workflow_pattern: plan-first | dive-in | iterative | reactive | exploratory

Return valid JSON matching the schema exactly. Segments must be contiguous and cover every message index from 0 to ${messages.length - 1}.`;
}
