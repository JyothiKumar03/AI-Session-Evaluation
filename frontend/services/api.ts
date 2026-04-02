import { API_BASE_URL } from "@/constants";
import type {
  ApiResponse,
  TranscriptRow,
  TranscriptDetailData,
  UploadResponseData,
  CompareData,
} from "@/types";

async function handleResponse<T>(res: Response): Promise<T> {
  const json: ApiResponse<T> = await res.json();
  if (!json.success || json.data === undefined) {
    throw new Error(json.error ?? "Request failed");
  }
  return json.data;
}

export async function fetchTranscripts(): Promise<TranscriptRow[]> {
  const res = await fetch(`${API_BASE_URL}/transcripts`);
  return handleResponse<TranscriptRow[]>(res);
}

export async function fetchTranscriptById(
  id: string
): Promise<TranscriptDetailData> {
  const res = await fetch(`${API_BASE_URL}/transcripts/${id}`);
  return handleResponse<TranscriptDetailData>(res);
}

export async function uploadTranscript(
  file: File
): Promise<UploadResponseData> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_BASE_URL}/transcripts/upload`, {
    method: "POST",
    body: form,
  });
  return handleResponse<UploadResponseData>(res);
}

export async function deleteTranscript(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/transcripts/${id}`, {
    method: "DELETE",
  });
  await handleResponse<{ deleted: string }>(res);
}

export async function fetchCompare(
  session1: string,
  session2: string
): Promise<CompareData> {
  const res = await fetch(
    `${API_BASE_URL}/transcripts/compare?session1=${session1}&session2=${session2}`
  );
  return handleResponse<CompareData>(res);
}
