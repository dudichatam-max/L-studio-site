import { Languages } from "lucide-react";
import { languages, useLanguage, type Language } from "@/contexts/LanguageContext";

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  return <label className="language-switcher" aria-label="בחירת שפה">
    <Languages size={15} />
    <select value={language} onChange={(event) => setLanguage(event.target.value as Language)}>
      {languages.map((item) => <option key={item.id} value={item.id}>{item.native}</option>)}
    </select>
  </label>;
}
