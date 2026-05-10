"use client";

import { useTheme } from "@/components/theme-provider";
import { Toaster as Sonner, type ToasterProps } from "sonner";

/**
 * shadcn Sonner wrapper — theme-aware toast container.
 *
 * Renders with `unstyled: true` so Sonner strips its visual defaults
 * (colors, borders, shadows, padding). Animations, positioning, and
 * stacking are preserved. The entire visual layer is Tailwind classes
 * using semantic tokens — zero hardcoded colors, zero !important.
 *
 * Type differentiation: icon color only (no left accent border).
 *   success → emerald-500, error → destructive, warning → amber-500, info → primary
 */
function Toaster({ ...props }: ToasterProps) {
  const { resolvedTheme = "dark" } = useTheme();

  return (
    <Sonner
      theme={resolvedTheme as ToasterProps["theme"]}
      position="bottom-right"
      offset={20}
      gap={8}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "font-sans rounded-lg border border-border bg-card shadow-sm text-foreground p-4 max-w-[356px] w-[356px] flex items-center gap-3",
          title: "text-foreground text-[13px] font-medium leading-snug",
          description: "text-muted-foreground text-[12px] leading-snug",
          actionButton:
            "bg-primary text-primary-foreground rounded-md text-xs font-medium px-3 py-1.5",
          cancelButton:
            "bg-muted text-muted-foreground rounded-md text-xs font-medium px-3 py-1.5",
          closeButton:
            "border border-border bg-card text-muted-foreground hover:text-foreground",
          icon: "w-4 h-4 shrink-0",
          success: "[&>[data-icon]]:text-emerald-500",
          error: "[&>[data-icon]]:text-destructive",
          warning: "[&>[data-icon]]:text-amber-500",
          info: "[&>[data-icon]]:text-primary",
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
