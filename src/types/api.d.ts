/**
 * API Type Definitions
 * These types represent the full data structures from backend/JSON responses
 */

// ============================================
// Equipment API Types
// ============================================

interface PulleyRatio {
  default: string | null;
  alternatives: string[];
  notes: string | null;
}

interface HeightRange {
  min: number;
  max: number;
  increment_cm: number;
}

interface SafetyNotes {
  l5_s1?: string[];
  sciatica?: string[];
  [key: string]: string[] | undefined;
}

interface EquipmentMedia {
  thumbnail: string | null;
  images: string[];
  video_overview: string | null;
}

interface RawEquipmentData {
  id: string;
  key: string;
  type: "machine" | "bench" | "free_weight" | "bodyweight" | string;
  name: string;
  aliases: string[];
  load_type: "cable" | "plate" | "selectorized" | "bodyweight" | null;
  selectorized: boolean;
  pulley_ratio: PulleyRatio;
  weight_stack_kg?: number;
  height_range_cm: HeightRange;
  attachments_supported: string[];
  primary_muscles: string[];
  movement_patterns: string[];
  execution_cues: string[];
  safety_notes: SafetyNotes;
  media: EquipmentMedia;
  details_overview: string;
  is_back_friendly: boolean;
  created_at: string;
  updated_at: string;
  version: number;
}

// ============================================
// Exercise API Types
// ============================================

type IssueType = "l5_s1" | "sciatica" | "herniated_disc" | string;
type RestrictionLevel = "low" | "medium" | "high" | "avoid";
type ExerciseCategory = "strength" | "mobility" | "cardio" | "flexibility" | string;
type DifficultyLevel = "beginner" | "intermediate" | "advanced";
type WeightUnit = "kg" | "lb";

interface BackIssueRestriction {
  id: number;
  exercise_id: number;
  issue_type: IssueType;
  restriction_level: RestrictionLevel;
  recommendation: string;
  created_at: string;
  updated_at: string;
}

interface RawExerciseData {
  id: number;
  name: string;
  description: string;
  category: ExerciseCategory;
  muscle_groups: string[];
  equipment: string;
  difficulty: DifficultyLevel;
  instructions: string;
  video_url: string | null;
  media: Array<{
    type: string;
    source: string;
    url: string;
    primary?: boolean;
  }>;
  is_back_friendly: boolean;
  back_issue_restrictions: BackIssueRestriction[];
  created_at: string;
  updated_at: string;
  sets: number;
  reps: number;
  weight: number;
  weight_unit: WeightUnit;
}

// ============================================
// Generic API Response Types
// ============================================

interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

interface ApiError {
  error: string;
  message: string;
  status: number;
  timestamp: string;
}
