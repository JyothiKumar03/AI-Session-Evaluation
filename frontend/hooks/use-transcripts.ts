"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchTranscripts,
  fetchTranscriptById,
  uploadTranscript,
  deleteTranscript,
  fetchCompare,
} from "@/services/api";

export const transcriptKeys = {
  all: ["transcripts"] as const,
  detail: (id: string) => ["transcripts", id] as const,
};

export function useTranscripts() {
  return useQuery({
    queryKey: transcriptKeys.all,
    queryFn: fetchTranscripts,
  });
}

export function useTranscriptDetail(id: string) {
  return useQuery({
    queryKey: transcriptKeys.detail(id),
    queryFn: () => fetchTranscriptById(id),
    enabled: Boolean(id),
  });
}

export function useUploadTranscript() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadTranscript,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transcriptKeys.all });
    },
  });
}

export function useDeleteTranscript() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTranscript,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transcriptKeys.all });
    },
  });
}

export function useCompare(session1: string, session2: string) {
  return useQuery({
    queryKey: ["compare", session1, session2],
    queryFn: () => fetchCompare(session1, session2),
    enabled: Boolean(session1 && session2),
  });
}
