import { useSyncExternalStore } from 'react';
import { live } from '../lib/live';
let now = Date.now(),
  timer;
const listeners = new Set();
function subscribe(listener) {
  listeners.add(listener);
  if (!timer)
    timer = setInterval(() => {
      now = Date.now();
      listeners.forEach((update) => update());
    }, 250);
  return () => {
    listeners.delete(listener);
    if (!listeners.size) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}
const snapshot = () => now + (live.offset || 0);
export function useServerTime() {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}
