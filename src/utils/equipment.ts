import type { EquipmentCategory, EquipmentItem } from "@/types/equipment";


export const createEquipmentData = (
  equipmentsData: RawEquipmentData[]
): EquipmentCategory[] => {
  const groupedByType = equipmentsData.reduce((acc, equipment) => {
    const type = equipment.type || "other";
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(equipment);
    return acc;
  }, {} as Record<string, typeof equipmentsData>);

  const categories: EquipmentCategory[] = Object.entries(groupedByType).map(
    ([type, items]) => {
      const categoryName =
        type === "machine"
          ? "Machines"
          : type === "bench"
            ? "Benches"
            : type === "free_weight"
              ? "Free Weights"
              : "Other";

      const categoryId =
        type === "machine"
          ? "machines"
          : type === "bench"
            ? "benches"
            : type === "free_weight"
              ? "free_weights"
              : "other";

      const equipmentItems: EquipmentItem[] = items.map((eq) => {
        const weights: EquipmentItem["weights"] = eq.weight_stack_kg
          ? [{ id: `${eq.id}_weight`, weight: eq.weight_stack_kg, unit: "kg" }]
          : [];

        return {
          id: eq.id,
          name: eq.name,
          imageUrl: eq.media?.thumbnail || eq.media?.images?.[0] || undefined,
          weights,
          selected: false,
          category: categoryId as "small_weights" | "bars_plates",
        };
      });

      return {
        id: categoryId,
        name: categoryName,
        items: equipmentItems,
      };
    }
  );
  console.log("categories", categories);
  return categories;
};