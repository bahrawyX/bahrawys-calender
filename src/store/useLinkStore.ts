import { create } from 'zustand';

interface PendingCompletion {
  taskId: string;
  taskTitle: string;
}

interface LinkStoreState {
  /** Queue of tasks awaiting completion prompt */
  queue: PendingCompletion[];
  /** Currently displayed prompt (first in queue) */
  pendingTaskCompletion: PendingCompletion | null;

  promptTaskCompletion: (taskId: string, taskTitle: string) => void;
  dismissPrompt: () => void;
  confirmTaskCompletion: () => void;
}

export const useLinkStore = create<LinkStoreState>((set, get) => ({
  queue: [],
  pendingTaskCompletion: null,

  promptTaskCompletion: (taskId, taskTitle) => {
    const { queue, pendingTaskCompletion } = get();
    // Avoid duplicates
    if (
      pendingTaskCompletion?.taskId === taskId ||
      queue.some((q) => q.taskId === taskId)
    ) {
      return;
    }
    const entry = { taskId, taskTitle };
    if (!pendingTaskCompletion) {
      set({ pendingTaskCompletion: entry });
    } else {
      set({ queue: [...queue, entry] });
    }
  },

  dismissPrompt: () => {
    const { queue } = get();
    if (queue.length > 0) {
      const [next, ...rest] = queue;
      set({ pendingTaskCompletion: next, queue: rest });
    } else {
      set({ pendingTaskCompletion: null });
    }
  },

  confirmTaskCompletion: () => {
    const { pendingTaskCompletion } = get();
    if (!pendingTaskCompletion) return;
    // Lazy import to avoid circular dependency
    import('./useTaskBoardStore').then(({ useTaskBoardStore }) => {
      useTaskBoardStore.getState().updateTask(pendingTaskCompletion.taskId, { status: 'done' });
    });
    get().dismissPrompt();
  },
}));
