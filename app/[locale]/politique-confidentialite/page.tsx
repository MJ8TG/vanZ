import LegalPageWrapper from "@/components/shared/LegalPageWrapper";

export const metadata = {
  title: "Politique de confidentialité | VanZ",
  description: "Politique de confidentialité et gestion des données personnelles chez VanZ.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPageWrapper title="Politique de confidentialité" lastUpdated="Mars 2026">
      <h2>1. Introduction</h2>
      <p>
        Chez VanZ, la protection de vos données personnelles est une priorité absolue. 
        Cette politique de confidentialité explique comment nous collectons, utilisons, 
        partageons et protégeons vos informations.
      </p>

      <h2>2. Données collectées</h2>
      <p>Nous collectons les données suivantes :</p>
      <ul>
        <li><strong>Données d'identité :</strong> Nom, prénom, numéro de téléphone, email, carte d'identité (CIN).</li>
        <li><strong>Données de géolocalisation :</strong> Localisation GPS (uniquement lorsque l'application est utilisée pour les chauffeurs ou lors de la demande d'un service).</li>
        <li><strong>Données de paiement :</strong> Informations de facturation (les données de carte bancaire sont sécurisées par notre partenaire de paiement).</li>
        <li><strong>Données relatives au véhicule :</strong> (Chauffeurs uniquement) Carte grise, assurance, visite technique.</li>
      </ul>

      <h2>3. Utilisation des données</h2>
      <p>Vos données sont utilisées pour :</p>
      <ul>
        <li>Fournir et améliorer nos services de mise en relation.</li>
        <li>Vérifier l'identité des chauffeurs pour assurer la sécurité de tous.</li>
        <li>Traiter les paiements et envoyer des reçus.</li>
        <li>Gérer le support client et résoudre les litiges.</li>
        <li>Envoyer des communications administratives ou promotionnelles.</li>
      </ul>

      <h2>4. Partage des données</h2>
      <p>
        VanZ ne vend jamais vos données personnelles. Nous pouvons partager certaines 
        informations (nom, numéro de téléphone, localisation) uniquement entre le 
        client et le chauffeur assigné pour la bonne exécution du service.
      </p>

      <h2>5. Sécurité et conservation</h2>
      <p>
        Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles 
        pour protéger vos données. Les données sont conservées aussi longtemps que 
        votre compte est actif ou selon les exigences légales tunisiennes.
      </p>

      <h2>6. Vos droits</h2>
      <p>
        Conformément à la législation en vigueur, vous disposez d'un droit d'accès, 
        de rectification et de suppression de vos données. Vous pouvez exercer ces 
        droits en nous contactant à <strong>privacy@vanz.tn</strong>.
      </p>
    </LegalPageWrapper>
  );
}
