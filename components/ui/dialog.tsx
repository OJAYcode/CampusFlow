"use client";

/* eslint-disable simple-import-sort/imports */
import { X } from "lucide-react";
import * as React from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

interface DialogProps {
 open: boolean;
 onOpenChange: (open: boolean) => void;
 children: React.ReactNode;
}

interface DialogContentProps {
 children: React.ReactNode;
 className?: string;
 showCloseButton?: boolean;
}

const DialogContext = React.createContext<{ onOpenChange: (open: boolean) => void } | null>(null);

const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children }) => {
 const [mounted, setMounted] = React.useState(false);

 React.useEffect(() => {
 setMounted(true);

 return () => {
 setMounted(false);
 };
 }, []);

 React.useEffect(() => {
 const handleEscape = (e: KeyboardEvent) => {
 if (e.key === "Escape") {
 onOpenChange(false);
 }
 };

 if (open) {
 document.addEventListener("keydown", handleEscape);
 document.body.style.overflow = "hidden";
 }

 return () => {
 document.removeEventListener("keydown", handleEscape);
 document.body.style.overflow = "unset";
 };
 }, [open, onOpenChange]);

 if (!open || !mounted) return null;

 return createPortal(
 <DialogContext.Provider value={{ onOpenChange }}>
  <div
  className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6"
  role="dialog"
  aria-modal="true"
  >
  <div
  className="absolute inset-0 bg-slate-950/35 backdrop-blur-[2px]"
  onClick={() => onOpenChange(false)}
  />
  <div className="relative z-[121] flex max-h-full w-full items-center justify-center">
  {children}
  </div>
  </div>
 </DialogContext.Provider>,
 document.body,
 );
};

const DialogContent: React.FC<DialogContentProps> = ({
 children,
 className,
 showCloseButton = true,
}) => {
 const dialogContext = React.useContext(DialogContext);

 return (
 <div className="w-full max-w-3xl">
 <div
 className={cn(
 "modal-scroll-shell relative max-h-[min(88vh,900px)] w-full overflow-y-auto rounded-[28px] border border-slate-200 bg-white p-5 pr-4 text-slate-900 shadow-[0_32px_100px_rgba(15,23,42,0.22)] sm:p-7 sm:pr-6",
 className,
 )}
 onClick={(e) => e.stopPropagation()}
 >
 {showCloseButton && dialogContext ? (
 <button
 type="button"
 aria-label="Close dialog"
 className="absolute right-3 top-3 z-20 inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white/96 text-slate-500 shadow-sm transition hover:border-slate-300 hover:text-slate-900 sm:right-4 sm:top-4"
 onClick={() => dialogContext.onOpenChange(false)}
 >
 <X className="h-5 w-5" />
 </button>
 ) : null}
 {children}
 </div>
 </div>
 );
};

const DialogHeader: React.FC<{
 children: React.ReactNode;
 className?: string;
}> = ({ children, className }) => (
 <div
 className={cn(
 "mb-5 flex flex-col space-y-1 sm:text-left",
 className,
 )}
 >
 {children}
 </div>
);

const DialogTitle: React.FC<{
 children: React.ReactNode;
 className?: string;
}> = ({ children, className }) => (
 <h2
 className={cn(
 "text-foreground text-lg font-semibold leading-tight tracking-tight",
 className,
 )}
 >
 {children}
 </h2>
);

const DialogDescription: React.FC<{
 children: React.ReactNode;
 className?: string;
}> = ({ children, className }) => (
 <p className={cn("text-muted-foreground text-sm", className)}>{children}</p>
);

export { Dialog, DialogContent, DialogDescription,DialogHeader, DialogTitle };
