"use client";

/**
 * Standalone-mode auth client stub.
 * The full Lumina app uses better-auth + a backend. This standalone library
 * pretends a single local user is always signed in so the calendar UI runs
 * exactly the same way without a real auth flow.
 */

import { useSyncExternalStore } from "react";

const STANDALONE_USER = {
  id: "standalone-user",
  name: "Standalone User",
  email: "you@example.com",
  image: null as string | null,
};

const session = {
  user: STANDALONE_USER,
  session: { id: "standalone-session", userId: STANDALONE_USER.id },
};

const subscribe = () => () => {};
const getSnapshot = () => session;
const getServerSnapshot = () => session;

const noop = () => {};

export const authClient = {
  useSession() {
    const data = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
    return { data, isPending: false, isRefetching: false, error: null, refetch: noop };
  },
  async getSession() {
    return { data: session, error: null };
  },
  async signIn() {
    return { data: session, error: null };
  },
  async signUp() {
    return { data: session, error: null };
  },
  async signOut() {
    return { data: null, error: null };
  },
};
