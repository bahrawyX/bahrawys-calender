/**
 * Shadcn-style Sidebar primitives.
 * API matches the official shadcn/ui Sidebar spec.
 * State (collapsed/expanded) is managed externally via Zustand — no cookies/context needed.
 */

import * as React from 'react';
import { cn } from '../../lib/utils';

/* ─── Root ─────────────────────────────────────────────────────────────────── */

export interface SidebarProps extends React.HTMLAttributes<HTMLElement> {}

const Sidebar = React.forwardRef<HTMLElement, SidebarProps>(
  ({ className, children, ...props }, ref) => (
    <aside
      ref={ref}
      data-sidebar="sidebar"
      className={cn('flex h-full w-full flex-col', className)}
      {...props}
    >
      {children}
    </aside>
  )
);
Sidebar.displayName = 'Sidebar';

/* ─── Header ────────────────────────────────────────────────────────────────── */

const SidebarHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      data-sidebar="header"
      className={cn('flex flex-col', className)}
      {...props}
    >
      {children}
    </div>
  )
);
SidebarHeader.displayName = 'SidebarHeader';

/* ─── Content ───────────────────────────────────────────────────────────────── */

const SidebarContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      data-sidebar="content"
      className={cn('flex flex-1 flex-col overflow-y-auto overflow-x-hidden', className)}
      {...props}
    >
      {children}
    </div>
  )
);
SidebarContent.displayName = 'SidebarContent';

/* ─── Footer ────────────────────────────────────────────────────────────────── */

const SidebarFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      data-sidebar="footer"
      className={cn('flex flex-col', className)}
      {...props}
    >
      {children}
    </div>
  )
);
SidebarFooter.displayName = 'SidebarFooter';

/* ─── Group ─────────────────────────────────────────────────────────────────── */

const SidebarGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      data-sidebar="group"
      className={cn('relative flex w-full min-w-0 flex-col', className)}
      {...props}
    >
      {children}
    </div>
  )
);
SidebarGroup.displayName = 'SidebarGroup';

/* ─── GroupLabel ────────────────────────────────────────────────────────────── */

const SidebarGroupLabel = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      data-sidebar="group-label"
      className={cn(
        'px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground select-none whitespace-nowrap overflow-hidden',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
SidebarGroupLabel.displayName = 'SidebarGroupLabel';

/* ─── GroupContent ──────────────────────────────────────────────────────────── */

const SidebarGroupContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      data-sidebar="group-content"
      className={cn('w-full min-w-0', className)}
      {...props}
    >
      {children}
    </div>
  )
);
SidebarGroupContent.displayName = 'SidebarGroupContent';

/* ─── Menu ──────────────────────────────────────────────────────────────────── */

const SidebarMenu = React.forwardRef<HTMLUListElement, React.HTMLAttributes<HTMLUListElement>>(
  ({ className, children, ...props }, ref) => (
    <ul
      ref={ref}
      data-sidebar="menu"
      className={cn('flex w-full min-w-0 flex-col gap-0.5 list-none', className)}
      {...props}
    >
      {children}
    </ul>
  )
);
SidebarMenu.displayName = 'SidebarMenu';

/* ─── MenuItem ──────────────────────────────────────────────────────────────── */

const SidebarMenuItem = React.forwardRef<HTMLLIElement, React.HTMLAttributes<HTMLLIElement>>(
  ({ className, children, ...props }, ref) => (
    <li
      ref={ref}
      data-sidebar="menu-item"
      className={cn('group/menu-item relative', className)}
      {...props}
    >
      {children}
    </li>
  )
);
SidebarMenuItem.displayName = 'SidebarMenuItem';

/* ─── MenuButton ────────────────────────────────────────────────────────────── */

export interface SidebarMenuButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isActive?: boolean;
  tooltip?: string;
}

const SidebarMenuButton = React.forwardRef<HTMLButtonElement, SidebarMenuButtonProps>(
  ({ className, isActive, children, tooltip, ...props }, ref) => (
    <button
      ref={ref}
      data-sidebar="menu-button"
      data-active={isActive}
      title={tooltip}
      className={cn(
        // Minimal shell. The WorkspaceItem wraps this and draws its own
        // active wash + 2px left rail via motion.div layoutIds, so the
        // button itself must stay background-less when active — otherwise
        // you get a double-fill (shadcn pill + our wash on top).
        'peer/menu-button flex w-full items-center gap-3 overflow-hidden rounded-lg px-3 py-2 text-sm text-left outline-none transition-colors duration-150 whitespace-nowrap',
        'text-muted-foreground hover:text-foreground hover:bg-foreground/[0.03] dark:hover:bg-foreground/[0.04]',
        'focus-visible:ring-2 focus-visible:ring-ring',
        isActive && 'text-foreground font-medium',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
);
SidebarMenuButton.displayName = 'SidebarMenuButton';

/* ─── Separator ─────────────────────────────────────────────────────────────── */

const SidebarSeparator = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('mx-3 my-1 h-px bg-border/60', className)}
      {...props}
    />
  )
);
SidebarSeparator.displayName = 'SidebarSeparator';

/* ─── Exports ────────────────────────────────────────────────────────────────── */

export {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
};
