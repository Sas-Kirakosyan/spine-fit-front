import type { EquipmentItem as EquipmentItemType } from "@/types/equipment";
import { Button } from "@/components/Buttons/Button";

interface EquipmentItemProps {
  item: EquipmentItemType;
  onToggleSelection: () => void;
  onEdit?: () => void;
  formatWeights: (weights: EquipmentItemType["weights"]) => string;
}

export function EquipmentItem({
  item,
  onToggleSelection,
  onEdit,
  formatWeights,
}: EquipmentItemProps) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-[#1B1E2B]/90">
      {/* Image */}
      <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-10 h-10 object-contain"
          />
        ) : (
          <div className="w-10 h-10 bg-gray-700 rounded flex items-center justify-center text-gray-400 text-xs">
            No img
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="text-base font-medium text-white mb-1">{item.name}</div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span>{formatWeights(item.weights)}</span>
          {onEdit && (
            <Button
              onClick={onEdit}
              className="text-white hover:text-white/80 transition-colors font-medium"
            >
              Edit
            </Button>
          )}
        </div>
      </div>

      {/* Checkbox */}
      <Button
        onClick={onToggleSelection}
        className={`flex-shrink-0 w-6 h-6 flex items-center justify-center border-2 rounded ${
          item.selected
            ? "border-white bg-white"
            : "border-gray-600 hover:border-gray-500"
        } transition-colors`}
        ariaLabel={item.selected ? "Deselect equipment" : "Select equipment"}
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
      </Button>
    </div>
  );
}

export default EquipmentItem;
