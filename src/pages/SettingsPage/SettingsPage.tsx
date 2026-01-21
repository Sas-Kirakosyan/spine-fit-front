import { useEffect, useState } from "react";
import { PageContainer } from "@/Layout/PageContainer";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/Icons/Icons";
import { Button } from "@/components/Buttons/Button";
import { auth } from "@/firebase/config";
import type { SettingsPageProps } from "@/types/pages";

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
            {subValue && (
              <p className="text-xs text-slate-500">{subValue}</p>
            )}
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
  return (
    <div className="mx-4 border-t border-white/10" />
  );
}

export function SettingsPage({ onNavigateBack }: SettingsPageProps) {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isGoogleUser, setIsGoogleUser] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setUserEmail(user.email);
      // Проверяем, авторизован ли пользователь через Google
      const isGoogle = user.providerData.some(
        (provider) => provider.providerId === "google.com"
      );
      setIsGoogleUser(isGoogle);
    } else {
      // Если пользователь не авторизован через Firebase, проверяем localStorage
      const savedEmail = localStorage.getItem("userEmail");
      if (savedEmail) {
        setUserEmail(savedEmail);
      }
    }
  }, []);

  const handleLogout = () => {
    auth.signOut();
    localStorage.removeItem("userEmail");
    localStorage.removeItem("currentPage");
    window.location.reload();
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
        <h1 className="text-xl font-semibold text-white">Settings</h1>
      </header>

      {/* Account Section */}
      <SettingsSection title="Account">
        <SettingsItem
          label="Email Address"
          value={userEmail || "Not logged in"}
          subValue={isGoogleUser ? "Signed in with Google" : undefined}
          showArrow={false}
        />
        <SettingsItem
          label="Subscribe to log unlimited workouts"
          onClick={() => { }}
        />
        <SettingsItem label="Change Password" onClick={() => { }} />
        <SettingsItem label="Change Theme" onClick={() => { }} />
        <SettingsItem
          label="Log Out"
          onClick={handleLogout}
          showArrow={false}
        />
      </SettingsSection>

      <Divider />

      {/* Help Section */}
      <SettingsSection title="Help">
        <SettingsItem label="Contact Support" onClick={() => { }} />
        <SettingsItem label="Permanently Delete Account" onClick={() => { }} />
      </SettingsSection>

      <Divider />

      {/* Legal Section */}
      <SettingsSection title="Legal">
        <SettingsItem label="Terms & Conditions" onClick={() => { }} />
        <SettingsItem label="Privacy Policy" onClick={() => { }} />
        <SettingsItem
          label="Version"
          value="1.0.0"
          showArrow={false}
        />
      </SettingsSection>
    </PageContainer>
  );
}
