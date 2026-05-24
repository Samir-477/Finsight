"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ProgressTracker } from "@/components/ProgressTracker";
import { ReportViewer } from "@/components/ReportViewer";
import { getJobStatus, getReport } from "@/lib/api";
import type { ResearchJob } from "@/lib/api";
import { useWebSocket } from "@/lib/websocket";

export default function ResearchPage() {
  const params = useParams();
  const jobId = params.id as string;

  const [job, setJob] = useState<ResearchJob | null>(null);
  const [report, setReport] = useState<string>("");
  const { events } = useWebSocket(jobId);

  const fetchReport = useCallback(async () => {
    try {
      const data = await getReport(jobId);
      setReport(data.markdown);
    } catch (error) {
      console.error("Failed to fetch report:", error);
    }
  }, [jobId]);

  const fetchJob = useCallback(async () => {
    try {
      const jobData = await getJobStatus(jobId);
      setJob(jobData);
      if (jobData.status === "done") {
        fetchReport();
      }
    } catch (error) {
      console.error("Failed to fetch job status:", error);
    }
  }, [fetchReport, jobId]);

  useEffect(() => {
    fetchJob();
    const interval = setInterval(fetchJob, 2000);
    return () => clearInterval(interval);
  }, [fetchJob]);

  useEffect(() => {
    if (job?.status === "done") {
      fetchReport();
    }
  }, [fetchReport, job?.status]);

  if (job?.status === "done" && report) {
    return <ReportViewer report={report} job={job} />;
  }

  return <ProgressTracker job={job} events={events} />;
}
