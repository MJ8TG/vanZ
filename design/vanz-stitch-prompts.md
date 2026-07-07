# VanZ — Google Stitch prompt pack (mobile app)

Free workflow: open **stitch.withgoogle.com** → choose **Mobile** → paste **Block 0 (Style)** once at the start of a new project, then paste each screen prompt one at a time. In Stitch, use **"Standard"** mode for layout fidelity. When happy, use **Export → Copy to Figma** (free).

Tips
- Paste the **Style block first**, generate, then add screens with "Add screen" so they inherit the theme.
- If a screen drifts off-brand, re-paste the short **Style reminder** line at the top of that screen's prompt.
- Keep language **French** (the app is FR with optional Arabic RTL, like the web version).

---

## BLOCK 0 — GLOBAL STYLE (paste first)

```
Design a modern mobile app called "VanZ", a transport & moving (déménagement) marketplace in Tunisia, in French. Two user types: Client and Chauffeur (driver).

Brand & visual style:
- Primary color: azure blue #38A8F5 (gradients to #1E8FE0).
- Dark background: deep navy #0E1626, cards #16223A, borders #233452.
- Accent / main call-to-action color: yellow #FFD60A with dark navy text.
- Success / online: green #27C281. Danger / SOS: red #FF5A5F.
- Logo: a rounded blue square tile containing a white delivery-van outline with a yellow lightning bolt; wordmark "vanz" in bold white with the "z" in yellow.
- Theme: dark UI by default, large rounded corners (18–22px), soft shadows, generous spacing, bold sans-serif headings, friendly and premium feel. Pill-shaped tags, rounded 50px buttons.
- Mobile layout, iOS status bar, bottom tab navigation, floating yellow "+" action button.
- Tone: clean, trustworthy, fast. Tagline: "Votre transport, simplifié."

Keep this style consistent across all screens I add next.
```

**Style reminder (one-liner to re-paste if a screen drifts):**
```
Use the VanZ theme: navy #0E1626 background, blue #38A8F5 primary, yellow #FFD60A CTA, green #27C281 online, rounded cards, dark mode, French.
```

---

# APPLICATION CLIENT

## 1 — Onboarding / Splash
```
A splash/onboarding screen with a full azure-blue gradient background (#38A8F5 → #1E8FE0). Centered: the VanZ logo tile (white van + yellow lightning), the "vanz" wordmark, and the tagline "Votre transport, simplifié." in white. At the bottom: a 3-dot page indicator, a yellow primary button "Commencer", and a translucent secondary button "J'ai déjà un compte".
```

## 2 — Connexion (login)
```
A phone-number login screen, dark navy background. Small VanZ logo top-left. Heading "Bienvenue 👋" and subtext "Entrez votre numéro pour recevoir un code de vérification." A phone input prefixed with "🇹🇳 +216". A blue primary button "Recevoir le code". A divider "ou continuer avec" then two outline buttons "Google" and "Apple". Small legal text about Conditions and Politique de confidentialité.
```

## 3 — Accueil (home)
```
A client home screen, dark navy. Top bar: round avatar "A", "Bonjour, Ahmed B.", and a notification bell. A search field "Où livrer aujourd'hui ?". A highlighted blue gradient card showing an in-progress job: tag "En cours", "Transport meublé", route "Tunis → Sousse", ETA "12 min", driver "Mehdi T. ★4.9" with a chat icon. Below, a "Nos services" section as a 3-column grid of rounded tiles with icons: Déménagement, Meublé, Colis, Inter-villes, Bureaux, Express. Bottom tab bar (Accueil, Jobs, +, Crédit, Profil) with a floating yellow "+" button.
```

## 4 — Publier un job · Étape 1 (service + adresses)
```
"Nouveau job" creation screen, step 1 of 3 (progress bar, first segment blue). A horizontal selector of service-type pills (Meublé selected in blue, Colis, Express). A map card showing a route from a green pin "A" to a red pin "B" with a dashed blue line. Below, an address card with two rows: green pin "Départ — Rue de Carthage, Tunis" and red pin "Destination — Av. Habib Bourguiba, Sousse". A blue "Continuer" button.
```

## 5 — Publier un job · Étape 2 (détails)
```
Job creation step 2 of 3 (progress bar two segments blue). Section "Photos du chargement" with an add-photo tile (camera icon) and two image thumbnails. Section "Volume estimé" with pills Petit / Moyen (1 van, selected) / Grand. Section "Créneau" with two fields: "Aujourd'hui" and "14:00–16:00". A multiline note field "3e étage sans ascenseur, prévoir 2 personnes." Blue "Continuer" button. Dark navy theme.
```

## 6 — Publier un job · Étape 3 (récap + paiement)
```
Job creation step 3 of 3 (progress full blue). A summary card: Service "Transport meublé", Trajet "Tunis → Sousse", Créneau "Auj. 14:00–16:00". An insurance row "Assurance transport — couverture jusqu'à 2000 DT" with a green toggle ON. Payment section with two options: "Espèces" and "En ligne" (selected, blue border). A promo-code field "VANZ10" showing a green "-10%" tag. A yellow highlighted box "Budget estimé 80–110 DT" with note "Les chauffeurs enchérissent. Vous choisissez l'offre." A yellow CTA "Publier le job — gratuit".
```

## 7 — Offres reçues (bids)
```
A screen "Offres (3)" listing driver bids for a job tagged "Transport meublé · Tunis→Sousse". Each bid is a card: driver avatar, name, star rating, ETA, and a bold price (e.g. Mehdi T. ★4.9 — 85 DT with a green "Favori" badge; Skander G. ★4.7 — 95 DT; Yassine B. ★4.8 — 110 DT). Each card has two buttons: outline "Chat" and a filled "Accepter" (yellow, blue for the recommended one). Dark navy theme, a filter icon in the top bar.
```

## 8 — Suivi en direct (live tracking)
```
A full-screen live tracking map with a route to a red destination pin "B" and a circular van marker with a blue ring for the driver. Top floating controls: back button, a green "En route · 8 min" pill, and a red SOS button. A bottom sheet showing driver "Mehdi T. ★4.9 · Renault Trafic" with call and chat icon buttons, and a destination card "Av. H. Bourguiba, Sousse — 8 min". Dark theme.
```

## 9 — Messagerie (chat)
```
A 1-to-1 chat screen, light background. Top bar: back, driver avatar "M", "Mehdi T." with green "● en ligne" status, and a call icon. Chat bubbles: incoming grey, outgoing blue gradient. Include a shared-location bubble (blue card with a pin, "📍 Position partagée"). Bottom input row with a camera icon, a text field "Votre message…", and a yellow microphone button for voice messages.
```

## 10 — Évaluation (rating)
```
A post-delivery rating screen. Top: a green success banner with a check icon and "Livraison terminée !". A card "Montant payé — 85 DT". Heading "Notez Mehdi T." with a large 5-star selector in yellow. Quick-tag pills: Ponctuel, Soigneux, Pro, Aimable. A comment field. A yellow highlighted row "+15 points fidélité 🎉". A blue "Envoyer l'avis" button.
```

## 11 — Portefeuille (wallet)
```
A wallet screen, dark navy. A blue-to-navy gradient balance card: "Solde crédit 42,500 DT", a yellow "320 points" fidélité chip, and a yellow "Recharger" button. A row of 3 small stat cards: Jobs 8, Parrainage +24 DT, Économies -30%. A "Transactions récentes" list with icon rows: Transport meublé -85 DT, Recharge carte +50 DT, Bonus parrainage +10 DT, Livraison colis -22 DT (debits red, credits green). Bottom tab bar.
```

## 12 — Profil client
```
A client profile screen. Blue gradient header with avatar "A", name "Ahmed Ben Salah", "★ 4.8 · client depuis 2024". A list card: Adresses enregistrées, Chauffeurs favoris, Mes parrainages, Moyens de paiement (each with icon + chevron). A yellow referral banner "Parrainez = 10 DT offerts — code AHMED2024". A second list card: Notifications, Aide & support, Paramètres. Bottom tab bar. Dark theme.
```

---

# APPLICATION CHAUFFEUR

## 13 — Chauffeur · Accueil (online + jobs)
```
A driver home screen, dark navy. Top bar: avatar "M", "Mehdi T. ★4.9", a green "● En ligne" pill with a green toggle ON. A blue-to-navy earnings card: "Aujourd'hui 128,000 DT" and "Jobs 4". Section "Jobs disponibles" with a "5 km" radius pill. A list of available-job cards: service tag, route with green pin, volume, a yellow price range (e.g. 80–110 DT), distance, and a button ("Faire une offre" filled blue for the first, "Voir le job" outline for others). Bottom tab bar (Jobs, Missions, Revenus, Profil).
```

## 14 — Chauffeur · Détail + enchère (bid)
```
A driver job-detail screen. A small route map (green "A" to red "B"). A detail card: tag "Transport meublé", time "Auj. 14:00", pickup "Rue de Carthage, Tunis", dropoff "Av. H. Bourguiba, Sousse · 142 km", two photo thumbnails, note "Volume moyen · 3e étage". A "Votre offre" stepper card with minus/plus buttons around a big "90 DT". Helper text "Fourchette client : 80–110 DT · Commission 15%". A yellow CTA "Envoyer l'offre — 90 DT". Dark navy theme.
```

## 15 — Chauffeur · Mission (navigation)
```
A driver active-mission screen: full map with route to red pin "B". Top controls: back, a blue "142 km · 2h10" navigation pill, red SOS button. Bottom sheet: client "Ahmed B. · 85 DT espèces" with call and chat icons, a 4-step progress tracker (Arrivé ✓, Chargé ✓, En route, Livré), and a yellow CTA "Photo de livraison + Terminer" with a camera icon.
```

## 16 — Chauffeur · Revenus (earnings + withdrawal)
```
A driver earnings screen, dark navy. A blue-to-navy card "Solde disponible 486,500 DT" with a yellow "Retirer (min. 50 DT)" button. A red-tinted card "Commission due -18 DT — à régler avant le prochain retrait". Section "Méthodes de retrait" with 3 option cards: Virement bancaire (selected, blue border), Flouci, Poste. An "Historique" list: Job · Sousse +72 DT, Retrait Flouci -200 DT, Job · La Marsa +30 DT (credits green, debits red). Bottom tab bar.
```

---

## After Stitch generates the screens
1. Review each screen; tweak with follow-up prompts like *"make the CTA yellow #FFD60A"* or *"use the navy #0E1626 background"*.
2. Use **Export → Copy to Figma** to paste editable frames into a Figma file (works on your free seat).
3. Or **Export → Copy code (HTML/CSS / React)** if you'd rather hand it to a developer.

> Note: Stitch generates one screen per prompt. Add them in order so they share the theme. The numbering above is the recommended build order.
