import { useTranslations } from "next-intl";
import LegalPageWrapper from "@/components/shared/LegalPageWrapper";

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  return {
    title: "Conditions d'utilisation | VanZ",
    description: "Conditions générales d'utilisation de la plateforme VanZ.",
  };
}

export default function ConditionsUtilisationPage() {
  const t = useTranslations("termsPage");

  return (
    <LegalPageWrapper title={t("title")} lastUpdated={t("lastUpdated")}>
      <h2>{t("s1Title")}</h2>
      <p>{t("s1Desc")}</p>

      <h2>{t("s2Title")}</h2>
      <p>{t("s2Desc")}</p>

      <h2>{t("s3Title")}</h2>
      <p>{t("s3Desc")}</p>

      <h2>{t("s4Title")}</h2>
      <ul>
        <li>{t("s4L1")}</li>
        <li>{t("s4L2")}</li>
        <li>{t("s4L3")}</li>
      </ul>

      <h2>{t("s5Title")}</h2>
      <p>{t("s5Desc")}</p>

      <h2>{t("s6Title")}</h2>
      <p>{t("s6Desc")}</p>
    </LegalPageWrapper>
  );
}
