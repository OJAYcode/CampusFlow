"use client";

/* eslint-disable simple-import-sort/imports */
import mammoth from "mammoth";
import { AlertCircle, ExternalLink, Eye, LoaderCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { resolveFileUrl } from "@/src/utils/files";

const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"]);
const VIDEO_EXTENSIONS = new Set(["mp4", "webm", "ogg", "mov"]);
const AUDIO_EXTENSIONS = new Set(["mp3", "wav", "ogg", "m4a", "aac"]);
const OFFICE_EXTENSIONS = new Set(["doc", "docx", "xls", "xlsx", "ppt", "pptx"]);
const TEXT_EXTENSIONS = new Set(["txt", "md", "csv", "json", "log"]);

function getFileExtension(url: string) {
  try {
    const pathname = new URL(url).pathname;
    const last = pathname.split(".").pop();
    return last ? last.toLowerCase() : "";
  } catch {
    const clean = url.split("?")[0];
    const last = clean.split(".").pop();
    return last ? last.toLowerCase() : "";
  }
}

function getPreviewKind(url: string) {
  const extension = getFileExtension(url);
  if (IMAGE_EXTENSIONS.has(extension)) return "image";
  if (VIDEO_EXTENSIONS.has(extension)) return "video";
  if (AUDIO_EXTENSIONS.has(extension)) return "audio";
  if (extension === "docx") return "docx";
  if (TEXT_EXTENSIONS.has(extension)) return "text";
  if (OFFICE_EXTENSIONS.has(extension)) return "office";
  return "document";
}

function usesLocalHost(url: string) {
  try {
    const hostname = new URL(url).hostname;
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

export function FileLauncher({
  fileUrl,
  fileName,
  title,
  triggerLabel = "Open file",
  size = "sm",
  variant = "secondary",
}: {
  fileUrl?: string | null;
  fileName?: string;
  title?: string;
  triggerLabel?: string;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  const [open, setOpen] = useState(false);
  const [docxHtml, setDocxHtml] = useState("");
  const [textContent, setTextContent] = useState("");
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const resolvedUrl = resolveFileUrl(fileUrl);
  const previewKind = useMemo(() => (resolvedUrl ? getPreviewKind(resolvedUrl) : "document"), [resolvedUrl]);
  const isLocalFile = useMemo(() => usesLocalHost(resolvedUrl), [resolvedUrl]);
  const officeEmbedUrl = useMemo(
    () => (resolvedUrl ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(resolvedUrl)}` : ""),
    [resolvedUrl],
  );

  useEffect(() => {
    if (!open || !resolvedUrl) return;
    if (previewKind !== "docx" && previewKind !== "text") {
      setDocxHtml("");
      setTextContent("");
      setPreviewError("");
      setLoadingPreview(false);
      return;
    }

    let cancelled = false;

    async function loadPreview() {
      setLoadingPreview(true);
      setPreviewError("");

      try {
        const response = await fetch(resolvedUrl);
        if (!response.ok) {
          throw new Error("The file could not be loaded.");
        }

        if (previewKind === "docx") {
          const arrayBuffer = await response.arrayBuffer();
          const result = await mammoth.convertToHtml({ arrayBuffer });
          if (!cancelled) {
            setDocxHtml(result.value || "<p>No preview content was returned.</p>");
          }
        } else {
          const text = await response.text();
          if (!cancelled) {
            setTextContent(text);
          }
        }
      } catch (error) {
        if (!cancelled) {
          setPreviewError(error instanceof Error ? error.message : "This file could not be previewed in the app.");
        }
      } finally {
        if (!cancelled) {
          setLoadingPreview(false);
        }
      }
    }

    loadPreview();

    return () => {
      cancelled = true;
    };
  }, [open, previewKind, resolvedUrl]);

  if (!resolvedUrl) return null;

  return (
    <>
      <Button size={size} variant={variant} className="gap-2" onClick={() => setOpen(true)}>
        <Eye className="h-4 w-4 shrink-0" />
        {triggerLabel}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-6xl overflow-hidden p-0 pr-0">
          <div className="border-b border-[var(--border)] px-5 py-4 sm:px-6">
            <DialogHeader className="mb-0">
              <DialogTitle>{title || fileName || "File viewer"}</DialogTitle>
              <DialogDescription>
                View the file without leaving the portal.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="space-y-4 px-5 py-4 sm:px-6 sm:py-5">
            <div className="h-[min(68vh,720px)] overflow-hidden rounded-[18px] border border-[var(--border)] bg-[#f8fafc]">
              {previewKind === "image" ? (
                <div className="flex h-full min-h-[320px] items-center justify-center bg-[#f8fafc] p-4">
                  <img src={resolvedUrl} alt={fileName || "Preview"} className="max-h-full w-auto max-w-full rounded-[12px] object-contain" />
                </div>
              ) : previewKind === "video" ? (
                <video controls className="h-full w-full bg-black">
                  <source src={resolvedUrl} />
                </video>
              ) : previewKind === "audio" ? (
                <div className="flex h-full min-h-[220px] items-center justify-center p-6">
                  <audio controls className="w-full max-w-xl">
                    <source src={resolvedUrl} />
                  </audio>
                </div>
              ) : previewKind === "docx" ? (
                loadingPreview ? (
                  <div className="flex h-full min-h-[320px] items-center justify-center gap-3 text-slate-600">
                    <LoaderCircle className="h-5 w-5 animate-spin" />
                    <span>Loading document preview...</span>
                  </div>
                ) : previewError ? (
                  <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-3 px-6 text-center text-slate-600">
                    <AlertCircle className="h-8 w-8 text-amber-600" />
                    <p>{previewError}</p>
                  </div>
                ) : (
                  <div className="scrollbar-gutter-stable h-full overflow-y-auto bg-white p-6">
                    <div
                      className="prose prose-slate max-w-none"
                      dangerouslySetInnerHTML={{ __html: docxHtml }}
                    />
                  </div>
                )
              ) : previewKind === "text" ? (
                loadingPreview ? (
                  <div className="flex h-full min-h-[320px] items-center justify-center gap-3 text-slate-600">
                    <LoaderCircle className="h-5 w-5 animate-spin" />
                    <span>Loading file preview...</span>
                  </div>
                ) : previewError ? (
                  <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-3 px-6 text-center text-slate-600">
                    <AlertCircle className="h-8 w-8 text-amber-600" />
                    <p>{previewError}</p>
                  </div>
                ) : (
                  <pre className="scrollbar-gutter-stable h-full overflow-auto whitespace-pre-wrap bg-white p-6 text-sm text-slate-700">
                    {textContent}
                  </pre>
                )
              ) : previewKind === "office" && isLocalFile ? (
                <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-3 px-6 text-center text-slate-600">
                  <AlertCircle className="h-8 w-8 text-amber-600" />
                  <p>Local Office files like this cannot be embedded through the online viewer from `localhost`.</p>
                  <p className="text-sm">DOCX files now open in-app directly, but spreadsheets and slide decks still need a new-tab fallback in local development.</p>
                </div>
              ) : (
                <iframe
                  key={previewKind === "office" ? officeEmbedUrl : resolvedUrl}
                  src={previewKind === "office" ? officeEmbedUrl : resolvedUrl}
                  title={fileName || "File preview"}
                  className="h-full w-full bg-white"
                />
              )}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button asChild variant="secondary">
                <a href={resolvedUrl} target="_blank" rel="noreferrer noopener">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open in new tab
                </a>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
