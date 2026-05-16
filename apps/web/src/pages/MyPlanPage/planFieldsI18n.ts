import type { TFunction } from "i18next";
import { planFieldsConfig, type PlanFieldId } from "@/types/planSettings";

type SlugMap = Record<string, string>;

const optionSlugs: Record<PlanFieldId, SlugMap> = {
  goal: {
    "Build Muscle & Strength": "hypertrophy",
    "Continue Rehab & Recovery": "recovery",
  },
  workoutsPerWeek: {
    "1 day per week": "d1",
    "2 days per week": "d2",
    "3 days per week": "d3",
    "4 days per week": "d4",
    "5 days per week": "d5",
    "6 days per week": "d6",
    "7 days per week": "d7",
  },
  duration: {
    "30 min": "min30",
    "45 min": "min45",
    "1 hr": "h1",
    "1 hr 30 min": "h1m30",
    "2 hr": "h2",
  },
  experience: {
    Advanced: "advanced",
    Intermediate: "intermediate",
    Beginner: "beginner",
  },
  trainingSplit: {
    "Push/Pull/Legs": "pushPullLegs",
    "Upper/Lower": "upperLower",
    "Full Body": "fullBody",
    "Fresh Muscle Groups": "freshMuscleGroups",
  },
  exerciseVariability: {
    "More Consistent": "moreConsistent",
    Balanced: "balanced",
    "More Variable": "moreVariable",
  },
  units: {
    kg: "kg",
    lb: "lb",
  },
  cardio: {
    Off: "off",
    On: "on",
  },
  stretching: {
    Off: "off",
    On: "on",
  },
};

function optionKey(id: PlanFieldId, englishValue: string): string | undefined {
  return optionSlugs[id][englishValue];
}

export function getFieldTitle(t: TFunction, id: PlanFieldId): string {
  return t(`myPlanPage.fields.${id}.title`, planFieldsConfig[id].title);
}

export function getFieldHeaderDescription(
  t: TFunction,
  id: PlanFieldId,
): string | undefined {
  const fallback = planFieldsConfig[id].headerDescription;
  if (!fallback) return undefined;
  return t(`myPlanPage.fields.${id}.headerDescription`, fallback);
}

export function getFieldOptionLabel(
  t: TFunction,
  id: PlanFieldId,
  englishValue: string,
): string {
  const slug = optionKey(id, englishValue);
  if (!slug) return englishValue;
  return t(`myPlanPage.fields.${id}.options.${slug}.label`, englishValue);
}

export function getFieldOptionDescription(
  t: TFunction,
  id: PlanFieldId,
  englishValue: string,
  fallback?: string,
): string | undefined {
  const slug = optionKey(id, englishValue);
  if (!slug) return fallback;
  const key = `myPlanPage.fields.${id}.options.${slug}.description`;
  const translated = t(key, { defaultValue: fallback ?? "" });
  return translated || undefined;
}

export interface TranslatedField {
  title: string;
  headerDescription?: string;
  options: string[];
  optionLabels: string[];
  descriptions?: string[];
}

export function getTranslatedField(
  t: TFunction,
  id: PlanFieldId,
): TranslatedField {
  const config = planFieldsConfig[id];
  const optionLabels = config.options.map((opt) =>
    getFieldOptionLabel(t, id, opt),
  );
  const descriptions = config.description
    ? config.options.map(
        (opt, idx) =>
          getFieldOptionDescription(t, id, opt, config.description?.[idx]) ?? "",
      )
    : undefined;

  return {
    title: getFieldTitle(t, id),
    headerDescription: getFieldHeaderDescription(t, id),
    options: config.options,
    optionLabels,
    descriptions,
  };
}
