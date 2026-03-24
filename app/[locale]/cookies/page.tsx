import LegalPageWrapper from "@/components/shared/LegalPageWrapper";

export const metadata = {
  title: "Politique relative aux cookies | VanZ",
  description: "Utilisation des cookies et traceurs sur la plateforme VanZ.",
};

export default function CookiesPolicyPage() {
  return (
    <LegalPageWrapper title="Politique des Cookies" lastUpdated="Mars 2026">
      <h2>1. Qu'est-ce qu'un cookie ?</h2>
      <p>
        Un cookie est un petit fichier texte enregistré sur votre terminal (ordinateur, 
        tablette, smartphone) lors de la visite d'un site web ou de l'utilisation d'une 
        application. Il permet de conserver des données utilisateur afin de faciliter 
        la navigation et d'offrir des fonctionnalités avancées.
      </p>

      <h2>2. Les cookies que nous utilisons</h2>
      <p>Sur la plateforme VanZ, nous utilisons principalement les catégories de cookies suivantes :</p>
      <ul>
        <li>
          <strong>Cookies strictement nécessaires :</strong> Indispensables au fonctionnement 
          du site, ils vous permettent de vous connecter à votre compte et de mémoriser 
          vos préférences de langue (Français/Arabe).
        </li>
        <li>
          <strong>Cookies de performance et d'analyse :</strong> Ils nous aident à 
          comprendre comment les visiteurs interagissent avec notre site web (ex. Google Analytics), 
          afin d'améliorer l'expérience utilisateur et nos performances techniques.
        </li>
        <li>
          <strong>Cookies de fonctionnalité :</strong> Ces cookies permettent de mémoriser 
          les choix que vous faites (comme votre ville par défaut ou la fermeture des pop-ups d'alerte).
        </li>
        <li>
          <strong>Cookies publicitaires (Optionnels) :</strong> Utilisés pour afficher 
          des publicités pertinentes pour vous sur d'autres plateformes.
        </li>
      </ul>

      <h2>3. Gestion de vos préférences</h2>
      <p>
        Lors de votre première visite, un bandeau d'information vous permet de 
        consentir ou de refuser l'utilisation de certains cookies. Vous pouvez à 
        tout moment modifier ces paramètres directement depuis les réglages de 
        votre navigateur web (Chrome, Safari, Firefox, etc.) pour bloquer ou supprimer les cookies.
      </p>
      <p>
        Attention : le blocage des cookies "strictement nécessaires" peut altérer 
        le fonctionnement de l'application VanZ (ex: déconnexions intempestives, 
        impossibilité de changer de langue).
      </p>

      <h2>4. Mises à jour</h2>
      <p>
        Cette politique relative aux cookies est susceptible d'être modifiée pour 
        se conformer aux exigences réglementaires. Nous vous invitons à la 
        consulter régulièrement.
      </p>
    </LegalPageWrapper>
  );
}
