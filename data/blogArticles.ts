export type BlogArticleSlug = 
  | "prix-demenagement-tunisie"
  | "transport-meuble-prix-tunis"
  | "comment-demenager-tunisie";

export interface BlogArticleConfig {
  slug: BlogArticleSlug;
  titleKey: string;
  date: string;
  readTime: number;
}

export const blogArticlesConfig: BlogArticleConfig[] = [
  {
    slug: "prix-demenagement-tunisie",
    titleKey: "prixDemenagement", // We will put these in messages or render directly
    date: "2026-03-20",
    readTime: 5
  },
  {
    slug: "transport-meuble-prix-tunis",
    titleKey: "transportMeublePrix",
    date: "2026-03-21",
    readTime: 4
  },
  {
    slug: "comment-demenager-tunisie",
    titleKey: "commentDemenager",
    date: "2026-03-22",
    readTime: 6
  }
];

export interface BlogContentItem {
  type: "p" | "h2";
  text: string;
}

export interface BlogLocaleContent {
  title: string;
  excerpt: string;
  content: BlogContentItem[];
}

export interface BlogArticleData {
  fr: BlogLocaleContent;
  ar: BlogLocaleContent;
}

// Content for the articles mapped by locale directly here to avoid huge JSON translation files for Long-form text
// Or we can structure the content blocks here with FR and AR.

export const blogArticlesContent: Record<BlogArticleSlug, BlogArticleData> = {
  "prix-demenagement-tunisie": {
    fr: {
      title: "Quel est le prix d'un déménagement en Tunisie en 2026 ?",
      excerpt: "Découvrez tous les tarifs et les facteurs qui influencent le coût d'un déménagement en Tunisie pour mieux préparer votre budget.",
      content: [
        { type: "p", text: "Le coût d'un déménagement en Tunisie peut varier considérablement en fonction de plusieurs facteurs, notamment la ville de départ et d'arrivée, le volume des biens à transporter, ainsi que les services additionnels souhaités (emballage, démontage, montage)." },
        { type: "h2", text: "1. Le volume à déménager" },
        { type: "p", text: "C'est le critère principal. Un studio nécessite généralement une simple camionnette (Isuzu ou équivalent), dont la location avec chauffeur coûte entre 50 et 100 TND pour un trajet intra-ville. Pour un appartement S+2 ou S+3, il vous faudra un camion léger, faisant grimper la facture entre 150 et 300 TND." },
        { type: "h2", text: "2. La distance du trajet" },
        { type: "p", text: "Un déménagement local (ex: de l'Ariana à La Marsa) coûtera évidemment moins cher qu'un déménagement inter-villes. Par exemple, un trajet Tunis-Sfax (environ 270 km) pour un S+2 peut coûter entre 400 et 600 TND, prenant en compte le péage, le carburant et le temps du chauffeur." },
        { type: "h2", text: "3. La main d'œuvre" },
        { type: "p", text: "Un chauffeur seul vous aidera à charger et décharger de base près du véhicule. Mais si vous habitez au 4ème étage sans ascenseur, vous devrez faire appel à des manutentionnaires. Prévoyez environ 30 à 50 TND par manutentionnaire pour la demi-journée." },
        { type: "h2", text: "Comment économiser avec VanZ ?" },
        { type: "p", text: "La meilleure façon d'obtenir un bon prix est de faire jouer la concurrence. Sur VanZ, vous publiez votre besoin gratuitement, et ce sont les transporteurs qui enchérissent. Vous pouvez souvent économiser jusqu'à 30% par rapport à un transporteur traditionnel contacté au hasard sur Facebook." }
      ]
    },
    ar: {
      title: "كم تكلفة النقل في تونس عام 2026؟",
      excerpt: "اكتشف جميع الأسعار والعوامل التي تؤثر على تكلفة نقل الأثاث في تونس للاستعداد بشكل أفضل لميزانيتك.",
      content: [
        { type: "p", text: "يمكن أن تختلف تكلفة النقل في تونس اختلافًا كبيرًا بناءً على عدة عوامل، بما في ذلك مدينة المغادرة والوصول، وحجم الأثاث المراد نقله، والخدمات الإضافية المطلوبة (التغليف، الفك، التركيب)." },
        { type: "h2", text: "1. حجم الأثاث" },
        { type: "p", text: "هو المعيار الرئيسي. يتطلب الاستوديو عادة شاحنة صغيرة (إيسوزو أو ما يعادلها)، وتتراوح تكلفة الإيجار مع السائق بين 50 و 100 دينار لرحلة داخل المدينة. بالنسبة لشقة من غرفتين أو ثلاث، ستحتاج إلى شاحنة خفيفة، مما يرفع الفاتورة إلى ما بين 150 و 300 دينار." },
        { type: "h2", text: "2. مسافة الرحلة" },
        { type: "p", text: "بالطبع سيكون النقل المحلي (مثال: من أريانة إلى المرسى) أرخص من النقل بين المدن. على سبيل المثال، رحلة تونس-صفاقس (حوالي 270 كم) لشقة غرفتين وصالة قد تكلف بين 400 و 600 دينار، مع الأخذ في الاعتبار رسوم العبور والوقود ووقت السائق." },
        { type: "h2", text: "3. العمالة والتنزيل" },
        { type: "p", text: "سيساعدك السائق الأساسي في التحميل والتفريغ بالقرب من السيارة. ولكن إذا كنت تعيش في الطابق الرابع بدون مصعد، ستحتاج إلى عمال. خصص حوالي 30 إلى 50 دينار لكل عامل لنصف يوم." },
        { type: "h2", text: "كيف توفر مع VanZ؟" },
        { type: "p", text: "أفضل طريقة للحصول على سعر جيد هي المنافسة. على VanZ، تقوم بنشر طلبك مجانًا، ويقوم الناقلون بتقديم عروضهم. يمكنك غالبًا توفير ما يصل إلى 30٪ مقارنة بناقل تقليدي يتم الاتصال به عشوائيًا على فيسبوك." }
      ]
    }
  },
  "transport-meuble-prix-tunis": {
    fr: {
      title: "Transport de meuble à Tunis : Tarifs et Conseils",
      excerpt: "Tout ce que vous devez savoir pour transporter un meuble encombrant (canapé, frigo) à Tunis au meilleur prix.",
      content: [
        { type: "p", text: "Vous venez d'acheter un canapé sur Tayara ou un réfrigérateur flambant neuf à La Soukra et vous vous demandez comment le transporter jusqu'à votre domicile au Centre-ville ou à Ben Arous ? Le transport d'encombrants est un besoin très fréquent à Tunis." },
        { type: "h2", text: "Les tarifs pour un seul meuble" },
        { type: "p", text: "Le transport d'une pièce unique (frigidaire, salon, chambre à coucher) intra-Tunis coûte généralement entre 30 TND (sur une très courte distance, ex: 3-5km) et 60 TND si la distance franchit les 20km." },
        { type: "h2", text: "Attention à la sécurité" },
        { type: "p", text: "Un meuble coûte cher. Il est impératif qu'il soit bien arrimé pendant le transport. En réservant sur VanZ, vous accédez à des chauffeurs professionnels équipés de sangles et de couvertures de protection pour éviter les rayures." },
        { type: "h2", text: "Les horaires idéaux" },
        { type: "p", text: "Pour éviter les interminables embouteillages de Tunis (GP8, GP9, Route X), privilégiez les transports très tôt le matin (avant 7h30), en début d'après-midi (entre 14h et 16h) ou tard le soir. Les prix proposés par les chauffeurs sur ces créneaux seront souvent plus avantageux." }
      ]
    },
    ar: {
      title: "نقل أثاث في تونس: الأسعار والنصائح",
      excerpt: "كل ما تحتاج إلى معرفته لنقل قطعة أثاث ضخمة (أريكة، ثلاجة) في تونس بأفضل سعر.",
      content: [
        { type: "p", text: "هل اشتريت للتو أريكة أو ثلاجة جديدة من سكرة وتتساءل كيف تنقلها إلى منزلك في وسط المدينة أو بن عروس؟ نقل الأغراض الضخمة حاجة شائعة جدًا في تونس." },
        { type: "h2", text: "أسعار القطعة الواحدة" },
        { type: "p", text: "نقل قطعة واحدة (ثلاجة، صالون، غرفة نوم) داخل تونس يكلف عادة بين 30 دينار (لمسافة قصيرة جدًا، مثال: 3-5 كم) و 60 دينار إذا تجاوزت المسافة 20 كم." },
        { type: "h2", text: "انتبه للسلامة" },
        { type: "p", text: "الأثاث باهظ الثمن. من الضروري أن يكون مؤمنًا جيدًا أثناء النقل. بالحجز على VanZ، يمكنك الوصول إلى سائقين محترفين مجهزين بأحزمة وبطانيات واقية لتجنب الخدوش." },
        { type: "h2", text: "الأوقات المثالية" },
        { type: "p", text: "لتجنب الاختناقات المرورية التي لا تنتهي في تونس (الطريق السريعة X وغيرها)، فضل النقل في الصباح الباكر جدًا (قبل 7:30 صباحًا)، أو في بداية فترة ما بعد الظهر (بين 2 مساءً و 4 مساءً) أو في وقت متأخر من الليل. الأسعار التي يقدمها السائقون في هذه الأوقات ستكون غالبًا أكثر فائدة." }
      ]
    }
  },
  "comment-demenager-tunisie": {
    fr: {
      title: "Guide complet pour réussir son déménagement en Tunisie",
      excerpt: "Les étapes indispensables pour déménager sans stress, de l'emballage des cartons au choix du transporteur.",
      content: [
        { type: "p", text: "Déménager est souvent perçu comme l'un des événements les plus stressants. Cependant, avec une bonne préparation, vous pouvez minimiser ce stress. Voici notre guide étape par étape." },
        { type: "h2", text: "1 mois avant : le tri" },
        { type: "p", text: "C'est l'occasion idéale pour désencombrer. Vendez sur des plateformes de seconde main, donnez à des associations ou jetez ce qui n'est plus utilisable. Moins vous aurez de volume, moins votre déménagement vous coûtera cher." },
        { type: "h2", text: "2 semaines avant : les cartons" },
        { type: "p", text: "Commencez à emballer les objets que vous n'utilisez pas au quotidien (livres, vêtements hors saison). Achetez des cartons de qualité professionnelle, du papier bulle et des marqueurs. N'oubliez pas de bien noter le contenu et la pièce de destination sur chaque carton." },
        { type: "h2", text: "1 semaine avant : trouver le transporteur" },
        { type: "p", text: "C'est le moment de publier votre annonce sur VanZ. Prenez des photos de vos gros meubles et indiquez l'adresse précise de départ et d'arrivée, ainsi que l'étage. Vous recevrez des devis sous quelques minutes et pourrez consulter les avis des précédents clients." },
        { type: "h2", text: "Le Jour J" },
        { type: "p", text: "Le jour de votre déménagement, gardez avec vous une 'boîte de survie' contenant vos objets essentiels (chargeur de téléphone, brosse à dents, médicaments, documents importants). Laissez les professionnels certifiés de VanZ s'occuper de la manutention lourde et détendez-vous." }
      ]
    },
    ar: {
      title: "دليل كامل لنجاح عملية نقل الأثاث في تونس",
      excerpt: "الخطوات الأساسية للانتقال بدون توتر، من تعبئة الصناديق إلى اختيار السائق.",
      content: [
        { type: "p", text: "غالبًا ما يُنظر إلى الانتقال على أنه أحد أكثر الأحداث إرهاقًا. ومع ذلك، من خلال التحضير الجيد، يمكنك تقليل هذا التوتر. إليك دليلنا خطوة بخطوة." },
        { type: "h2", text: "قبل شهر: الفرز" },
        { type: "p", text: "هذه فرصة مثالية للتخلص من الفوضى. قُم ببيع الأغراض المستعملة، أو تبرع للجمعيات، أو تخلص مما لم يعد صالحًا للاستخدام. كلما قل الحجم، قلت تكلفة النقل." },
        { type: "h2", text: "قبل أسبوعين: الصناديق" },
        { type: "p", text: "ابدأ في تعبئة الأشياء التي لا تستخدمها يوميًا (الكتب، ملابس المواسم الأخرى). اشترِ صناديق عالية الجودة وورق تغليف بلاستيكي وأقلام تلوين. لا تنس تدوين المحتوى والغرفة المخصصة له على كل صندوق." },
        { type: "h2", text: "قبل أسبوع: البحث عن السائق" },
        { type: "p", text: "هذا هو الوقت المناسب لنشر إعلانك على VanZ. التقط صورًا لأثاثك الكبير وحدد عنوان الانطلاق والوصول بدقة، بالإضافة إلى الطابق. ستتلقى عروض أسعار في غضون دقائق ويمكنك قراءة تقييمات العملاء السابقين." },
        { type: "h2", text: "يوم النقل" },
        { type: "p", text: "في يوم انتقالك، احتفظ معك بـ 'صندوق أساسيات' يحتوي على أشيائك الضرورية (شاحن الهاتف، فرشاة الأسنان، الأدوية، الوثائق المهمة). دع المحترفين المعتمدين من VanZ يتولون الاهتمام بالأغراض الثقيلة واسترخِ." }
      ]
    }
  }
};
