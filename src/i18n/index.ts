import { getLocales } from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en.json";

/**
 * i18n is scaffolded but ships a single language (English).
 *
 * Every user-facing string flows through `t(...)`, so adding a language later is
 * just dropping in another JSON file and registering it here — no code changes.
 * The device locale is detected up front; unknown locales fall back to English.
 */
export const resources = {
  en: { translation: en },
} as const;

const deviceLanguage = getLocales()[0]?.languageCode ?? "en";

i18n.use(initReactI18next).init({
  resources,
  lng: deviceLanguage in resources ? deviceLanguage : "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18n;
