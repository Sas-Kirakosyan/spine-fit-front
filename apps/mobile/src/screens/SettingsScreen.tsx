import { useState, useEffect } from "react";
import { View, Text, Pressable, ScrollView, Alert, Modal, Linking } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import i18n from "i18next";
import { ChevronLeftIcon, ChevronRightIcon } from "../components/icons/Icons";
import { storage } from "../storage/storageAdapter";

function SettingsItem({
  label,
  value,
  subValue,
  onPress,
  showArrow = true,
}: {
  label: string;
  value?: string;
  subValue?: string;
  onPress?: () => void;
  showArrow?: boolean;
}) {
  return (
    <Pressable onPress={onPress} className="flex-row items-center justify-between py-4 border-b border-white/5">
      <Text className="text-base font-medium text-white">{label}</Text>
      <View className="flex-row items-center gap-2">
        {value && (
          <View>
            <Text className="text-sm text-white/40 text-right">{value}</Text>
            {subValue && <Text className="text-xs text-white/30 text-right">{subValue}</Text>}
          </View>
        )}
        {showArrow && <ChevronRightIcon size={14} color="rgba(255,255,255,0.3)" />}
      </View>
    </Pressable>
  );
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mb-6">
      <Text className="text-[10px] font-semibold uppercase tracking-widest text-white/40 mb-2 px-4">{title}</Text>
      <View className="px-4">{children}</View>
    </View>
  );
}

interface ModalConfig {
  title: string;
  options: string[];
  descriptions?: string[];
  selectedValue: string;
  onSelect: (value: string) => void;
}

export default function SettingsScreen() {
  const navigation = useNavigation();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [language, setLanguage] = useState(() => (i18n.language === "ru" ? "Russian" : "English"));
  const [bodyProfileSummary, setBodyProfileSummary] = useState("Not set");
  const [modalConfig, setModalConfig] = useState<ModalConfig | null>(null);
  const [modalSelectedIndex, setModalSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const email = await storage.getItem("userEmail");
      if (email) setUserEmail(email);
    })();
    loadBodyProfile();
  }, []);

  useEffect(() => {
    const handler = () => setLanguage(i18n.language === "ru" ? "Russian" : "English");
    i18n.on("languageChanged", handler);
    return () => { i18n.off("languageChanged", handler); };
  }, []);

  const loadBodyProfile = async () => {
    const stored = await storage.getJSON<{ gender?: string; height?: number; heightUnit?: string; weight?: number; weightUnit?: string }>("bodyProfile");
    if (stored) {
      const parts: string[] = [];
      if (stored.gender) parts.push(stored.gender);
      if (stored.height) parts.push(`${stored.height} ${stored.heightUnit || "cm"}`);
      if (stored.weight) parts.push(`${stored.weight} ${stored.weightUnit || "kg"}`);
      if (parts.length > 0) { setBodyProfileSummary(parts.join(" • ")); return; }
    }
    setBodyProfileSummary("Not set");
  };

  const handleLogout = async () => {
    await storage.removeItem("userEmail");
  };

  const openModal = (config: ModalConfig) => {
    const idx = config.options.findIndex((o) => o === config.selectedValue);
    setModalSelectedIndex(idx >= 0 ? idx : null);
    setModalConfig(config);
  };

  const handleModalApply = () => {
    if (modalConfig && modalSelectedIndex !== null) {
      modalConfig.onSelect(modalConfig.options[modalSelectedIndex]);
    }
    setModalConfig(null);
  };

  const handleLanguageChange = () => {
    openModal({
      title: "Change Language",
      options: ["English", "Russian"],
      selectedValue: language,
      onSelect: (value) => {
        setLanguage(value);
        i18n.changeLanguage(value === "Russian" ? "ru" : "en");
      },
    });
  };

  const handleContactSupport = () => {
    Alert.alert("Contact Support", "Email: support@spinefit.com", [
      { text: "Send Email", onPress: () => Linking.openURL("mailto:support@spinefit.com") },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#080A14]" edges={["top"]}>
      <View className="flex-row items-center px-4 py-3">
        <Pressable onPress={() => navigation.goBack()} className="h-10 w-10 rounded-full bg-white/10 items-center justify-center">
          <ChevronLeftIcon size={20} color="white" />
        </Pressable>
        <Text className="flex-1 text-white text-xl font-semibold text-center mr-10">Settings</Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40, paddingTop: 16 }}>
        <SettingsSection title="Account">
          <SettingsItem label="Email Address" value={userEmail || "Not logged in"} showArrow={false} />
          <SettingsItem label="Language" value={language} onPress={handleLanguageChange} />
          <SettingsItem label="Change Password" onPress={() => {}} />
          <SettingsItem label="Log Out" onPress={handleLogout} showArrow={false} />
        </SettingsSection>

        <View className="mx-4 border-t border-white/10 mb-6" />

        <SettingsSection title="About You">
          <SettingsItem label="Body Profile" value={bodyProfileSummary} onPress={() => {}} />
        </SettingsSection>

        <View className="mx-4 border-t border-white/10 mb-6" />

        <SettingsSection title="Help">
          <SettingsItem label="Contact Support" onPress={handleContactSupport} />
        </SettingsSection>

        <View className="mx-4 border-t border-white/10 mb-6" />

        <SettingsSection title="Legal">
          <SettingsItem label="Terms & Conditions" onPress={() => {}} />
          <SettingsItem label="Privacy Policy" onPress={() => {}} />
          <SettingsItem label="Version" value="1.0.0" showArrow={false} />
        </SettingsSection>
      </ScrollView>

      {/* Selection Modal */}
      <Modal visible={!!modalConfig} animationType="slide" transparent>
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-[#080A14] rounded-t-3xl">
            <View className="flex-row items-center justify-between px-5 pt-5 pb-3">
              <Text className="text-2xl font-semibold text-white">{modalConfig?.title}</Text>
              <Pressable onPress={handleModalApply} className="rounded-xl bg-white/10 px-4 py-2">
                <Text className="text-white text-sm font-medium">Done</Text>
              </Pressable>
            </View>
            <ScrollView className="px-5 pb-8" contentContainerStyle={{ paddingBottom: 40, gap: 8 }}>
              {modalConfig?.options.map((option, index) => (
                <Pressable
                  key={option}
                  onPress={() => setModalSelectedIndex(index)}
                  className={`rounded-2xl p-4 border ${modalSelectedIndex === index ? "border-[#e77d10] bg-[#e77d10]/20" : "border-white/10 bg-[#1B1E2B]"}`}
                >
                  <View className="flex-row items-center gap-3">
                    <View className={`h-5 w-5 rounded-full border-2 items-center justify-center ${modalSelectedIndex === index ? "border-[#e77d10] bg-[#e77d10]" : "border-white/30"}`}>
                      {modalSelectedIndex === index && <View className="h-2 w-2 rounded-full bg-white" />}
                    </View>
                    <Text className="text-white font-medium">{option}</Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
