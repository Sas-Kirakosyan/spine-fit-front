import { useState, useMemo, useEffect } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { EquipmentCategory, EquipmentTab, EquipmentItem as EquipmentItemType } from "@spinefit/shared";
import { createEquipmentData } from "@spinefit/shared";
import equipmentsData from "@spinefit/shared/src/MockData/equipments.json";
import { ChevronLeftIcon, CheckIcon } from "../components/icons/Icons";
import { storage } from "../storage/storageAdapter";

export default function AvailableEquipmentScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<EquipmentTab>("all");
  const [equipmentData, setEquipmentData] = useState<EquipmentCategory[]>([]);

  useEffect(() => {
    (async () => {
      const saved = await storage.getJSON<EquipmentCategory[]>("equipmentData");
      if (saved && saved.length > 0) {
        setEquipmentData(saved);
      } else {
        setEquipmentData(createEquipmentData(equipmentsData as any));
      }
    })();
  }, []);

  useEffect(() => {
    if (equipmentData.length > 0) {
      storage.setJSON("equipmentData", equipmentData);
    }
  }, [equipmentData]);

  const toggleSelection = (categoryId: string, itemId: string) => {
    setEquipmentData((prev) =>
      prev.map((cat) =>
        cat.id === categoryId
          ? { ...cat, items: cat.items.map((item) => (item.id === itemId ? { ...item, selected: !item.selected } : item)) }
          : cat
      )
    );
  };

  const filteredData = useMemo(() => {
    if (activeTab === "selected") {
      return equipmentData
        .map((cat) => ({ ...cat, items: cat.items.filter((i) => i.selected) }))
        .filter((cat) => cat.items.length > 0);
    }
    return equipmentData;
  }, [equipmentData, activeTab]);

  const formatWeights = (weights: EquipmentItemType["weights"]) => {
    if (weights.length === 0) return "No weights";
    const sorted = [...weights].sort((a, b) => a.weight - b.weight);
    const display = sorted.slice(0, 4);
    const remaining = sorted.length - display.length;
    const text = display.map((w) => `${w.weight.toFixed(1)} ${w.unit}`).join(", ");
    return remaining > 0 ? `${text}...` : text;
  };

  return (
    <SafeAreaView className="flex-1 bg-[#080A14]" edges={["top"]}>
      <View className="flex-row items-center px-4 py-3">
        <Pressable onPress={() => navigation.goBack()} className="h-10 w-10 rounded-full bg-white/10 items-center justify-center">
          <ChevronLeftIcon size={20} color="white" />
        </Pressable>
        <Text className="flex-1 text-white text-xl font-semibold text-center mr-10">Available Equipment</Text>
      </View>

      {/* Tabs */}
      <View className="flex-row gap-2 px-4 mb-4">
        {(["all", "selected"] as EquipmentTab[]).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg ${activeTab === tab ? "bg-white" : "bg-[#1B1E2B]"}`}
          >
            <Text className={`text-sm font-medium ${activeTab === tab ? "text-gray-900" : "text-gray-400"}`}>
              {tab === "all" ? "All" : "Selected"}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 40 }}>
        {filteredData.map((category) => (
          <View key={category.id} className="mb-6">
            <Text className="text-base font-semibold text-white mb-3">{category.name}</Text>
            <View className="gap-3">
              {category.items.map((item) => (
                <View key={item.id} className="flex-row items-center gap-3 p-3 rounded-xl bg-[#1B1E2B]">
                  <View className="flex-1">
                    <Text className="text-base font-medium text-white mb-1">{item.name}</Text>
                    <Text className="text-sm text-gray-400">{formatWeights(item.weights)}</Text>
                  </View>
                  <Pressable
                    onPress={() => toggleSelection(category.id, item.id)}
                    className={`h-6 w-6 rounded border-2 items-center justify-center ${
                      item.selected ? "border-white bg-white" : "border-gray-600"
                    }`}
                  >
                    {item.selected && <CheckIcon size={14} color="black" />}
                  </Pressable>
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
