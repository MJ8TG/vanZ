import LegalPageWrapper from "@/components/shared/LegalPageWrapper";

export const metadata = {
  title: "Conditions d'utilisation | VanZ",
  description: "Conditions générales d'utilisation de la plateforme VanZ.",
};

export default function ConditionsUtilisationPage() {
  return (
    <LegalPageWrapper title="Conditions d'utilisation" lastUpdated="Mars 2026">
      <h2>1. Acceptation des conditions</h2>
      <p>
        En accédant et en utilisant la plateforme VanZ (site web et application mobile), 
        vous acceptez d'être lié par les présentes conditions générales d'utilisation. 
        Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser nos services.
      </p>

      <h2>2. Description du service</h2>
      <p>
        VanZ est une plateforme de mise en relation entre des clients cherchant à 
        transporter des biens et des chauffeurs indépendants proposant des services 
        de transport et de déménagement en Tunisie. VanZ agit uniquement en tant 
        qu'intermédiaire et n'est pas une entreprise de transport.
      </p>

      <h2>3. Inscription et compte utilisateur</h2>
      <p>
        Pour utiliser nos services, vous devez créer un compte en fournissant des 
        informations exactes et à jour, notamment un numéro de téléphone tunisien 
        valide. Vous êtes responsable du maintien de la confidentialité de vos 
        identifiants.
      </p>

      <h2>4. Obligations des utilisateurs</h2>
      <ul>
        <li>Les clients s'engagent à décrire précisément les biens à transporter et à payer le montant convenu.</li>
        <li>Les marchandises illégales, dangereuses, ou inflammables sont strictement interdites.</li>
        <li>Les utilisateurs doivent faire preuve de respect mutuel à tout moment.</li>
      </ul>

      <h2>5. Tarification et Paiements</h2>
      <p>
        Les prix sont fixés en Dinar Tunisien (TND) selon un système d'enchères ou de prix fixe. 
        VanZ prélève une commission sur chaque transaction réussie. Les paiements peuvent s'effectuer 
        en ligne ou en espèces.
      </p>

      <h2>6. Responsabilité</h2>
      <p>
        VanZ met tout en œuvre pour vérifier les chauffeurs, mais décline toute 
        responsabilité en cas de dommages matériels non couverts par l'assurance 
        optionnelle, de retards ou de litiges directs entre les parties.
      </p>
    </LegalPageWrapper>
  );
}
