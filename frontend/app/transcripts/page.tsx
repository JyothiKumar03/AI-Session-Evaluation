"use client";

import { useState } from "react";
import { UploadCloud, LayoutGrid, FileText, SearchX, AlertCircle } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import transcriptCard from "@/components/transcript-card";
import uploadForm from "@/components/upload-form";
import { useTranscripts } from "@/hooks/use-transcripts";

const TranscriptCard = transcriptCard;
const UploadForm = uploadForm;

function SkeletonCard() {
  return (
    <div className="rounded-xl bg-white ring-1 ring-gray-200 p-4 flex flex-col gap-3">
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-3 w-1/3" />
      <div className="flex gap-2 mt-1">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-28" />
      </div>
    </div>
  );
}

function ListingTab() {
  const { data: transcripts, isLoading, isError, error } = useTranscripts();

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <AlertCircle className="h-16 w-16 text-red-400" strokeWidth={1.5} />
        <div>
          <p className="font-semibold text-gray-800">Failed to load sessions</p>
          <p className="text-sm text-gray-500 mt-1">{(error as Error).message}</p>
        </div>
      </div>
    );
  }

  if (!transcripts || transcripts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <SearchX className="h-20 w-20 text-gray-300" strokeWidth={1.3} />
        <div>
          <p className="font-semibold text-gray-600">No sessions yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Upload a transcript to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {transcripts.map((transcript) => (
        <TranscriptCard key={transcript.id} transcript={transcript} />
      ))}
    </div>
  );
}

export default function TranscriptsPage() {
  const [tab, setTab] = useState<string>("listing");
  const { data: transcripts } = useTranscripts();

  return (
    <div className="px-8 py-8">
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <FileText className="h-8 w-8 text-blue-600" strokeWidth={1.8} />
          <h1 className="text-2xl font-semibold text-gray-900">Sessions</h1>
        </div>
        <p className="text-sm text-gray-500 ml-11">
          Upload and review your AI coding session transcripts.
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab} orientation="horizontal">
        <TabsList className="mb-6">
          <TabsTrigger value="upload" className="gap-2">
            <UploadCloud className="h-4 w-4" strokeWidth={2} />
            Upload
          </TabsTrigger>
          <TabsTrigger value="listing" className="gap-2">
            <LayoutGrid className="h-4 w-4" strokeWidth={2} />
            Library
            {transcripts && transcripts.length > 0 && (
              <span className="ml-1 rounded-full bg-blue-100 px-1.5 py-0.5 text-xs font-semibold text-blue-700">
                {transcripts.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload">
          <UploadForm />
        </TabsContent>

        <TabsContent value="listing">
          <ListingTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
