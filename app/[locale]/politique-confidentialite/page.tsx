import { useTranslations } from "next-intl";
import LegalPageWrapper from "@/components/shared/LegalPageWrapper";

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  return {
    title: "Politique de confidentialité | VanZ",
    description: "Politique de confidentialité et gestion des données personnelles chez VanZ.",
  };
}

export default function PrivacyPolicyPage() {
  const t = useTranslations("privacyPage");

  return (
    <LegalPageWrapper title={t("title")} lastUpdated={t("lastUpdated")}>
      <h2>{t("s1Title")}</h2>
      <p>{t("s1Desc")}</p>

      <h2>{t("s2Title")}</h2>
      <p>{t("s2Desc")}</p>
      <ul>
        <li>{t("s2L1")}</li>
        <li>{t("s2L2")}</li>
        <li>{t("s2L3")}</li>
        <li>{t("s2L4")}</li>
      </ul>

      <h2>{t("s3Title")}</h2>
      <p>{t("s3Desc")}</p>
      <ul>
        <li>{t("s3L1")}</li>
        <li>{t("s3L2")}</li>
        <li>{t("s3L3")}</li>
        <li>{t("s3L4")}</li>
        <li>{t("s3L5")}</li>
      </ul>

      <h2>{t("s4Title")}</h2>
      <p>{t("s4Desc")}</p>

      <h2>{t("s5Title")}</h2>
      <p>{t("s5Desc")}</p>

      <h2>{t("s6Title")}</h2>
      <p>{t("s6Desc")}</p>
    </LegalPageWrapper>
  );
}
