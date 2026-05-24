/**
 * navigation.store.ts
 * Minimal Zustand slice for cross-screen navigation state.
 *
 * Used to pass a taskId from the killed-state notification handler
 * (app/_layout.tsx) to the nurse task list (tasks/index.tsx) without
 * going through URL params.
 */
import { create } from 'zustand';

interface NavigationState {
  /** Task ID waiting to be highlighted on the task list screen. */
  pendingHighlightTaskId: string | null;
  setPendingHighlightTaskId: (id: string | null) => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  pendingHighlightTaskId: null,
  setPendingHighlightTaskId: (id) => set({ pendingHighlightTaskId: id }),
}));
