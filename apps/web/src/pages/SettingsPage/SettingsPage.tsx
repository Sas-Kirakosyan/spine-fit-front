import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import { PageContainer } from "@/Layout/PageContainer";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/Icons/Icons";
import { Button } from "@/components/Buttons/Button";
import { SelectionModal } from "@/components/SelectionModal/SelectionModal";
import type { SettingsPageProps } from "@/types/pages";

interface ModalConfig {
  title: string;
  options: string[];
  descriptions?: string[];
  headerDescription?: string;
  selectedValue: string;
  onSelect: (value: string) => void;
}

interface SettingsItemProps {
  label: string;
  value?: string;
  subValue?: string;
  onClick?: () => void;
  showArrow?: boolean;
}

function SettingsItem({
  label,
  value,
  subValue,
  onClick,
  showArrow = true,
}: SettingsItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between py-4 text-left transition hover:opacity-80"
    >
      <span className="text-base font-medium text-white">{label}</span>
      <div className="flex items-center gap-2">
        {value && (
          <div className="text-right">
            <span className="text-sm text-slate-400">{value}</span>
            {subValue && <p className="text-xs text-slate-500">{subValue}</p>}
          </div>
        )}
        {showArrow && <ChevronRightIcon className="h-4 w-4 text-slate-500" />}
      </div>
    </button>
  );
}

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
}

function SettingsSection({ title, children }: SettingsSectionProps) {
  return (
    <section className="px-4">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-500">
        {title}
      </h2>
      <div className="divide-y divide-white/10">{children}</div>
    </section>
  );
}
function Divider() {
  return <div className="mx-4 border-t border-white/10" />;
}

function SettingsPage({ onNavigateBack }: SettingsPageProps) {
  const { t } = useTranslation();
  const [modalConfig, setModalConfig] = useState<ModalConfig | null>(null);
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "Dark"
  );
  const [language, setLanguage] = useState(() => {
    const currentLang = i18n.language;
    return currentLang === "ru" ? "Russian" : "English";
  });
  // Sync language state with i18next language
  useEffect(() => {
    const handleLanguageChanged = () => {
      const currentLang = i18n.language;
      setLanguage(currentLang === "ru" ? "Russian" : "English");
    };

    i18n.on("languageChanged", handleLanguageChanged);
    return () => {
      i18n.off("languageChanged", handleLanguageChanged);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("userEmail");
    localStorage.removeItem("currentPage");
    window.location.reload();
  };

  const openModal = (config: ModalConfig) => {
    setModalConfig(config);
  };

  const closeModal = () => {
    setModalConfig(null);
  };

  const handleThemeChange = () => {
    openModal({
      title: t("settingsPage.modals.changeTheme"),
      options: ["Light", "Dark", "System"],
      descriptions: [
        t("settingsPage.modals.themeLightDesc"),
        t("settingsPage.modals.themeDarkDesc"),
        t("settingsPage.modals.themeSystemDesc"),
      ],
      selectedValue: theme,
      onSelect: (value) => {
        setTheme(value);
        localStorage.setItem("theme", value);
      },
    });
  };

  const handleLanguageChange = () => {
    openModal({
      title: t("settingsPage.modals.changeLanguage"),
      options: ["English", "Russian"],
      selectedValue: language,
      onSelect: (value) => {
        setLanguage(value);
        const langCode = value === "Russian" ? "ru" : "en";
        i18n.changeLanguage(langCode);
        localStorage.setItem("language", value);
      },
    });
  };

  const handleSubscription = () => {
    openModal({
      title: t("settingsPage.modals.subscriptionPlans"),
      options: ["Free", "Monthly", "Annual"],
      descriptions: [
        t("settingsPage.modals.subFreeDesc"),
        t("settingsPage.modals.subMonthlyDesc"),
        t("settingsPage.modals.subAnnualDesc"),
      ],
      headerDescription: t("settingsPage.modals.subHeader"),
      selectedValue: "Free",
      onSelect: (value) => {
        console.log("Selected subscription:", value);
      },
    });
  };

  const handleContactSupport = () => {
    openModal({
      title: t("settingsPage.modals.contactSupport"),
      options: [
        t("settingsPage.modals.supportEmail"),
        t("settingsPage.modals.supportChat"),
        t("settingsPage.modals.supportFaq"),
      ],
      descriptions: [
        t("settingsPage.modals.supportEmailDesc"),
        t("settingsPage.modals.supportChatDesc"),
        t("settingsPage.modals.supportFaqDesc"),
      ],
      selectedValue: "",
      onSelect: (value) => {
        if (value === "Email Support") {
          window.open("mailto:support@spinefit.com", "_blank");
        } else if (value === "FAQ") {
          console.log("Open FAQ");
        }
      },
    });
  };

  return (
    <PageContainer contentClassName="gap-6">
      <header className="flex items-center gap-4 px-4 py-4">
        <Button
          onClick={onNavigateBack}
          className="flex items-center justify-center rounded-lg p-1 transition hover:bg-white/10"
        >
          <ChevronLeftIcon className="h-6 w-6 text-main" />
        </Button>
        <h1 className="text-xl font-semibold text-white">
          {t("settingsPage.title")}
        </h1>
      </header>

      {/* Account Section */}
      <SettingsSection title={t("settingsPage.sections.account")}>
        <SettingsItem
          label={t("settingsPage.items.emailAddress")}
          showArrow={false}
        />
        <SettingsItem
          label={t("settingsPage.items.language")}
          value={language}
          onClick={handleLanguageChange}
        />
        <SettingsItem
          label={t("settingsPage.items.subscribe")}
          onClick={handleSubscription}
        />
        <SettingsItem
          label={t("settingsPage.items.changePassword")}
          onClick={() => {}}
        />
        <SettingsItem
          label={t("settingsPage.items.changeTheme")}
          value={theme}
          onClick={handleThemeChange}
        />
        <SettingsItem
          label={t("settingsPage.items.logOut")}
          onClick={handleLogout}
          showArrow={false}
        />
      </SettingsSection>

      <Divider />

      {/* Help Section */}
      <SettingsSection title={t("settingsPage.sections.help")}>
        <SettingsItem
          label={t("settingsPage.items.contactSupport")}
          onClick={handleContactSupport}
        />
        <SettingsItem
          label={t("settingsPage.items.deleteAccount")}
          onClick={() => {}}
        />
      </SettingsSection>

      <Divider />

      {/* Legal Section */}
      <SettingsSection title={t("settingsPage.sections.legal")}>
        <SettingsItem
          label={t("settingsPage.items.termsAndConditions")}
          onClick={() => {}}
        />
        <SettingsItem
          label={t("settingsPage.items.privacyPolicy")}
          onClick={() => {}}
        />
        <SettingsItem
          label={t("settingsPage.items.version")}
          value="1.0.0"
          showArrow={false}
        />
      </SettingsSection>

      {/* Selection Modal */}
      {modalConfig && (
        <SelectionModal
          isOpen={!!modalConfig}
          onClose={closeModal}
          title={modalConfig.title}
          options={modalConfig.options}
          descriptions={modalConfig.descriptions}
          headerDescription={modalConfig.headerDescription}
          selectedValue={modalConfig.selectedValue}
          onSelect={modalConfig.onSelect}
        />
      )}

    </PageContainer>
  );
}

export default SettingsPage;
