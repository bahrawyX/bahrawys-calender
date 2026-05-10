/**
 * docsPersistence.ts (standalone stub)
 */
import type { DocTreeNode, DocContent, DocPatch, DocSearchResult } from '@/types/doc';

export async function fetchAll(): Promise<DocTreeNode[]> {
  return [];
}

export async function fetchOne(_id: string): Promise<DocContent | null> {
  return null;
}

export async function createOne(_params: {
  id?: string;
  title?: string;
  parentId?: string | null;
  content?: Record<string, unknown>;
  icon?: string;
  templateId?: string;
  linkedTaskId?: string;
  linkedEventId?: string;
  contentText?: string;
}): Promise<
  | { ok: true; doc: DocContent }
  | { ok: false; reason: string; status?: number }
> {
  return { ok: false, reason: 'standalone-mode' };
}

export async function updateOne(_id: string, _patch: DocPatch): Promise<{ status: 'ok' | 'error' | 'success' | 'conflict'; updatedAt?: string }> {
  return { status: 'success' };
}

export async function deleteOne(_id: string, _hard = false): Promise<void> {}

export async function search(_query: string): Promise<DocSearchResult[]> {
  return [];
}
