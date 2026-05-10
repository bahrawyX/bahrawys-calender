'use client';

/**
 * PageTransition — wraps route content.
 *
 * Previously used AnimatePresence mode="wait" which forced a 300ms
 * delay on every route change (150ms exit + 150ms enter). Removed
 * entirely — route changes are now instant. The layout class is
 * preserved so nothing breaks downstream.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      {children}
    </div>
  );
}
