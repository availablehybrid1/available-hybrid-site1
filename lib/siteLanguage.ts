export type SiteLanguage = "en" | "es" | "zh" | "ko" | "vi" | "hy" | "tl" | "ru" | "ar";

export const SITE_LANGUAGES: Array<{
  code: SiteLanguage;
  label: string;
  htmlLang: string;
  dir: "ltr" | "rtl";
}> = [
  { code: "en", label: "English", htmlLang: "en", dir: "ltr" },
  { code: "es", label: "Español", htmlLang: "es", dir: "ltr" },
  { code: "zh", label: "中文", htmlLang: "zh", dir: "ltr" },
  { code: "ko", label: "한국어", htmlLang: "ko", dir: "ltr" },
  { code: "vi", label: "Tiếng Việt", htmlLang: "vi", dir: "ltr" },
  { code: "hy", label: "Հայերեն", htmlLang: "hy", dir: "ltr" },
  { code: "tl", label: "Tagalog", htmlLang: "tl", dir: "ltr" },
  { code: "ru", label: "Русский", htmlLang: "ru", dir: "ltr" },
  { code: "ar", label: "العربية", htmlLang: "ar", dir: "rtl" },
];

export function isSiteLanguage(value: unknown): value is SiteLanguage {
  return SITE_LANGUAGES.some((item) => item.code === value);
}

export function applyDocumentLanguage(lang: SiteLanguage) {
  if (typeof document === "undefined") return;
  const option = SITE_LANGUAGES.find((item) => item.code === lang) || SITE_LANGUAGES[0];
  document.documentElement.lang = option.htmlLang;
  document.documentElement.dir = option.dir;
}

export function saveSiteLanguage(lang: SiteLanguage) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem("hybridrm-language", lang);
  } catch {}
  applyDocumentLanguage(lang);
}

export function readSiteLanguage(): SiteLanguage {
  if (typeof window === "undefined") return "en";
  try {
    const saved = window.localStorage.getItem("hybridrm-language");
    if (isSiteLanguage(saved)) return saved;
  } catch {}
  return "en";
}
