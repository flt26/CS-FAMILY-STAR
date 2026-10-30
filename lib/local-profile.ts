'use client';

import { useSyncExternalStore } from 'react';

// What this device remembers: the nickname reviews are posted under, and the
// verdicts it has given. Nothing here is an account — it lives in localStorage.

const NICKNAME_KEY = 'csfs:nickname';
const LEGACY_NICKNAME_KEY = 'fue_student_name';
const VERDICTS_KEY = 'csfs:verdicts';
const CHANGE_EVENT = 'csfs:profile';

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Private mode or storage disabled: the value just won't stick.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener('storage', onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

const readNickname = () => read(NICKNAME_KEY) ?? read(LEGACY_NICKNAME_KEY) ?? '';
const serverNickname = () => '';

export function useNickname(): string {
  return useSyncExternalStore(subscribe, readNickname, serverNickname);
}

export function saveNickname(name: string) {
  write(NICKNAME_KEY, name);
}

export type Verdicts = Readonly<Record<string, number>>;

const NO_VERDICTS: Verdicts = {};
let cachedRaw: string | null = null;
let cachedVerdicts: Verdicts = NO_VERDICTS;

// useSyncExternalStore needs the same object back while nothing changed.
function readVerdicts(): Verdicts {
  const raw = read(VERDICTS_KEY);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      const parsed: unknown = raw ? JSON.parse(raw) : {};
      cachedVerdicts = parsed && typeof parsed === 'object' ? (parsed as Verdicts) : NO_VERDICTS;
    } catch {
      cachedVerdicts = NO_VERDICTS;
    }
  }
  return cachedVerdicts;
}

export function useMyVerdicts(): Verdicts {
  return useSyncExternalStore(subscribe, readVerdicts, () => NO_VERDICTS);
}

export function rememberVerdict(spotId: string, rating: number) {
  write(VERDICTS_KEY, JSON.stringify({ ...readVerdicts(), [spotId]: rating }));
}
