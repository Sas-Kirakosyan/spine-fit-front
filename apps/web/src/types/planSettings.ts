// Re-export types from shared package
export type { PlanFieldId, FieldConfig, PlanSettings } from "@spinefit/shared";
export { planFieldsConfig } from "@spinefit/shared";

// Re-export storage functions from web storage layer
export { loadPlanSettings, savePlanSettings } from "@/storage/planSettingsStorage";
