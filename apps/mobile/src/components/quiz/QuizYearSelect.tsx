import { useMemo, useState } from "react";
import { FlatList, Modal, Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { ChevronDownIcon } from "../icons/Icons";

const ITEM_HEIGHT = 48;

interface QuizYearSelectProps {
  value: string;
  min?: number;
  max?: number;
  onChange: (value: string) => void;
}

export function QuizYearSelect({
  value,
  min,
  max,
  onChange,
}: QuizYearSelectProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const currentYear = new Date().getFullYear();
  const maxYear = max ?? currentYear - 18;
  const minYear = min ?? 1930;

  const years = useMemo(() => {
    const list: string[] = [];
    for (let y = maxYear; y >= minYear; y--) {
      list.push(String(y));
    }
    return list;
  }, [maxYear, minYear]);

  const placeholder = t("quiz.input.selectYear", {
    defaultValue: "Select year",
  });
  const isEmpty = !value;
  const selectedIndex = years.indexOf(value);

  return (
    <View className="w-full">
      <Pressable
        onPress={() => setOpen(true)}
        className="w-full flex-row items-center justify-between rounded-lg border-2 border-gray-300 bg-white px-4 py-3"
      >
        <Text
          className={`text-lg ${isEmpty ? "text-gray-400" : "text-gray-900"}`}
        >
          {isEmpty ? placeholder : value}
        </Text>
        <ChevronDownIcon size={20} color="#6b7280" />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          className="flex-1 items-center justify-center bg-black/50 px-8"
          onPress={() => setOpen(false)}
        >
          <View
            className="max-h-[50%] w-full rounded-lg border-2 border-gray-200 bg-white py-1"
            onStartShouldSetResponder={() => true}
          >
            <FlatList
              data={years}
              keyExtractor={(item) => item}
              getItemLayout={(_, index) => ({
                length: ITEM_HEIGHT,
                offset: ITEM_HEIGHT * index,
                index,
              })}
              initialScrollIndex={selectedIndex >= 0 ? selectedIndex : 0}
              renderItem={({ item }) => {
                const isSelected = item === value;
                return (
                  <Pressable
                    onPress={() => {
                      onChange(item);
                      setOpen(false);
                    }}
                    style={{ height: ITEM_HEIGHT }}
                    className={`justify-center px-4 ${
                      isSelected ? "bg-main/10" : ""
                    }`}
                  >
                    <Text
                      className={`text-lg ${
                        isSelected
                          ? "font-semibold text-main"
                          : "text-gray-900"
                      }`}
                    >
                      {item}
                    </Text>
                  </Pressable>
                );
              }}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
