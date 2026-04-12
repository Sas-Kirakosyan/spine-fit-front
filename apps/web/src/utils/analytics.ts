import ReactGA from "react-ga4";
import type { Page } from "@/types/navigation";

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

const pagePathMap: Record<Page, string> = {
  home: "/",
  login: "/login",
  register: "/register",
  workout: "/workout",
  progress: "/progress",
  history: "/history",
  ai: "/ai",
  exerciseSets: "/exercise-sets",
  exerciseDetails: "/exercise-details",
  activeWorkout: "/active-workout",
  allExercise: "/all-exercise",
  myPlan: "/my-plan",
  availableEquipment: "/available-equipment",
  settings: "/settings",
  createProgram: "/create-program",
  exerciseProgress: "/exercise-progress",
};

let initialized = false;
let lastTrackedPath: string | null = null;

type AnalyticsParams = Record<
  string,
  string | number | boolean | null | undefined
>;

const normalizeParams = (
  params: AnalyticsParams
): Record<string, string | number | boolean> => {
  const normalized: Record<string, string | number | boolean> = {};

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) continue;

    normalized[key] =
      typeof value === "string" ? value.trim().slice(0, 120) : value;
  }

  return normalized;
};

export const initAnalytics = (): void => {
  if (!GA_MEASUREMENT_ID || initialized) return;
  ReactGA.initialize(GA_MEASUREMENT_ID);
  initialized = true;
};

export const trackPageView = (page: Page): void => {
  if (!initialized) return;

  const path = pagePathMap[page];
  if (!path || path === lastTrackedPath) return;

  ReactGA.send({
    hitType: "pageview",
    page: path,
    title: page,
  });

  lastTrackedPath = path;
};

export const trackEvent = (
  eventName: string,
  params: AnalyticsParams = {}
): void => {
  if (!initialized) return;

  ReactGA.event(eventName, normalizeParams(params));
};
