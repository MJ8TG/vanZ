import { useTranslations } from "next-intl";
import LegalPageWrapper from "@/components/shared/LegalPageWrapper";

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  // We can just set a hardcoded static metadata or use translations.
  // In a real app we'd fetch translations here too, but simple fallback is fine.
  return {
    title: "À propos | VanZ",
    description: "La première plateforme de transport et déménagement en Tunisie.",
  };
}

export default function AboutPage() {
  const t = useTranslations("aboutUs");

  return (
    <LegalPageWrapper title={t("title")} lastUpdated="Mars 2026">
      <div className="text-center mb-10">
        <p className="text-xl text-gray-600 font-medium">{t("subtitle")}</p>
      </div>

      <h2>{t("missionTitle")}</h2>
      <p>{t("missionDesc")}</p>

      <h2>{t("visionTitle")}</h2>
      <p>{t("visionDesc")}</p>
    </LegalPageWrapper>
  );
}
