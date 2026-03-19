export interface EquipmentWeight {
  id: string;
  weight: number;
  unit: "kg" | "lb";
}

export interface EquipmentItem {
  id: string;
  name: string;
  icon?: string;
  imageUrl?: string;
  weights: EquipmentWeight[];
  selected: boolean;
  category: "small_weights" | "bars_plates";
}

export interface EquipmentCategory {
  id: string;
  name: string;
  items: EquipmentItem[];
}

export type EquipmentTab = "most_used" | "all" | "selected";
