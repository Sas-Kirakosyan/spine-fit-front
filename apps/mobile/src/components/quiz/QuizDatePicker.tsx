import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  ScrollView,
  Pressable,
  StyleSheet,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 1930 + 1 }, (_, i) => 1930 + i);

function getDaysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate();
}

interface WheelColumnProps {
  items: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  width: number;
}

function WheelColumn({ items, selectedIndex, onSelect, width }: WheelColumnProps) {
  const scrollRef = useRef<ScrollView>(null);
  const isMounted = useRef(false);

  useEffect(() => {
    const y = selectedIndex * ITEM_HEIGHT;
    if (!isMounted.current) {
      const timer = setTimeout(() => {
        scrollRef.current?.scrollTo({ y, animated: false });
        isMounted.current = true;
      }, 50);
      return () => clearTimeout(timer);
    } else {
      scrollRef.current?.scrollTo({ y, animated: true });
    }
  }, [selectedIndex]);

  const handleMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
    onSelect(Math.max(0, Math.min(items.length - 1, index)));
  };

  const handleScrollEndDrag = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
    onSelect(Math.max(0, Math.min(items.length - 1, index)));
  };

  return (
    <ScrollView
      ref={scrollRef}
      showsVerticalScrollIndicator={false}
      snapToInterval={ITEM_HEIGHT}
      decelerationRate="fast"
      onMomentumScrollEnd={handleMomentumScrollEnd}
      onScrollEndDrag={handleScrollEndDrag}
      contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * 2 }}
      style={{ width, height: ITEM_HEIGHT * VISIBLE_ITEMS }}
    >
      {items.map((item, index) => {
        const isSelected = index === selectedIndex;
        return (
          <View
            key={index}
            style={[styles.itemRow, { height: ITEM_HEIGHT }]}
          >
            <Text
              style={[
                styles.itemText,
                isSelected ? styles.itemSelected : styles.itemFaded,
              ]}
            >
              {item}
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

interface QuizDatePickerProps {
  visible: boolean;
  value?: string; // "YYYY-MM-DD"
  onConfirm: (dateString: string) => void;
  onCancel: () => void;
}

export function QuizDatePicker({ visible, value, onConfirm, onCancel }: QuizDatePickerProps) {
  const parseValue = () => {
    if (value) {
      const d = new Date(value + "T00:00:00");
      if (!isNaN(d.getTime())) {
        const yearIdx = YEARS.indexOf(d.getFullYear());
        return {
          month: d.getMonth(),
          day: d.getDate() - 1,
          year: yearIdx >= 0 ? yearIdx : YEARS.indexOf(1990),
        };
      }
    }
    return { month: 0, day: 0, year: YEARS.indexOf(1990) };
  };

  const [monthIndex, setMonthIndex] = useState(parseValue().month);
  const [dayIndex, setDayIndex] = useState(parseValue().day);
  const [yearIndex, setYearIndex] = useState(parseValue().year);

  // Reset state when picker opens
  useEffect(() => {
    if (visible) {
      const parsed = parseValue();
      setMonthIndex(parsed.month);
      setDayIndex(parsed.day);
      setYearIndex(parsed.year);
    }
  }, [visible]);

  const year = YEARS[yearIndex];
  const daysInMonth = getDaysInMonth(monthIndex + 1, year);
  const days = Array.from({ length: daysInMonth }, (_, i) => String(i + 1));

  // Clamp day index when month/year changes
  useEffect(() => {
    if (dayIndex >= daysInMonth) {
      setDayIndex(daysInMonth - 1);
    }
  }, [daysInMonth]);

  const handleConfirm = () => {
    const y = YEARS[yearIndex];
    const m = monthIndex + 1;
    const d = dayIndex + 1;
    const dateStr = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    onConfirm(dateStr);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Date of Birth</Text>

          <View style={styles.pickerArea}>
            {/* Selection indicator lines */}
            <View
              pointerEvents="none"
              style={[styles.selectionLine, { top: ITEM_HEIGHT * 2 }]}
            />
            <View
              pointerEvents="none"
              style={[styles.selectionLine, { top: ITEM_HEIGHT * 3 }]}
            />

            <View style={styles.columns}>
              <WheelColumn
                items={MONTHS}
                selectedIndex={monthIndex}
                onSelect={setMonthIndex}
                width={88}
              />
              <WheelColumn
                items={days}
                selectedIndex={dayIndex}
                onSelect={setDayIndex}
                width={52}
              />
              <WheelColumn
                items={YEARS.map(String)}
                selectedIndex={yearIndex}
                onSelect={setYearIndex}
                width={76}
              />
            </View>
          </View>

          <View style={styles.buttons}>
            <Pressable onPress={onCancel} style={styles.button}>
              <Text style={styles.buttonText}>Cancel</Text>
            </Pressable>
            <Pressable onPress={handleConfirm} style={styles.button}>
              <Text style={styles.buttonText}>OK</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return dateStr;
  const month = MONTHS[d.getMonth()];
  return `${month} ${d.getDate()}, ${d.getFullYear()}`;
}

export { formatDate };

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    backgroundColor: "#132f54",
    borderRadius: 18,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
    width: 300,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  title: {
    color: "white",
    fontSize: 23,
    fontWeight: "700",
    marginBottom: 16,
  },
  pickerArea: {
    position: "relative",
    marginBottom: 20,
  },
  selectionLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth + 0.5,
    backgroundColor: "rgba(255,255,255,0.28)",
    zIndex: 1,
  },
  columns: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 4,
  },
  itemRow: {
    justifyContent: "center",
    alignItems: "center",
  },
  itemText: {
    fontSize: 22,
  },
  itemSelected: {
    color: "white",
    fontSize: 26,
    fontWeight: "600",
  },
  itemFaded: {
    color: "rgba(255,255,255,0.32)",
    fontWeight: "400",
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 28,
  },
  button: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  buttonText: {
    color: "#f97316",
    fontSize: 21,
    fontWeight: "600",
  },
});
