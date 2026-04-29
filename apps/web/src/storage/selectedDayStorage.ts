const KEY = "selectedWorkoutDayIndex";
const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

export function getSelectedDayIndex(): number | null {
  const raw = localStorage.getItem(KEY);
  if (raw === null) return null;
  const idx = parseInt(raw, 10);
  return Number.isNaN(idx) ? null : idx;
}

export function setSelectedDayIndex(index: number): void {
  localStorage.setItem(KEY, String(index));
  notify();
}

export function clearSelectedDayIndex(): void {
  localStorage.removeItem(KEY);
  notify();
}

export function subscribeSelectedDay(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
