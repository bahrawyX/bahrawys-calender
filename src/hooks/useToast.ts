'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
  duration?: number;
}

type ToastState = { toasts: Toast[] };
type ToastAction =
  | { type: 'ADD'; toast: Toast }
  | { type: 'REMOVE'; id: string };

const TOAST_LIMIT = 5;
const DEFAULT_DURATION = 4000;

let count = 0;
function genId() { return `toast-${++count}`; }

function reducer(state: ToastState, action: ToastAction): ToastState {
  switch (action.type) {
    case 'ADD':
      return { toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT) };
    case 'REMOVE':
      return { toasts: state.toasts.filter(t => t.id !== action.id) };
  }
}

const listeners: Array<(state: ToastState) => void> = [];
let memState: ToastState = { toasts: [] };

function dispatch(action: ToastAction) {
  memState = reducer(memState, action);
  listeners.forEach(l => l(memState));
}

export function toast(props: Omit<Toast, 'id'>) {
  const id = genId();
  const duration = props.duration ?? DEFAULT_DURATION;
  dispatch({ type: 'ADD', toast: { ...props, id } });
  setTimeout(() => dispatch({ type: 'REMOVE', id }), duration);
  return id;
}

export function useToast() {
  const [state, setState] = React.useState<ToastState>(memState);
  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const idx = listeners.indexOf(setState);
      if (idx > -1) listeners.splice(idx, 1);
    };
  }, []);
  return {
    toasts: state.toasts,
    toast,
    dismiss: (id: string) => dispatch({ type: 'REMOVE', id }),
  };
}
