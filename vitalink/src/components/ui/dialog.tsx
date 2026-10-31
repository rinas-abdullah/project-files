"use client";
import * as React from "react";
import { Dialog as D } from "radix-ui";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = D.Root;
export const DialogTrigger = D.Trigger;
export const DialogClose = D.Close;

export function DialogContent({ className, children, title, description, wide }: { className?: string; children: React.ReactNode; title: string; description?: string; wide?: boolean }) {
  return (
    <D.Portal>
      <D.Overlay className="fixed inset-0 z-[1000] bg-navy-950/50 backdrop-blur-[2px]" />
      <D.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-[1001] max-h-[92vh] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border bg-white p-5 shadow-2xl focus:outline-none",
          wide ? "max-w-3xl" : "max-w-lg",
          className,
        )}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <D.Title className="text-base font-semibold text-foreground">{title}</D.Title>
            {description ? <D.Description className="mt-1 text-xs text-muted-foreground">{description}</D.Description> : <D.Description className="sr-only">{title}</D.Description>}
          </div>
          <D.Close className="rounded-md p-1 text-muted-foreground hover:bg-muted" aria-label="Close">
            <X className="size-4" />
          </D.Close>
        </div>
        {children}
      </D.Content>
    </D.Portal>
  );
}
