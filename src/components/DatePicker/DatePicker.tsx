import { useState, lazy, Suspense } from "react";
const DayPicker = lazy(() => import("react-day-picker").then(mod => ({ default: mod.DayPicker })));
import "react-day-picker/style.css";

// use DatePicker via conditional rendering isOpenDatePicker && DayPicker
export const DatePicker = () => {
  const [selected, setSelected] = useState<Date>();

  return (
    <Suspense fallback={<div>Загрузка календаря...</div>}>
      <DayPicker
        mode="single"
        selected={selected}
        onSelect={setSelected}
        footer={
          selected ? `Selected: ${selected.toLocaleDateString()}` : "Pick a day."
        }
      />
    </Suspense>
  );
};
