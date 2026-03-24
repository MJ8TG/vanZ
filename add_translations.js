const fs = require('fs');

const frPath = 'c:/Users/user/Desktop/vanZ/messages/fr.json';
const arPath = 'c:/Users/user/Desktop/vanZ/messages/ar.json';

const fr = JSON.parse(fs.readFileSync(frPath, 'utf8'));
const ar = JSON.parse(fs.readFileSync(arPath, 'utf8'));

const newFrKeys = {
  canapeTunis: {
    h1: "Transport de canapé à Tunis — devis immédiat",
    metaTitle: "Transport Canapé Tunis | Livraison Rapide | VanZ",
    metaDesc: "Transportez votre canapé neuf ou d'occasion à Tunis en toute sécurité. Chauffeurs équipés, prix compétitifs et réservation en 2 clics sur VanZ.",
    heroSubtitle: "Trouvez un utilitaire avec chauffeur pour livrer votre canapé directement chez vous.",
    faq1Q: "Mon canapé rentre-t-il dans une camionnette ?",
    faq1A: "Une camionnette standard (Isuzu) peut accueillir un canapé 2 à 3 places. Pour un canapé d'angle, un camion léger est recommandé.",
    faq2Q: "Le chauffeur aide-t-il à le monter à l'étage ?",
    faq2A: "Vous pouvez demander l'aide du chauffeur ou de manutentionnaires supplémentaires lors de la réservation.",
    faq3Q: "Comment protéger le canapé ?",
    faq3A: "Nos chauffeurs disposent de sangles. Nous vous conseillons de garder le plastique d'emballage ou d'utiliser des couvertures."
  },
  frigoTunis: {
    h1: "Transport réfrigérateur à Tunis — debout et sécurisé",
    metaTitle: "Transport Frigo Tunis | Chauffeurs Pros | VanZ",
    metaDesc: "Faites livrer votre réfrigérateur à Tunis. Chauffeurs professionnels pour un transport debout en toute sécurité. Obtenez le meilleur prix !",
    heroSubtitle: "Ne prenez pas le risque de l'abîmer. Confiez le transport de votre frigo à des pros.",
    faq1Q: "Pourquoi transporter un frigo debout ?",
    faq1A: "Transporter un réfrigérateur couché peut endommager le compresseur et faire remonter l'huile dans le circuit frigorifique.",
    faq2Q: "Quand puis-je rebrancher mon frigo ?",
    faq2A: "Il est conseillé d'attendre au moins 12 à 24 heures après le transport avant de le rebrancher pour que les fluides se stabilisent.",
    faq3Q: "Vos camions sont-ils assez hauts ?",
    faq3A: "Oui, la majorité de nos chauffeurs partenaires ont des véhicules bâchés ou fourgons adaptés à la hauteur des frigos."
  },
  machineLaver: {
    h1: "Transport de machine à laver à Tunis",
    metaTitle: "Transport Machine à Laver Tunis | VanZ",
    metaDesc: "Livraison et transport de votre machine à laver à Tunis. Comparez les devis des chauffeurs en ligne et réservez immédiatement.",
    heroSubtitle: "Transport lourd mais simple. Trouvez une camionnette en quelques minutes.",
    faq1Q: "Faut-il bloquer le tambour ?",
    faq1A: "Il est très fortement recommandé de replacer les brides de transport (boulons) à l'arrière pour bloquer le tambour pendant le trajet.",
    faq2Q: "L'installation est-elle comprise ?",
    faq2A: "Le service inclut uniquement le transport. Le branchement à l'eau et à l'électricité reste à votre charge.",
    faq3Q: "Une seule personne suffit-elle ?",
    faq3A: "Une machine à laver pèse entre 60 et 80 kg. Deux personnes sont nécessaires pour la manipuler sans risque."
  },
  livraisonTunisSfax: {
    h1: "Livraison Tunis Sfax — Transport de colis et meubles",
    metaTitle: "Livraison Tunis Sfax | Transporteur Particulier | VanZ",
    metaDesc: "Envoyez vos colis ou petits meubles entre Tunis et Sfax. Trouvez un transporteur qui fait le trajet à un tarif groupé avantageux.",
    heroSubtitle: "La liaison la plus rapide et économique entre la capitale et la capitale du Sud.",
    faq1Q: "Combien de temps prend le trajet ?",
    faq1A: "Le trajet Tunis-Sfax (270 km) prend environ 3h à 3h30 via l'autoroute A1.",
    faq2Q: "Proposez-vous le groupage ?",
    faq2A: "Oui, de nombreux chauffeurs font ce trajet régulièrement. Vous pouvez mutualiser l'espace pour payer moins cher.",
    faq3Q: "Comment suis-je sûr que la livraison arrivera ?",
    faq3A: "Tous les chauffeurs VanZ sont vérifiés (CIN, Permis, Assurances). Vous pouvez suivre la livraison en temps réel."
  },
  livraisonTunisSousse: {
    h1: "Livraison Tunis Sousse — Colis et Déménagement",
    metaTitle: "Livraison Tunis Sousse | Transport Rapide | VanZ",
    metaDesc: "Faites transporter vos biens de Tunis à Sousse. Un réseau de chauffeurs quotidien pour vos livraisons urgentes ou meubles voluminueux.",
    heroSubtitle: "Profitez des chauffeurs faisant régulièrement le trajet pour obtenir un tarif compétitif.",
    faq1Q: "Le péage est-il inclus dans le prix ?",
    faq1A: "Les offres proposées par les chauffeurs sur VanZ sont des prix finaux, incluant le carburant et les péages.",
    faq2Q: "Puis-je accompagner mes bagages ?",
    faq2A: "Généralement, il y a une place libre à l'avant avec le chauffeur, mais il faut le préciser lors de la publication de votre annonce.",
    faq3Q: "Quels jours y a-t-il des départs ?",
    faq3A: "La communauté VanZ compte de nombreux chauffeurs actifs 7j/7 entre ces deux grandes villes."
  },
  demenagementTunis: {
    h1: "Déménagement Tunis — Professionnel et pas cher",
    metaTitle: "Déménagement Tunis | Devis Gratuit & Rapide | VanZ",
    metaDesc: "Planifiez votre déménagement à Tunis sans stress. Chauffeurs et déménageurs de confiance. Obtenez votre devis VanZ en 2 minutes.",
    heroSubtitle: "Logement étudiant ou grande villa ? Nous avons le camion qu'il vous faut pour déménager sereinement.",
    faq1Q: "Faites-vous l'emballage des cartons ?",
    faq1A: "L'emballage n'est pas inclus par défaut. Vous pouvez cependant le demander spécifiquement à votre chauffeur partenaire.",
    faq2Q: "Puis-je réserver à l'avance ?",
    faq2A: "Oui, vous pouvez planifier votre déménagement plusieurs semaines à l'avance et sélectionner le créneau qui vous convient.",
    faq3Q: "Quels véhicules proposez-vous ?",
    faq3A: "De la simple camionnette Isuzu au grand camion de 20 m³, tous les gabarits sont disponibles à Tunis."
  },
  demenagementPasCher: {
    h1: "Déménagement pas cher en Tunisie — Économisez jusqu'à 30%",
    metaTitle: "Déménagement Pas Cher Tunisie | Comparateur Tarif | VanZ",
    metaDesc: "Ne payez plus votre déménagement au prix fort. Utilisez VanZ pour comparer les transporteurs et obtenir un déménagement pas cher en Tunisie.",
    heroSubtitle: "La plateforme qui met les transporteurs en concurrence pour vous offrir le meilleur prix.",
    faq1Q: "Comment obtenir un déménagement pas cher ?",
    faq1A: "Publiez votre demande avec photos : les chauffeurs connaissent précisément le volume et peuvent vous proposer leur prix plancher sans surprise.",
    faq2Q: "Est-ce moins cher en semaine ?",
    faq2A: "Absolument, déménager entre le mardi et le jeudi est souvent moins cher que le week-end, période de forte demande.",
    faq3Q: "Le fait d'aider réduit-il le coût ?",
    faq3A: "Si vous participez au chargement et que vous n'avez pas besoin de main d'œuvre supplémentaire, vous réduirez considérablement la facture."
  },
  meubleAriana: {
    h1: "Transport meuble à l'Ariana (Ennasr, Menzah, Ghazela)",
    metaTitle: "Transport Meuble Ariana | Camion & Chauffeur | VanZ",
    metaDesc: "Transport de meubles à l'Ariana. Trouvez un chauffeur dans votre zone (Ennasr, Menzah, Riadh Andalous, Ghazela) rapidement et au bon prix.",
    heroSubtitle: "Un réseau de transporteurs locaux basés à l'Ariana pour une réactivité maximale.",
    faq1Q: "Les quartiers d'Ennasr et Menzah sont-ils bien desservis ?",
    faq1A: "Oui, ce sont des zones où nos chauffeurs partenaires sont particulièrement actifs et proches de vous.",
    faq2Q: "Combien coûte le transport au sein de l'Ariana ?",
    faq2A: "Pour une petite course locale (ex: Ennasr vers Menzah 9), comptez généralement entre 30 et 50 TND selon le volume.",
    faq3Q: "Puis-je transporter plusieurs meubles à la fois ?",
    faq3A: "Bien sûr, il suffit d'estimer correctement l'espace nécessaire lors de la réservation (camionnette vs camion)."
  },
  meubleMonastir: {
    h1: "Transport meuble à Monastir et au Sahel",
    metaTitle: "Transport Meuble Monastir | Devis Immédiat | VanZ",
    metaDesc: "Trouvez un transporteur de confiance pour vos meubles à Monastir, Sahline, Ksar Hellal ou Jemmal. La solution facile et économique.",
    heroSubtitle: "La proximité des chauffeurs locaux au service de vos besoins de transport dans le gouvernorat de Monastir.",
    faq1Q: "Couvrez-vous tout le gouvernorat ?",
    faq1A: "Oui, de Monastir ville jusqu'à Moknine, Ksar Hellal et Jemmal, nos chauffeurs se déplacent partout.",
    faq2Q: "Est-il possible d'aller de Monastir à Sousse ?",
    faq2A: "C'est un trajet quotidien pour de nombreux transporteurs avec un tarif très abordable vu la proximité géographique.",
    faq3Q: "Vos camions peuvent-ils transporter du tissu ou matériel industriel ?",
    faq3A: "La région étant industrielle, beaucoup de nos transporteurs partenaires ont des fourgons fermés adaptés à ces marchandises."
  },
  prixMeubleTunis: {
    h1: "Quel est le prix pour transporter un meuble à Tunis ?",
    metaTitle: "Prix Transport Meuble Tunis | Tarifs 2026 | VanZ",
    metaDesc: "Découvrez les vrais tarifs pour transporter un meuble à Tunis. Guide complet des prix de location d'utilitaire avec chauffeur et astuces pour payer moins.",
    heroSubtitle: "La transparence avant tout. Comparez les prix réels du marché en temps réel.",
    faq1Q: "Quel est le tarif moyen constaté ?",
    faq1A: "Le tarif moyen d'une course intra-Tunis (sans manutention) se situe autour de 45 TND sur notre plateforme.",
    faq2Q: "Qu'est-ce qui fait varier le prix ?",
    faq2A: "La distance kilométrique, le temps passé dans les embouteillages, et surtout le besoin en main d'œuvre pour les étages.",
    faq3Q: "Le prix annoncé sur VanZ peut-il changer le jour J ?",
    faq3A: "Non, si votre description correspondait à la réalité (volume exact, mention des étages), le prix accepté est ferme et définitif."
  }
};

const newArKeys = {
  canapeTunis: {
    h1: "نقل أريكة (صالون) في تونس — تسعير فوري",
    metaTitle: "نقل صالون تونس | توصيل سريع | VanZ",
    metaDesc: "انقل أريكتك الجديدة أو المستعملة في تونس بأمان تام. سائقون مجهزون، أسعار تنافسية وحجز بنقرتين على VanZ.",
    heroSubtitle: "ابحث عن شاحنة مع سائق لتوصيل الأريكة مباشرة إلى منزلك.",
    faq1Q: "هل تتسع شاحنة صغيرة لأريكتي؟",
    faq1A: "تتسع شاحنة قياسية (إيسوزو) لأريكة بمقعدين أو 3 مقاعد. بالنسبة للأريكة الزاوية، يوصى بشاحنة خفيفة.",
    faq2Q: "هل يساعد السائق في حملها للطابق العلوي؟",
    faq2A: "يمكنك طلب مساعدة السائق أو عمال إضافيين عند الحجز.",
    faq3Q: "كيف أحمي الأريكة؟",
    faq3A: "سائقونا لديهم أحزمة. ننصحك بالاحتفاظ بالبلاستيك المغلف أو استخدام البطانيات."
  },
  frigoTunis: {
    h1: "نقل ثلاجة في تونس — نقل عمودي وآمن",
    metaTitle: "نقل ثلاجة تونس | سائقون محترفون | VanZ",
    metaDesc: "قم بتوصيل ثلاجتك في تونس. سائقون محترفون لنقل عمودي آمن. احصل على أفضل سعر!",
    heroSubtitle: "لا تخاطر بإتلافها. اعتمد على المحترفين لنقل ثلاجتك.",
    faq1Q: "لماذا يجب نقل الثلاجة عمودياً؟",
    faq1A: "نقل الثلاجة ممددة يمكن أن يتلف الضاغط (الكومبريسور) ويجعل الزيت يتسرب إلى دائرة التبريد.",
    faq2Q: "متى يمكنني إعادة تشغيل الثلاجة؟",
    faq2A: "يُنصح بالانتظار من 12 إلى 24 ساعة بعد النقل قبل إعادة تشغيلها لاستقرار السوائل.",
    faq3Q: "هل شاحناتكم عالية بما يكفي؟",
    faq3A: "نعم، معظم السائقين لديهم شاحنات مغطاة ومناسبة لارتفاع الثلاجات."
  },
  machineLaver: {
    h1: "نقل غسالة في تونس",
    metaTitle: "نقل غسالة تونس | VanZ",
    metaDesc: "توصيل ونقل غسالتك في تونس. قارن عروض السائقين أونلاين واحجز فوراً.",
    heroSubtitle: "نقل ثقيل لكن بسيط. اعثر على شاحنة في بضع دقائق.",
    faq1Q: "هل يجب تثبيت الحوض؟",
    faq1A: "يوصى بشدة بإعادة وضع براغي النقل في الخلف لتثبيت الحوض أثناء الرحلة.",
    faq2Q: "هل التركيب مشمول؟",
    faq2A: "الخدمة تشمل النقل فقط. التوصيل بالماء والكهرباء على مسؤوليتك.",
    faq3Q: "هل يكفي شخص واحد؟",
    faq3A: "تزن الغسالة بين 60 و 80 كجم. هناك حاجة لشخصين للتعامل معها دون مخاطر."
  },
  livraisonTunisSfax: {
    h1: "توصيل تونس صفاقس — نقل طرود وأثاث",
    metaTitle: "توصيل تونس صفاقس | ناقل خاص | VanZ",
    metaDesc: "أرسل طرودك أو أثاثك الصغير بين تونس وصفاقس. جد ناقل يقوم بالرحلة بسعر مجمع ومناسب.",
    heroSubtitle: "الرابط الأسرع والأوفر بين العاصمة وعاصمة الجنوب.",
    faq1Q: "كم تستغرق الرحلة؟",
    faq1A: "تستغرق رحلة تونس-صفاقس (270 كم) حوالي 3 ساعات إلى 3 ساعات ونصف عبر الطريق السريعة A1.",
    faq2Q: "هل تقدمون خدمة التجميع (الكوبلاج)؟",
    faq2A: "نعم، العديد من السائقين يقومون بهذه الرحلة بانتظام. يمكنك مشاركة المساحة لدفع أقل.",
    faq3Q: "كيف أتأكد من وصول التوصيل؟",
    faq3A: "جميع سائقي VanZ موثقون (بطاقة تعريف، رخصة، تأمين). يمكنك تتبع التوصيل."
  },
  livraisonTunisSousse: {
    h1: "توصيل تونس سوسة — طرود ونقل",
    metaTitle: "توصيل تونس سوسة | نقل سريع | VanZ",
    metaDesc: "انقل أغراضك من تونس إلى سوسة. شبكة سائقين يومية لتوصيلاتك العاجلة أو الأثاث الكبير.",
    heroSubtitle: "استفد من السائقين الذين يقومون بالرحلة بانتظام للحصول على سعر تنافسي.",
    faq1Q: "هل رسوم الاستخلاص (البيّاج) مشمولة في السعر؟",
    faq1A: "العروض التي يقدمها السائقون على VanZ هي أسعار نهائية، تشمل الوقود والرسوم.",
    faq2Q: "هل يمكنني مرافقة أمتعتي؟",
    faq2A: "عادة، يوجد مقعد شاغر في الأمام مع السائق، لكن يجب توضيح ذلك عند نشر إعلانك.",
    faq3Q: "في أي الأيام توجد رحلات؟",
    faq3A: "تضم شبكة VanZ العديد من السائقين الناشطين طوال أيام الأسبوع بين هاتين المدينتين الكبيرتين."
  },
  demenagementTunis: {
    h1: "نقل عفش في تونس — احترافي ورخيص",
    metaTitle: "نقل عفش تونس | تسعير مجاني | VanZ",
    metaDesc: "خطط لنقل عفشك في تونس دون توتر. سائقون وعمال نقل ثقة. احصل على عرض VanZ في دقيقتين.",
    heroSubtitle: "سكن طلابي أو فيلا كبيرة؟ لدينا الشاحنة المناسبة لنقلك براحة بال.",
    faq1Q: "هل تقومون بتغليف الصناديق؟",
    faq1A: "التغليف غير مشمول افتراضياً. ومع ذلك، يمكنك طلبه خصيصاً من السائق المتعاون.",
    faq2Q: "هل يمكنني الحجز مسبقاً؟",
    faq2A: "نعم، يمكنك التخطيط لنقلك قبل عدة أسابيع واختيار الموعد الذي يناسبك.",
    faq3Q: "ما هي المركبات التي تقدمونها؟",
    faq3A: "من شاحنة (إيسوزو) البسيطة إلى الشاحنة الكبيرة 20 متر مكعب، كل الأحجام متوفرة في تونس."
  },
  demenagementPasCher: {
    h1: "نقل أثاث رخيص في تونس — وفر حتى 30%",
    metaTitle: "نقل أثاث رخيص تونس | مقارنة الأسعار | VanZ",
    metaDesc: "لا تدفع أكثر من اللازم لنقل العفش. استخدم VanZ لمقارنة الناقلين والحصول على نقل بسعر رخيص في تونس.",
    heroSubtitle: "المنصة التي تضع الناقلين في منافسة لتقدم لك أفضل سعر.",
    faq1Q: "كيف أحصل على نقل بسعر رخيص؟",
    faq1A: "انشر طلبك مع الصور: السائقون سيعرفون الحجم بدقة ويمكنهم تقديم أقل سعر دون مفاجآت.",
    faq2Q: "هل النقل أرخص في أيام الأسبوع؟",
    faq2A: "بالتأكيد، النقل بين الثلاثاء والخميس غالباً ما يكون أرخص من نهاية الأسبوع التي تشهد طلباً عالياً.",
    faq3Q: "هل المساعدة تقلل التكلفة؟",
    faq3A: "إذا شاركت في التحميل ولم تكن بحاجة لعمال إضافيين، فستقلل الفاتورة بشكل كبير."
  },
  meubleAriana: {
    h1: "نقل أثاث في أريانة (النصر، المنزه، الغزالة)",
    metaTitle: "نقل أثاث أريانة | شاحنة وسائق | VanZ",
    metaDesc: "نقل أثاث في أريانة. ابحث عن سائق في منطقتك (النصر، المنزه، رياض الأندلس، الغزالة) بسرعة وبسعر مناسب.",
    heroSubtitle: "شبكة من الناقلين المحليين في أريانة لاستجابة بأقصى سرعة.",
    faq1Q: "هل تغطون حي النصر والمنزه بشكل جيد؟",
    faq1A: "نعم، هذه مناطق ينشط فيها سائقونا بشكل خاص وهم قريبون منك.",
    faq2Q: "كم يكلف النقل داخل أريانة؟",
    faq2A: "لمسار محلي قصير (مثل: النصر إلى المنزه 9)، توقع عادة بين 30 و 50 دينار حسب الحجم.",
    faq3Q: "هل يمكنني نقل عدة قطع أثاث في وقت واحد؟",
    faq3A: "بالطبع، يكفي تقدير المساحة المطلوبة بشكل صحيح عند الحجز (شاحنة صغيرة مقابل شاحنة خفيفة)."
  },
  meubleMonastir: {
    h1: "نقل أثاث في المنستير والساحل",
    metaTitle: "نقل أثاث المنستير | تسعير فوري | VanZ",
    metaDesc: "ابحث عن ناقل ثقة لأثاثك في المنستير، الساحلين، قصر هلال أو جمال. الحل السهل والاقتصادي.",
    heroSubtitle: "قرب السائقين المحليين لخدمة احتياجات النقل الخاصة بك في ولاية المنستير.",
    faq1Q: "هل تغطون كامل الولاية؟",
    faq1A: "نعم، من مدينة المنستير حتى المكنين وقصر هلال وجمال، يتنقل سائقونا في كل مكان.",
    faq2Q: "هل يمكن الذهاب من المنستير إلى سوسة؟",
    faq2A: "إنه مسار يومي للعديد من الناقلين بسعر مناسب جداً نظراً للقرب الجغرافي.",
    faq3Q: "هل شاحناتكم تستطيع نقل القماش أو المعدات الصناعية؟",
    faq3A: "بما أن المنطقة صناعية، يمتلك العديد من السائقين شاحنات مغلقة تناسب هذه البضائع."
  },
  prixMeubleTunis: {
    h1: "كم يبلغ سعر نقل قطعة أثاث في تونس؟",
    metaTitle: "سعر نقل الأثاث في تونس | أسعار 2026 | VanZ",
    metaDesc: "اكتشف الأسعار الحقيقية لنقل الأثاث في تونس. دليل شامل لأسعار إيجار شاحنة مع سائق ونصائح لدفع أقل.",
    heroSubtitle: "الشفافية قبل كل شيء. قارن الأسعار الحقيقية للسوق في الوقت الفعلي.",
    faq1Q: "ما هو متوسط السعر الملاحظ؟",
    faq1A: "متوسط السعر لرحلة داخل تونس (بدون عمال) يبلغ حوالي 45 دينار على منصتنا.",
    faq2Q: "ما الذي يغير السعر؟",
    faq2A: "المسافة الكيلومترية، الوقت المقضي في الازدحام، وخاصة الحاجة لعمال من أجل السلالم.",
    faq3Q: "هل يمكن أن يتغير السعر المعلن على VanZ يوم النقل؟",
    faq3A: "لا، إذا كان وصفك مطابقاً للواقع (الحجم الدقيق، ذكر الطوابق)، فإن السعر المقبول نهائي ولا رجعة فيه."
  }
};

Object.assign(fr.seoPages, newFrKeys);
Object.assign(ar.seoPages, newArKeys);

fs.writeFileSync(frPath, JSON.stringify(fr, null, 2));
fs.writeFileSync(arPath, JSON.stringify(ar, null, 2));

console.log('Successfully updated translation files.');
