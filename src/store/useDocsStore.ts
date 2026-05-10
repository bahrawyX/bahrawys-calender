import { create } from 'zustand';
import { toast } from 'sonner';
import type { DocTreeNode, DocContent, DocPatch, DocSearchResult, CreateDocParams } from '@/types/doc';
import * as docsPersistence from '@/lib/persistence/docsPersistence';

// ── Per-doc debounce map ─────────────────────────────────────────────────────
// A single module-level saveTimer shared across docs meant that switching from
// Doc A → Doc B within the 1s debounce window cancelled A's pending save and
// silently dropped A's unsaved edits. Keyed by docId so each doc's save runs
// independently.
const saveTimers = new Map<string, ReturnType<typeof setTimeout>>();

interface DocsState {
  docs: DocTreeNode[];
  openDocId: string | null;
  openDocContent: DocContent | null;
  expandedIds: string[];
  dbHydrated: boolean;
  isSaving: boolean;
  lastSavedAt: string | null;
  searchQuery: string;
  searchResults: DocSearchResult[];
  isSearching: boolean;

  // Hydration
  hydrateFromDb: (docs: DocTreeNode[]) => void;
  hydrateFromDbFailed: () => void;

  // Navigation
  openDoc: (id: string) => void;
  closeDoc: () => void;
  toggleExpanded: (id: string) => void;
  setExpandedIds: (ids: string[]) => void;

  // CRUD
  createDoc: (params: CreateDocParams) => Promise<string | null>;
  updateDoc: (id: string, patch: DocPatch) => void;
  archiveDoc: (id: string) => void;
  restoreDoc: (id: string) => void;
  deleteDoc: (id: string) => void;
  pinDoc: (id: string, pinned: boolean) => void;
  moveDoc: (id: string, parentId: string | null, position: number) => void;

  // Content
  setOpenDocContent: (doc: DocContent) => void;
  saveContent: (id: string, content: Record<string, unknown>, contentText: string, wordCount: number) => void;

  // Inline tasks
  createInlineTask: (title: string, docId: string) => Promise<string | null>;

  // Search
  search: (query: string) => Promise<void>;
  clearSearch: () => void;
}

export const useDocsStore = create<DocsState>((set, get) => ({
  docs: [],
  openDocId: null,
  openDocContent: null,
  expandedIds: [],
  dbHydrated: false,
  isSaving: false,
  lastSavedAt: null,
  searchQuery: '',
  searchResults: [],
  isSearching: false,

  // ── Hydration ──────────────────────────────────────────────────────────────
  hydrateFromDb: (docs) => {
    if (get().dbHydrated) return;
    set({ dbHydrated: true, docs });
  },

  hydrateFromDbFailed: () => {
    set({ dbHydrated: true });
  },

  // ── Navigation ─────────────────────────────────────────────────────────────
  openDoc: (id) => {
    set({ openDocId: id, openDocContent: null });
  },

  closeDoc: () => {
    set({ openDocId: null, openDocContent: null });
  },

  toggleExpanded: (id) => {
    set((state) => {
      const isExpanded = state.expandedIds.includes(id);
      return {
        expandedIds: isExpanded
          ? state.expandedIds.filter((eid) => eid !== id)
          : [...state.expandedIds, id],
      };
    });
  },

  setExpandedIds: (ids) => {
    set({ expandedIds: ids });
  },

  // ── CRUD ───────────────────────────────────────────────────────────────────
  createDoc: async (params) => {
    const res = await docsPersistence.createOne({
      title: params.title,
      parentId: params.parentId,
      icon: params.icon,
      linkedTaskId: params.linkedTaskId,
      linkedEventId: params.linkedEventId,
      content: params.content,
      contentText: params.contentText,
    });

    if (res.ok === false) {
      if (res.reason === 'unauthorized') {
        toast.error("Couldn't create document", {
          description: 'Your session has expired. Please sign in again.',
        });
      } else if (res.reason === 'network') {
        toast.error("Couldn't create document", { description: 'Check your connection and try again.' });
      } else {
        toast.error("Couldn't create document", { description: `Server error (${res.status ?? 'unknown'})` });
      }
      return null;
    }

    const result = res.doc;
    toast.success('Document created');

    const node: DocTreeNode = {
      id: result.id,
      parentId: result.parentId,
      title: result.title,
      icon: result.icon,
      isPinned: result.isPinned,
      isArchived: result.isArchived,
      position: result.position,
      linkedTaskId: result.linkedTaskId,
      linkedEventId: result.linkedEventId,
      wordCount: result.wordCount,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    };

    set((state) => ({
      docs: [...state.docs, node],
    }));

    // Auto-expand parent if creating a child
    if (params.parentId) {
      set((state) => ({
        expandedIds: state.expandedIds.includes(params.parentId!)
          ? state.expandedIds
          : [...state.expandedIds, params.parentId!],
      }));
    }

    return result.id;
  },

  updateDoc: (id, patch) => {
    // Capture pre-patch state for rollback
    const prevDocs = get().docs;
    const prevDoc = prevDocs.find((d) => d.id === id);

    // Optimistic update
    set((state) => ({
      docs: state.docs.map((d) =>
        d.id === id ? { ...d, ...patch, updatedAt: new Date().toISOString() } : d
      ),
      openDocContent: state.openDocContent?.id === id
        ? { ...state.openDocContent, ...patch }
        : state.openDocContent,
    }));

    // Persist — roll back on error so the UI never lies about what's saved.
    void docsPersistence.updateOne(id, patch).then((result) => {
      if (result.status === 'error' && prevDoc) {
        set((state) => ({
          docs: state.docs.map((d) => (d.id === id ? prevDoc : d)),
        }));
        toast.error("Couldn't save change", { description: 'Check your connection and try again.' });
        return;
      }
      if (result.status === 'success') {
        // Sync the server-confirmed updatedAt onto openDocContent so the next
        // content save's stale-write baseline matches what the server just
        // wrote. Without this, a title edit followed by a content edit
        // produced a 409 because openDocContent.updatedAt was still the
        // pre-title-edit value.
        set((state) => ({
          docs: state.docs.map((d) =>
            d.id === id ? { ...d, updatedAt: result.updatedAt } : d
          ),
          openDocContent: state.openDocContent?.id === id
            ? { ...state.openDocContent, updatedAt: result.updatedAt }
            : state.openDocContent,
        }));
      }
    });
  },

  archiveDoc: (id) => {
    // Snapshot pre-archive state for rollback on failure.
    const prev = get();
    const affectedIds = new Set(
      prev.docs.filter((d) => d.id === id || d.parentId === id).map((d) => d.id)
    );

    set((state) => ({
      docs: state.docs.map((d) => {
        if (d.id === id || d.parentId === id) {
          return { ...d, isArchived: true };
        }
        return d;
      }),
      openDocId: state.openDocId === id ? null : state.openDocId,
      openDocContent: state.openDocId === id ? null : state.openDocContent,
    }));

    void docsPersistence.updateOne(id, { isArchived: true }).then((result) => {
      if (result.status !== 'error') return;
      // Roll back archived flag on every locally-affected doc.
      set((state) => ({
        docs: state.docs.map((d) => (affectedIds.has(d.id) ? { ...d, isArchived: false } : d)),
      }));
      toast.error("Couldn't archive", { description: 'Check your connection and try again.' });
    });
  },

  restoreDoc: (id) => {
    set((state) => ({
      docs: state.docs.map((d) =>
        d.id === id ? { ...d, isArchived: false } : d
      ),
    }));

    docsPersistence.updateOne(id, { isArchived: false });
  },

  deleteDoc: (id) => {
    set((state) => ({
      docs: state.docs.filter((d) => d.id !== id && d.parentId !== id),
      openDocId: state.openDocId === id ? null : state.openDocId,
      openDocContent: state.openDocId === id ? null : state.openDocContent,
    }));

    docsPersistence.deleteOne(id, true);
  },

  pinDoc: (id, pinned) => {
    set((state) => ({
      docs: state.docs.map((d) =>
        d.id === id ? { ...d, isPinned: pinned } : d
      ),
    }));

    void docsPersistence
      .updateOne(id, { isPinned: pinned })
      .then((result) => {
        if (result.status === 'success') {
          toast.success(pinned ? 'Pinned' : 'Unpinned');
          return;
        }
        // Roll back optimistic change on error — updateOne no longer throws,
        // so we must check the return value explicitly.
        set((state) => ({
          docs: state.docs.map((d) =>
            d.id === id ? { ...d, isPinned: !pinned } : d
          ),
        }));
        toast.error(pinned ? "Couldn't pin" : "Couldn't unpin");
      });
  },

  moveDoc: (id, parentId, position) => {
    set((state) => ({
      docs: state.docs.map((d) =>
        d.id === id ? { ...d, parentId, position } : d
      ),
    }));

    docsPersistence.updateOne(id, { parentId, position });
  },

  // ── Content ────────────────────────────────────────────────────────────────
  setOpenDocContent: (doc) => {
    set({ openDocContent: doc, openDocId: doc.id });
  },

  saveContent: (id, content, contentText, wordCount) => {
    // Optimistically update the local view of this doc. Note we only touch
    // `docs[id].updatedAt` for the "last edited" display — we intentionally
    // do NOT overwrite `openDocContent.updatedAt`, because that value is the
    // server-confirmed baseline used for stale-write detection.
    set((state) => ({
      docs: state.docs.map((d) =>
        d.id === id
          ? { ...d, wordCount, updatedAt: new Date().toISOString() }
          : d
      ),
      openDocContent: state.openDocContent?.id === id
        ? { ...state.openDocContent, content, contentText, wordCount }
        : state.openDocContent,
    }));

    // Debounced save to server (1000ms), per-doc so fast doc switching doesn't
    // drop in-flight edits.
    const existing = saveTimers.get(id);
    if (existing) clearTimeout(existing);
    set({ isSaving: true });

    const timer = setTimeout(async () => {
      saveTimers.delete(id);
      // Use the server-confirmed baseline for stale-write protection — if we
      // sent the optimistic `docs[id].updatedAt` the server would always see
      // our own just-written timestamp and the 409 guard would never fire.
      const openDoc = get().openDocContent;
      const baseline = openDoc?.id === id ? openDoc.updatedAt : undefined;

      const result = await docsPersistence.updateOne(id, {
        content,
        contentText,
        wordCount,
        ...(baseline ? { updatedAt: baseline } : {}),
      });

      if (result.status === 'conflict') {
        set({ isSaving: false });
        toast.error("Changes not saved", {
          description: 'This doc was updated elsewhere. Reload to see the latest version.',
        });
        return;
      }
      if (result.status === 'error') {
        set({ isSaving: false });
        toast.error("Couldn't save", { description: 'Check your connection — your edits are still in this window.' });
        return;
      }

      // Success — bump openDocContent.updatedAt to the server-confirmed value
      // so the next save's stale-write baseline matches what the server just
      // wrote. The `docs[id].updatedAt` we optimistically set earlier remains
      // as the display timestamp.
      set((state) => ({
        isSaving: false,
        lastSavedAt: result.updatedAt,
        docs: state.docs.map((d) =>
          d.id === id ? { ...d, updatedAt: result.updatedAt } : d
        ),
        openDocContent: state.openDocContent?.id === id
          ? { ...state.openDocContent, updatedAt: result.updatedAt }
          : state.openDocContent,
      }));
    }, 1000);
    saveTimers.set(id, timer);
  },

  // ── Inline tasks ───────────────────────────────────────────────────────────
  createInlineTask: async (title, docId) => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, linkedDocId: docId }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.id ?? null;
    } catch {
      return null;
    }
  },

  // ── Search ─────────────────────────────────────────────────────────────────
  search: async (query) => {
    if (!query.trim()) {
      set({ searchQuery: '', searchResults: [], isSearching: false });
      return;
    }

    set({ searchQuery: query, isSearching: true });
    const results = await docsPersistence.search(query);
    set({ searchResults: results, isSearching: false });
  },

  clearSearch: () => {
    set({ searchQuery: '', searchResults: [], isSearching: false });
  },
}));
