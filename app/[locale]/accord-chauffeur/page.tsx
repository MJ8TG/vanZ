import LegalPageWrapper from "@/components/shared/LegalPageWrapper";

export const metadata = {
  title: "Accord Chauffeur | VanZ",
  description: "Contrat et obligations des chauffeurs partenaires VanZ.",
};

export default function DriverAgreementPage() {
  return (
    <LegalPageWrapper title="Accord Chauffeur" lastUpdated="Mars 2026">
      <h2>1. Statut du chauffeur</h2>
      <p>
        En tant que chauffeur partenaire VanZ, vous agissez en tant qu'entrepreneur 
        indépendant. Ce contrat ne crée en aucun cas une relation d'employeur à employé, 
        de partenariat ou de coentreprise entre vous et VanZ.
      </p>

      <h2>2. Documents et conformité légale</h2>
      <p>
        Vous devez maintenir à jour tous les documents requis par la loi tunisienne et 
        par VanZ, notamment :
      </p>
      <ul>
        <li>Une carte d'identité nationale (CIN) valide.</li>
        <li>Un permis de conduire approprié à votre catégorie de véhicule.</li>
        <li>Une carte grise (certificat d'immatriculation) valide.</li>
        <li>Une assurance automobile valide couvrant le transport de biens.</li>
        <li>Un certificat de visite technique à jour.</li>
      </ul>

      <h2>3. Obligations de service</h2>
      <p>
        Le chauffeur s'engage à effectuer les missions acceptées avec professionnalisme 
        et ponctualité. Le véhicule doit être propre, entretenu et sécurisé pour le 
        transport de marchandises. Vous êtes responsable du chargement et du 
        déchargement, sauf accord contraire explicite avec le client.
      </p>

      <h2>4. Commissions et paiements</h2>
      <p>
        VanZ prélève une commission (entre 10% et 15%) sur le montant total de chaque 
        course effectuée. En cas de paiement en espèces par le client, la commission 
        sera déduite de votre solde ou de vos futurs paiements en ligne.
      </p>

      <h2>5. Dispositif de notation</h2>
      <p>
        Pour maintenir l'accès à la plateforme, un taux minimal de satisfaction client 
        (moyenne de 3.5/5 étoiles) doit être maintenu. VanZ se réserve le droit de 
        suspendre temporairement ou définitivement le compte en cas d'évaluations très 
        défavorables répétées.
      </p>

      <h2>6. Clause de non-sollicitation</h2>
      <p>
        Il est strictement interdit de contourner la plateforme VanZ pour facturer ou 
        proposer des services aux clients acquis via notre application. Le non-respect 
        de cette clause entraîne un bannissement définitif.
      </p>
    </LegalPageWrapper>
  );
}
