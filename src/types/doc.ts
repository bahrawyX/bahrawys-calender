/** Lightweight doc node for sidebar tree (no content field). */
export interface DocTreeNode {
  id: string;
  parentId: string | null;
  title: string;
  icon: string | null;
  isPinned: boolean;
  isArchived: boolean;
  position: number;
  linkedTaskId: string | null;
  linkedEventId: string | null;
  wordCount: number;
  createdAt: string;
  updatedAt: string;
}

/** Full doc with content for editing. Tiptap JSON shape: `{ type: 'doc', content: [...] }`. */
export interface DocContent extends DocTreeNode {
  content: Record<string, unknown> | null;
  contentText: string;
  coverImage: string | null;
  coverGradient: number | null;
}

/** Parameters for creating a new doc. */
export interface CreateDocParams {
  title?: string;
  parentId?: string | null;
  icon?: string;
  position?: number;
  template?: string;
  linkedTaskId?: string;
  linkedEventId?: string;
  /** Pre-filled Tiptap JSON content — used by Smart Templates. */
  content?: Record<string, unknown>;
  /** Plain-text mirror of `content` for FTS / word count. */
  contentText?: string;
}

/** Partial update for doc fields. */
export interface DocPatch {
  title?: string;
  content?: Record<string, unknown>;
  contentText?: string;
  wordCount?: number;
  icon?: string | null;
  coverImage?: string | null;
  coverGradient?: number | null;
  isArchived?: boolean;
  isPinned?: boolean;
  position?: number;
  parentId?: string | null;
  linkedTaskId?: string | null;
  linkedEventId?: string | null;
}

/** Search result from FTS. */
export interface DocSearchResult {
  id: string;
  title: string;
  icon: string | null;
  parentId: string | null;
  updatedAt: string;
  excerpt: string;
}
