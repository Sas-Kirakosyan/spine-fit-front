import { useState, useEffect } from "react";
import { PageContainer } from "@/Layout/PageContainer";
import type { MyPlanPageProps } from "@/types/pages";
import type { EquipmentCategory } from "@/types/equipment";

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
      <header className="flex items-center gap-2 mt-2">
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
        <div className="text-2xl font-semibold text-white">My Plan</div>
      </header>

      <div className="flex flex-col flex-1 gap-6">
        {/* Goal Section */}
        <button className="w-full rounded-[14px] bg-main p-4 flex items-center justify-between text-white">
          <span className="text-lg font-semibold">Goal</span>
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold">Reduce Bodyweight</span>
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
              <path d="m9 18 6-6-6-6" />
            </svg>
          </div>
        </button>

        {/* Location Section */}
        <div className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-white/60">
            LOCATION
          </h2>
          <div className="flex items-center justify-between">
            <button className="text-lg font-semibold text-white flex items-center gap-2 hover:text-white/80 transition-colors">
              My Gym
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            <button className="text-white hover:bg-white/10 rounded-full p-2 transition-colors">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="1" />
                <circle cx="19" cy="12" r="1" />
                <circle cx="5" cy="12" r="1" />
              </svg>
            </button>
          </div>

          {/* Equipment Card */}
          <div className="rounded-[14px] bg-[#1B1E2B]/90 p-4 shadow-xl ring-1 ring-white/5">
            <div className="space-y-4">
              <button
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
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </div>
              </button>

              <div className="flex items-center justify-between">
                <span className="text-base font-medium text-white">
                  Bodyweight-Only
                </span>
                <button
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
                </button>
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
              <button className="w-full flex items-center justify-between text-left">
                <span className="text-base font-medium text-white">
                  Workouts / Week
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-base font-medium text-white">3</span>
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
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </div>
              </button>

              <button className="w-full flex items-center justify-between text-left">
                <span className="text-base font-medium text-white">
                  Duration
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-base font-medium text-white">1 hr</span>
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
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </div>
              </button>

              <button className="w-full flex items-center justify-between text-left">
                <span className="text-base font-medium text-white">
                  Experience
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-base font-medium text-white">
                    Intermediate
                  </span>
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
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </div>
              </button>
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
              <button className="w-full flex items-center justify-between text-left">
                <span className="text-base font-medium text-white">
                  Training Split
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-base font-medium text-white">
                    Push/Pull/Legs
                  </span>
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
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </div>
              </button>

              <button className="w-full flex items-center justify-between text-left">
                <span className="text-base font-medium text-white">
                  Exercise Variability
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-base font-medium text-white">
                    Balanced
                  </span>
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
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </div>
              </button>

              <div className="flex items-center justify-between">
                <span className="text-base font-medium text-white">
                  Warm-Up Sets
                </span>
                <button
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
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
