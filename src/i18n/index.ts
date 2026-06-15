import { getLocales } from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en.json";

/**
 * i18n scaffolding — ships English only, but every string flows through `t(...)`,
 * so adding a language is just another JSON file registered here. Device locale
 * is detected up front; unknown locales fall back to English.
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
