export type ApiResponse<T> = {
  success: boolean;
  data?:   T;
  error?:  string;
};

export type { Message, NormalizedTranscript, TranscriptRow } from "./transcript";
export type { Segment, MetricScore, OverallScores, AnalysisOutput, AnalysisRow, AiProviderConfig } from "./analysis";
