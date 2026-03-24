import LegalPageWrapper from "@/components/shared/LegalPageWrapper";

export const metadata = {
  title: "Politique d'annulation | VanZ",
  description: "Modalités et frais d'annulation des requêtes sur VanZ.",
};

export default function CancellationPolicyPage() {
  return (
    <LegalPageWrapper title="Politique d'annulation" lastUpdated="Mars 2026">
      <h2>1. Principe général</h2>
      <p>
        VanZ s'efforce d'offrir une flexibilité maximale tout en respectant le temps 
        de nos chauffeurs partenaires. Les annulations doivent être effectuées le 
        plus tôt possible.
      </p>

      <h2>2. Annulation par le client</h2>
      <ul>
        <li><strong>Avant l'acceptation d'une offre :</strong> L'annulation est totalement gratuite.</li>
        <li><strong>Moins de 5 minutes après acceptation :</strong> L'annulation est gratuite (Période de grâce).</li>
        <li><strong>Plus de 5 minutes après acceptation :</strong> Des frais d'annulation de 5.00 TND s'appliquent pour dédommager le chauffeur en route.</li>
        <li><strong>Chauffeur arrivé sur place :</strong> Une pénalité allant jusqu'à 30% du montant du trajet peut être retenue en cas d'annulation abusive ou d'absence du client.</li>
      </ul>

      <h2>3. Annulation par le chauffeur</h2>
      <ul>
        <li>Les chauffeurs sont censés honorer les offres qu'ils acceptent.</li>
        <li><strong>En cas de force majeure :</strong> Le chauffeur doit annuler via l'application et contacter le support immédiatement. Le client sera intégralement remboursé ou un autre chauffeur sera assigné.</li>
        <li>Des annulations fréquentes ou injustifiées par un chauffeur entraîneront des avertissements puis une suspension du compte.</li>
      </ul>

      <h2>4. Retards</h2>
      <p>
        Si un chauffeur a un retard de plus de 30 minutes par rapport à l'horaire convenu 
        sans justification, le client est en droit d'annuler sans aucun frais, et cela n'impactera 
        pas sa note. 
      </p>

      <h2>5. Remboursements</h2>
      <p>
        En cas de paiement en ligne, les remboursements liés aux annulations éligibles sont 
        traités automatiquement dans un délai de 3 à 5 jours ouvrables, selon votre banque.
      </p>
    </LegalPageWrapper>
  );
}
