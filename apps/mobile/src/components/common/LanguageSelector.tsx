import { useRef, useState } from "react";
import { View, Text, Pressable, Modal, Dimensions } from "react-native";
import { useTranslation } from "react-i18next";
import { ChevronDownIcon } from "../icons/Icons";
import { storage } from "../../storage/storageAdapter";
import { LANGUAGE_STORAGE_KEY } from "../../i18n/config";

const languages = [
  { code: "en", label: "English", flag: "\u{1F1EC}\u{1F1E7}", short: "EN" },
  { code: "ru", label: "Русский", flag: "\u{1F1F7}\u{1F1FA}", short: "RU" },
];

export function LanguageSelector() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [anchor, setAnchor] = useState({ top: 0, right: 0 });
  const pillRef = useRef<View>(null);

  const currentLang = languages.find((l) => l.code === i18n.language) || languages[0];

  const openDropdown = () => {
    pillRef.current?.measureInWindow((x, y, width, height) => {
      setAnchor({
        top: y + height + 4,
        right: Dimensions.get("window").width - (x + width),
      });
      setIsOpen(true);
    });
  };

  const handleSelect = (code: string) => {
    i18n.changeLanguage(code);
    storage.setItem(LANGUAGE_STORAGE_KEY, code);
    setIsOpen(false);
  };

  return (
    <View>
      <Pressable
        ref={pillRef}
        onPress={openDropdown}
        className="flex-row items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5"
      >
        <Text className="text-sm font-medium text-white">{currentLang.short}</Text>
        <View style={{ transform: [{ rotate: isOpen ? "180deg" : "0deg" }] }}>
          <ChevronDownIcon size={12} color="white" />
        </View>
      </Pressable>

      <Modal
        visible={isOpen}
        transparent
        statusBarTranslucent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable className="flex-1" onPress={() => setIsOpen(false)}>
          <View
            className="min-w-[140px] overflow-hidden rounded-xl border border-white/10 bg-[#1a1a2e] shadow-lg"
            style={{ position: "absolute", top: anchor.top, right: anchor.right }}
          >
            {languages.map((lang) => (
              <Pressable
                key={lang.code}
                onPress={() => handleSelect(lang.code)}
                className={`flex-row items-center gap-2 px-4 py-2.5 ${
                  lang.code === currentLang.code ? "bg-white/5" : ""
                }`}
              >
                <Text className="text-base">{lang.flag}</Text>
                <Text className="text-sm text-white">{lang.label}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
