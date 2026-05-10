'use client';

/**
 * MobileBottomSheet
 *
 * Bottom sheet on mobile, centred modal on desktop. Built on Radix Dialog
 * primitive so:
 *  - Focus is trapped and restored on close
 *  - Outer page is marked `aria-hidden` consistently, preventing the
 *    Chromium "Blocked aria-hidden on an element because its descendant
 *    retained focus" warning when child `<Select>` / `<Popover>` portals
 *    open inside the sheet (Bug #3).
 *  - Escape + outside-click dismiss are handled for free.
 *
 * Drag-to-dismiss on mobile is layered on top via framer-motion.
 */
import React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { motion } from 'framer-motion';
import { useIsMobile } from '@/hooks/useIsMobile';
import { cn } from '@/lib/utils';

interface MobileBottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  draggable?: boolean;
  closeOnBackdrop?: boolean;
  showHandle?: boolean;
}

export const MobileBottomSheet: React.FC<MobileBottomSheetProps> = ({
  open,
  onClose,
  title,
  children,
  className,
  contentClassName,
  draggable = true,
  closeOnBackdrop = true,
  showHandle = true,
}) => {
  const isMobile = useIsMobile();

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay asChild>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-[2px]"
          />
        </DialogPrimitive.Overlay>

        <DialogPrimitive.Content
          aria-label={title}
          onInteractOutside={(e) => {
            if (!closeOnBackdrop) e.preventDefault();
          }}
          onOpenAutoFocus={(e) => {
            // Prevent Radix from auto-focusing the first focusable element —
            // we want the sheet itself to be focused so child popovers
            // (Select/DropdownMenu) don't race the autofocus.
            e.preventDefault();
          }}
          className="fixed inset-0 z-[121] flex items-end md:items-center justify-center outline-none p-0 md:p-4"
          asChild
        >
          <div>
            <motion.div
              role="presentation"
              initial={isMobile ? { y: '100%' } : { opacity: 0, y: 12, scale: 0.97 }}
              animate={isMobile ? { y: 0 } : { opacity: 1, y: 0, scale: 1 }}
              exit={isMobile ? { y: '100%' } : { opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              drag={isMobile && draggable ? 'y' : false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.24 }}
              onDragEnd={(_, info) => {
                if (!isMobile || !draggable) return;
                if (info.offset.y > 110 || info.velocity.y > 650) {
                  onClose();
                }
              }}
              className={cn(
                'pointer-events-auto w-full max-w-md bg-card/95 backdrop-blur-xl border-t border-border md:border md:border-border',
                'rounded-t-3xl md:rounded-2xl shadow-2xl',
                className,
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {isMobile && showHandle && (
                <div className="w-12 h-1.5 bg-muted-foreground/25 rounded-full mx-auto mt-3" />
              )}

              {/* Title + Description are needed for Radix a11y; keep them visually
                  hidden so callers can render their own heading without duplication. */}
              <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
              <DialogPrimitive.Description className="sr-only">{title} dialog</DialogPrimitive.Description>

              <div className={cn('px-4 md:px-6 py-4 md:py-6 pb-[max(1rem,env(safe-area-inset-bottom))]', contentClassName)}>
                {children}
              </div>
            </motion.div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};

MobileBottomSheet.displayName = 'MobileBottomSheet';
