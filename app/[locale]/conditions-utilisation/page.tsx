import { useTranslations } from "next-intl";
import LegalPageWrapper from "@/components/shared/LegalPageWrapper";

export async function generateMetadata() {
  return {
    title: "Conditions d'utilisation | VanZ",
    description: "Conditions générales d'utilisation de la plateforme VanZ.",
  };
}

export default function ConditionsUtilisationPage() {
  const t = useTranslations("termsPage");

  const sections = [
    { titleKey: "s1Title", descKey: "s1Desc" },
    { titleKey: "s2Title", descKey: "s2Desc" },
    { titleKey: "s3Title", descKey: "s3Desc" },
    { titleKey: "s4Title", descKey: "s4Desc" },
    { titleKey: "s5Title", descKey: "s5Desc" },
    { titleKey: "s6Title", descKey: "s6Desc" },
    { titleKey: "s7Title", descKey: "s7Desc" },
    { titleKey: "s8Title", descKey: "s8Desc" },
    { titleKey: "s9Title", descKey: "s9Desc" },
    { titleKey: "s10Title", descKey: "s10Desc" },
    { titleKey: "s11Title", descKey: "s11Desc" },
    { titleKey: "s12Title", descKey: "s12Desc" },
    { titleKey: "s13Title", descKey: "s13Desc" },
    { titleKey: "s14Title", descKey: "s14Desc" },
    { titleKey: "s15Title", descKey: "s15Desc" },
    { titleKey: "s16Title", descKey: "s16Desc" },
    { titleKey: "s17Title", descKey: "s17Desc" },
  ] as const;

  return (
    <LegalPageWrapper title={t("title")} lastUpdated={t("lastUpdated")}>
      {sections.map((sec) => (
        <div key={sec.titleKey}>
          <h2>{t(sec.titleKey)}</h2>
          <p className="whitespace-pre-line">{t(sec.descKey)}</p>
        </div>
      ))}
    </LegalPageWrapper>
  );
}
