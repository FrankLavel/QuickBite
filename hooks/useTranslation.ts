import { useLangStore } from '@/store/langStore';
import { translate } from '@/lib/i18n';

type Params = Record<string, string | number>;

/** Hook de traducción: t(key, params?) según el idioma activo. */
export function useTranslation() {
  const lang = useLangStore((s) => s.lang);
  const setLang = useLangStore((s) => s.setLang);
  const t = (key: string, params?: Params) => translate(lang, key, params);
  return { t, lang, setLang };
}
