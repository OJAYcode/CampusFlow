"use client";

import { Upload, X } from "lucide-react";
import type { ChangeEvent } from "react";

import { Button } from "@/src/components/ui/button";
import { formatFileSize } from "@/src/utils/format";

export function FileUploader({
  files,
  onFilesChange,
  maxFiles = 5,
  multiple = true,
}: {
  files: File[];
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
  multiple?: boolean;
}) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFiles = Array.from(event.target.files || []).slice(0, maxFiles);
    onFilesChange(nextFiles);
  };

  return (
    <div className="space-y-3">
      <label className="flex cursor-pointer flex-col items-center justify-center rounded-[5px] border border-dashed border-[var(--border)] bg-[#f8fafc] px-4 py-8 text-center">
        <div className="mb-3 grid h-12 w-12 place-items-center rounded-[5px] bg-[rgba(0,74,173,0.08)] text-[var(--primary)]">
          <Upload className="h-5 w-5" />
        </div>
        <span className="text-sm font-medium text-slate-900">Upload files</span>
        <span className="mt-1 text-xs text-slate-500">
          Up to {maxFiles} file{maxFiles === 1 ? "" : "s"}
        </span>
        <input className="hidden" multiple={multiple} onChange={handleChange} type="file" />
      </label>
      {!!files.length && (
        <div className="space-y-2">
          {files.map((file) => (
            <div
              key={`${file.name}-${file.size}`}
              className="flex items-center justify-between rounded-[5px] border border-[var(--border)] bg-white px-3 py-2"
            >
              <div>
                <p className="text-sm font-medium text-slate-900">{file.name}</p>
                <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
              </div>
              <Button
                size="sm"
                type="button"
                variant="ghost"
                onClick={() => onFilesChange(files.filter((item) => item.name !== file.name))}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
