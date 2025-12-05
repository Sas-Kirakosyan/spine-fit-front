import { useState, useMemo, useEffect } from "react";
import { PageContainer } from "@/Layout/PageContainer";
import type { AvailableEquipmentPageProps } from "@/types/pages";
import type {
  EquipmentTab,
  EquipmentCategory,
  EquipmentItem,
} from "@/types/equipment";
import equipmentsData from "@/MockData/equipments.json";

const createEquipmentData = (): EquipmentCategory[] => {
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

  return categories;
};

export function AvailableEquipmentPage({
  onNavigateBack,
}: AvailableEquipmentPageProps) {
  const [activeTab, setActiveTab] = useState<EquipmentTab>("all");

  const loadEquipmentData = (): EquipmentCategory[] => {
    try {
      const saved = localStorage.getItem("equipmentData");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (error) {
      console.error("Error loading equipment data:", error);
    }
    return createEquipmentData();
  };

  const [equipmentData, setEquipmentData] = useState<EquipmentCategory[]>(
    loadEquipmentData()
  );

  useEffect(() => {
    try {
      localStorage.setItem("equipmentData", JSON.stringify(equipmentData));
      dispatchEvent(new Event("equipmentDataUpdated"));
    } catch (error) {
      console.error("Error saving equipment data:", error);
    }
  }, [equipmentData]);

  const toggleEquipmentSelection = (categoryId: string, itemId: string) => {
    setEquipmentData((prev) =>
      prev.map((category) => {
        if (category.id === categoryId) {
          return {
            ...category,
            items: category.items.map((item) =>
              item.id === itemId ? { ...item, selected: !item.selected } : item
            ),
          };
        }
        return category;
      })
    );
  };

  const filteredData = useMemo(() => {
    if (activeTab === "selected") {
      return equipmentData
        .map((category) => ({
          ...category,
          items: category.items.filter((item) => item.selected),
        }))
        .filter((category) => category.items.length > 0);
    }
    return equipmentData;
  }, [equipmentData, activeTab]);

  const formatWeights = (weights: EquipmentItem["weights"]) => {
    if (weights.length === 0) {
      return "No weights";
    }
    const sorted = [...weights].sort((a, b) => a.weight - b.weight);
    const display = sorted.slice(0, 4);
    const remaining = sorted.length - display.length;
    const displayText = display
      .map((w) => `${w.weight.toFixed(1)} ${w.unit}`)
      .join(", ");
    return remaining > 0 ? `${displayText}...` : displayText;
  };

  return (
    <PageContainer contentClassName="gap-0 px-0">
      {/* Header */}
      <header className="flex items-center gap-2 mt-2 px-3">
        <button
          onClick={onNavigateBack}
          className="flex items-center justify-center w-8 h-8 text-white"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <div className="text-2xl font-semibold text-white flex-1">
          Available Equipment
        </div>
        <button className="flex items-center justify-center w-8 h-8 text-white hover:bg-white/10 rounded-full transition-colors">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </button>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 px-3 mt-4">
        {(["all", "selected"] as EquipmentTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab
                ? "bg-white text-gray-900"
                : "bg-[#1B1E2B] text-gray-400"
            }`}
          >
            {tab === "all" ? "All" : "Selected"}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-3 pb-4 mt-4">
        {filteredData.map((category) => (
          <div key={category.id} className="mb-6">
            <h2 className="text-base font-semibold text-white mb-3">
              {category.name}
            </h2>
            <div className="space-y-3">
              {category.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-[#1B1E2B]/90"
                >
                  {/* Image placeholder */}
                  <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center">
                    {/* Placeholder for future images */}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="text-base font-medium text-white mb-1">
                      {item.name}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <span>{formatWeights(item.weights)}</span>
                      <button className="text-white hover:text-white/80 transition-colors font-medium">
                        Edit
                      </button>
                    </div>
                  </div>

                  {/* Checkbox */}
                  <button
                    onClick={() =>
                      toggleEquipmentSelection(category.id, item.id)
                    }
                    className={`flex-shrink-0 w-6 h-6 flex items-center justify-center border-2 rounded ${
                      item.selected
                        ? "border-white bg-white"
                        : "border-gray-600 hover:border-gray-500"
                    } transition-colors`}
                  >
                    {item.selected && (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="black"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </PageContainer>
  );
}
