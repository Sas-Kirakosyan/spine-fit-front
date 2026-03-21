import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import ReactCountryFlag from "react-country-flag";

const languages = [
  { code: "en", label: "English", countryCode: "GB", short: "EN" },
  { code: "ru", label: "\u0420\u0443\u0441\u0441\u043A\u0438\u0439", countryCode: "RU", short: "RU" },
];

export function LanguageSelector() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const currentLang = languages.find((l) => l.code === i18n.language) || languages[0];

  const handleSelect = (code: string) => {
    i18n.changeLanguage(code);
    localStorage.setItem("language", code === "ru" ? "Russian" : "English");
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur px-3 py-1.5 text-sm font-medium text-white transition hover:bg-white/20"
      >
        {currentLang.short}
        <svg
          className={`h-3 w-3 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 min-w-[140px] rounded-xl bg-[#1a1a2e] shadow-lg border border-white/10 overflow-hidden z-50">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm text-white transition hover:bg-white/10 ${
                lang.code === currentLang.code ? "bg-white/5" : ""
              }`}
            >
              <ReactCountryFlag countryCode={lang.countryCode} svg style={{ width: "1.2em", height: "1.2em" }} />
              <span>{lang.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
