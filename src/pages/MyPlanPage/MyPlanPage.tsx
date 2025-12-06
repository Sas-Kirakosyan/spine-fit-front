import { useState, useEffect } from "react";
import { PageContainer } from "@/Layout/PageContainer";
import type { MyPlanPageProps } from "@/types/pages";
import type { EquipmentCategory } from "@/types/equipment";
import { Button } from "@/components/Buttons/Button";
import {
  ChevronRightIcon,
  ChevronDownIcon,
  ThreeDotsIcon,
} from "@/components/Icons/Icons";
import { MyPlanPageHeader } from "./MyPlanPageHeader";

export function MyPlanPage({
  onNavigateBack,
  onNavigateToAvailableEquipment,
}: MyPlanPageProps) {
  const [bodyweightOnly, setBodyweightOnly] = useState(false);
  const [warmUpSets, setWarmUpSets] = useState(true);
  const [selectedCount, setSelectedCount] = useState(0);

  useEffect(() => {
    const calculateSelectedCount = () => {
      try {
        const saved = localStorage.getItem("equipmentData");
        if (saved) {
          const equipmentData: EquipmentCategory[] = JSON.parse(saved);
          const count = equipmentData.reduce(
            (total, category) =>
              total + category.items.filter((item) => item.selected).length,
            0
          );
          setSelectedCount(count);
        } else {
          setSelectedCount(0);
        }
      } catch (error) {
        console.error("Error calculating selected count:", error);
        setSelectedCount(0);
      }
    };

    calculateSelectedCount();

    const handleFocus = () => {
      calculateSelectedCount();
    };

    const handleEquipmentUpdate = () => {
      calculateSelectedCount();
    };

    addEventListener("focus", handleFocus);
    addEventListener("equipmentDataUpdated", handleEquipmentUpdate);

    return () => {
      removeEventListener("focus", handleFocus);
      removeEventListener("equipmentDataUpdated", handleEquipmentUpdate);
    };
  }, []);

  return (
    <PageContainer contentClassName="gap-8 px-3">
      <MyPlanPageHeader onNavigateBack={onNavigateBack} />

      <div className="flex flex-col flex-1 gap-6">
        {/* Goal Section */}
        <Button className="w-full rounded-[14px] bg-main p-4 flex items-center justify-between text-white">
          <span className="text-lg font-semibold">Goal</span>
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold">Reduce Bodyweight</span>
            <ChevronRightIcon className="h-5 w-5" />
          </div>
        </Button>

        {/* Location Section */}
        <div className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-white/60">
            LOCATION
          </h2>
          <div className="flex items-center justify-between">
            <Button className="text-lg font-semibold text-white flex items-center gap-2 hover:text-white/80 transition-colors">
              My Gym
              <ChevronDownIcon />
            </Button>
            <Button className="text-white hover:bg-white/10 rounded-full p-2 transition-colors">
              <ThreeDotsIcon />
            </Button>
          </div>

          {/* Equipment Card */}
          <div className="rounded-[14px] bg-[#1B1E2B]/90 p-4 shadow-xl ring-1 ring-white/5">
            <div className="space-y-4">
              <Button
                onClick={onNavigateToAvailableEquipment}
                className="w-full flex items-center justify-between text-left"
              >
                <span className="text-base font-medium text-white">
                  Equipment
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-base font-medium text-white">
                    {selectedCount} Selected
                  </span>
                  <ChevronRightIcon className="h-5 w-5" />
                </div>
              </Button>

              <div className="flex items-center justify-between">
                <span className="text-base font-medium text-white">
                  Bodyweight-Only
                </span>
                <Button
                  onClick={() => setBodyweightOnly(!bodyweightOnly)}
                  className={`relative w-12 h-7 rounded-full transition-colors ${
                    bodyweightOnly ? "bg-main" : "bg-gray-600"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform ${
                      bodyweightOnly ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Training Profile Section */}
        <div className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-white/60">
            TRAINING PROFILE
          </h2>
          <div className="rounded-[14px] bg-[#1B1E2B]/90 p-4 shadow-xl ring-1 ring-white/5">
            <div className="space-y-4">
              <Button className="w-full flex items-center justify-between text-left">
                <span className="text-base font-medium text-white">
                  Workouts / Week
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-base font-medium text-white">3</span>
                  <ChevronRightIcon className="h-5 w-5" />
                </div>
              </Button>

              <Button className="w-full flex items-center justify-between text-left">
                <span className="text-base font-medium text-white">
                  Duration
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-base font-medium text-white">1 hr</span>
                  <ChevronRightIcon className="h-5 w-5" />
                </div>
              </Button>

              <Button className="w-full flex items-center justify-between text-left">
                <span className="text-base font-medium text-white">
                  Experience
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-base font-medium text-white">
                    Intermediate
                  </span>
                  <ChevronRightIcon className="h-5 w-5" />
                </div>
              </Button>
            </div>
          </div>
        </div>

        {/* Training Format Section */}
        <div className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-white/60">
            TRAINING FORMAT
          </h2>
          <div className="rounded-[14px] bg-[#1B1E2B]/90 p-4 shadow-xl ring-1 ring-white/5">
            <div className="space-y-4">
              <Button className="w-full flex items-center justify-between text-left">
                <span className="text-base font-medium text-white">
                  Training Split
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-base font-medium text-white">
                    Push/Pull/Legs
                  </span>
                  <ChevronRightIcon className="h-5 w-5" />
                </div>
              </Button>

              <Button className="w-full flex items-center justify-between text-left">
                <span className="text-base font-medium text-white">
                  Exercise Variability
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-base font-medium text-white">
                    Balanced
                  </span>
                  <ChevronRightIcon className="h-5 w-5" />
                </div>
              </Button>

              <div className="flex items-center justify-between">
                <span className="text-base font-medium text-white">
                  Warm-Up Sets
                </span>
                <Button
                  onClick={() => setWarmUpSets(!warmUpSets)}
                  className={`relative w-12 h-7 rounded-full transition-colors ${
                    warmUpSets ? "bg-main" : "bg-gray-600"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform ${
                      warmUpSets ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
