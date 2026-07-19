import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import ruTranslations from "@spinefit/shared/src/i18n/locales/ru.json";
import enTranslations from "@spinefit/shared/src/i18n/locales/en.json";
import { storage } from "../storage/storageAdapter";

export const LANGUAGE_STORAGE_KEY = "language";

const resources = {
  ru: { translation: ruTranslations },
  en: { translation: enTranslations },
};

const deviceLanguage = Localization.getLocales()[0]?.languageCode ?? "ru";

i18n.use(initReactI18next).init({
  resources,
  lng: deviceLanguage,
  fallbackLng: "ru",
  debug: false,
  interpolation: {
    escapeValue: false,
  },
});

// Restore the language the user picked in the LanguageSelector (if any).
storage.getItem(LANGUAGE_STORAGE_KEY).then((saved) => {
  if (saved && saved in resources && saved !== i18n.language) {
    i18n.changeLanguage(saved);
  }
});

export default i18n;
