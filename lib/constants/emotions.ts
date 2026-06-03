// Duygu içerik sayfaları için statik kaynak (SEO).
// Her duygu, /gezegen/<slug> içerik sayfasının kaynağıdır.
// DB'deki planet kaydıyla `name_tr` üzerinden eşleşir (UUID gerekmez).
// ÖNEMLI: Burada kullanıcı yıldızları (kişisel itiraflar) YOK, sadece editoryal,
// kalıcı (evergreen) içerik. Kişisel/hassas içerik Google'a açılmaz.
//
// i18n: `metaTitle/metaDescription/keywords` SADECE Türkçe (sayfa Türkçe-canonical,
// SSR metadata). Görünür içeriğin İngilizcesi `*_en` alanlarındadır; gezegen
// makalesi client'ta dile göre seçer (SSR Türkçe render eder → TR SEO korunur).

export interface EmotionFaq {
  q: string
  a: string
}

export interface EmotionContent {
  slug: string
  name_tr: string
  name_en: string
  color: string
  /** Sayfa H1 başlığı (TR) */
  heading: string
  /** Sayfa H1 başlığı (EN) */
  heading_en: string
  /** <title> için (kök şablon "| Duygu Evreni" ekler), TR (canonical) */
  metaTitle: string
  metaDescription: string
  keywords: string[]
  /** Giriş paragrafı (TR / EN) */
  lead: string
  lead_en: string
  /** Gövde paragrafları (TR / EN) */
  body: string[]
  body_en: string[]
  /** Görünür SSS + FAQPage schema kaynağı (TR / EN) */
  faqs: EmotionFaq[]
  faqs_en: EmotionFaq[]
  /** İlgili duygu slug'ları (iç linkleme) */
  related: string[]
  /** Hassas duygular için destekleyici not (opsiyonel, TR / EN) */
  supportNote?: string
  supportNote_en?: string
}

// Tüm duygularda ortak kullanılan SSS kalıpları (duygu adıyla kişiselleştirilir)
function commonFaqs(name: string): EmotionFaq[] {
  return [
    {
      q: `Duygu Evreni'nde ${name.toLocaleLowerCase('tr-TR')} nasıl paylaşılır?`,
      a: `Ücretsiz kayıt olup ${name} gezegenine girersin, birkaç cümleyle hislerini yazarsın ve paylaşımın evrende parlayan bir yıldıza dönüşür. Aynı gezegende başkalarının paylaşımlarını da okuyabilirsin.`,
    },
    {
      q: 'Paylaşımlarım anonim mi?',
      a: 'Evet. Yıldızlarda yalnızca duygu metni ve oluşturulma tarihi görünür; kim olduğun gizli kalır. İstersen birisiyle anonim olarak mesajlaşmaya da başlayabilirsin.',
    },
    {
      q: 'Duygu Evreni ücretsiz mi?',
      a: 'Evet, tamamen ücretsizdir. Kayıt olduktan sonra her gün belirli sayıda yıldız paylaşabilir ve sınırsızca başkalarının duygularını okuyabilirsin.',
    },
  ]
}

// Shared FAQ patterns in English (personalised with the emotion name)
function commonFaqsEn(name: string): EmotionFaq[] {
  return [
    {
      q: `How do you share ${name.toLowerCase()} on Emotion Universe?`,
      a: `Sign up for free, enter the ${name} planet, write your feelings in a few sentences, and your post becomes a star shining in the universe. You can also read other people's posts on the same planet.`,
    },
    {
      q: 'Are my posts anonymous?',
      a: 'Yes. A star shows only the feeling text and the creation date; who you are stays hidden. If you wish, you can also start messaging someone anonymously.',
    },
    {
      q: 'Is Emotion Universe free?',
      a: 'Yes, it is completely free. After signing up you can share a set number of stars each day and read other people’s emotions without any limit.',
    },
  ]
}

export const EMOTIONS: EmotionContent[] = [
  {
    slug: 'mutluluk',
    name_tr: 'Mutluluk',
    name_en: 'Happiness',
    color: '#FFD700',
    heading: 'Mutluluk: Sevincini Paylaş',
    heading_en: 'Happiness: Share Your Joy',
    metaTitle: 'Mutluluk Duyguları: Sevincini Yıldızlara Dönüştür',
    metaDescription:
      'Mutluluk anlarını paylaş, sevincini bir yıldıza dönüştür. Duygu Evreni Mutluluk gezegeninde neşeni anonim olarak yaz ve başkalarının mutluluklarını oku.',
    keywords: ['mutluluk sözleri', 'mutluluk paylaşımı', 'sevinç', 'mutlu anlar', 'neşe'],
    lead: 'Mutluluk, paylaştıkça çoğalan bir duygudur. Küçük bir an, beklenmedik bir haber ya da uzun süredir beklenen bir başarı; hepsi yazıya döküldüğünde daha kalıcı hâle gelir.',
    lead_en:
      'Happiness is a feeling that grows the more you share it. A small moment, unexpected news, or a long-awaited success, all of them become more lasting once they are put into words.',
    body: [
      'Sevincimizi anlatmak, o anı yeniden yaşamamızı ve başkalarına da iyi gelmesini sağlar. Araştırmalar, olumlu deneyimleri paylaşmanın iyi oluş hâlini artırdığını gösterir. Duygu Evreni Mutluluk gezegeni, tam da bunun için bir alan sunar.',
      'Burada mutluluğunu birkaç cümleyle yazarsın ve paylaşımın evrende parlayan bir yıldıza dönüşür. İsim vermene gerek yok; her paylaşım anonimdir. Aynı gezegende başkalarının mutluluk anlarını da okuyabilir, onların sevincine ortak olabilirsin.',
    ],
    body_en: [
      'Telling others about our joy lets us relive the moment and brings something good to them too. Research shows that sharing positive experiences increases well-being. The Happiness planet of Emotion Universe offers a space made exactly for this.',
      'Here you write your happiness in a few sentences and your post turns into a star shining in the universe. There is no need to give your name; every post is anonymous. You can also read other people’s happy moments on the same planet and share in their joy.',
    ],
    faqs: [
      {
        q: 'Mutluluğu paylaşmak neden iyi gelir?',
        a: 'Olumlu bir anı başkalarıyla paylaşmak o duyguyu pekiştirir ve süresini uzatır. Sevincini yazıya dökmek hem anı kalıcılaştırır hem de okuyan birine ilham verir.',
      },
      ...commonFaqs('Mutluluk'),
    ],
    faqs_en: [
      {
        q: 'Why does sharing happiness feel good?',
        a: 'Sharing a positive moment with others reinforces the feeling and makes it last longer. Putting your joy into words both preserves the moment and can inspire whoever reads it.',
      },
      ...commonFaqsEn('Happiness'),
    ],
    related: ['huzur', 'ask', 'umut'],
  },
  {
    slug: 'ask',
    name_tr: 'Aşk',
    name_en: 'Love',
    color: '#FF69B4',
    heading: 'Aşk: Sevgini Yıldızlara Yaz',
    heading_en: 'Love: Write Your Affection to the Stars',
    metaTitle: 'Aşk ve Sevgi Sözleri: Duygularını Paylaş',
    metaDescription:
      'Aşk ve sevgi duygularını anonim olarak paylaş. Duygu Evreni Aşk gezegeninde kalbindekileri yıldıza dönüştür, başkalarının aşk dolu paylaşımlarını oku.',
    keywords: ['aşk sözleri', 'sevgi sözleri', 'aşk duyguları', 'romantik sözler', 'aşk mesajları'],
    lead: 'Aşk, çoğu zaman söze dökülmeyi bekleyen bir duygudur. İçimizde büyüyen sevgiyi anlatmak hem rahatlatır hem de o bağı güçlendirir.',
    lead_en:
      'Love is often a feeling waiting to be put into words. Expressing the affection growing inside us both brings relief and strengthens the bond.',
    body: [
      'Bazen sevdiğimize söyleyemediklerimizi bir yere yazmak isteriz. Duygu Evreni Aşk gezegeni, bu sözleri kimseyi rahatsız etmeden, isim vermeden paylaşabileceğin bir alan sunar. Yazdığın her şey anonim bir yıldıza dönüşür.',
      'İster karşılıksız bir sevgi, ister yıllara dayanan bir bağ olsun; duygularını yazıya dökmek onları görünür kılar. Aynı gezegende başkalarının aşk dolu yıldızlarını okuyarak yalnız olmadığını hatırlarsın.',
    ],
    body_en: [
      'Sometimes we want to write down what we couldn’t say to the one we love. The Love planet of Emotion Universe gives you a space to share these words without disturbing anyone and without giving your name. Everything you write turns into an anonymous star.',
      'Whether it is an unrequited love or a bond that has lasted for years, putting your feelings into words makes them visible. By reading other people’s love-filled stars on the same planet, you remember that you are not alone.',
    ],
    faqs: [
      {
        q: 'Söyleyemediğim aşkı nereye yazabilirim?',
        a: 'Aşk gezegeni tam da bunun için var: karşı tarafa iletmeden, isim vermeden duygunu bir yıldıza dönüştürebilirsin. İçini dökmek çoğu zaman rahatlatır.',
      },
      ...commonFaqs('Aşk'),
    ],
    faqs_en: [
      {
        q: 'Where can I write the love I couldn’t confess?',
        a: 'The Love planet exists exactly for this: you can turn your feeling into a star without sending it to the other person and without giving your name. Letting it out often brings relief.',
      },
      ...commonFaqsEn('Love'),
    ],
    related: ['ozlem', 'mutluluk', 'huzur'],
  },
  {
    slug: 'umut',
    name_tr: 'Umut',
    name_en: 'Hope',
    color: '#20D9D2',
    heading: 'Umut: Geleceğe Dair Dileklerini Paylaş',
    heading_en: 'Hope: Share Your Wishes for the Future',
    metaTitle: 'Umut Sözleri ve Mesajları: Dileklerini Paylaş',
    metaDescription:
      'Umutlarını ve geleceğe dair dileklerini paylaş. Duygu Evreni Umut gezegeninde beklentilerini bir yıldıza dönüştür, başkalarının umutlarından güç al.',
    keywords: ['umut sözleri', 'umut mesajları', 'gelecek', 'dilek', 'umutlu sözler'],
    lead: 'Umut, en zor anlarda bile bizi ayakta tutan duygudur. Geleceğe dair bir dilek, küçük bir beklenti ya da içten bir temenni; hepsi paylaşıldığında güç kazanır.',
    lead_en:
      'Hope is the feeling that keeps us standing even in the hardest moments. A wish for the future, a small expectation, or a heartfelt hope, all of them gain strength when shared.',
    body: [
      'Umutlarımızı yazıya dökmek, onları daha gerçek ve ulaşılabilir hissettirir. Duygu Evreni Umut gezegeni, geleceğe dair dileklerini anonim olarak paylaşabileceğin bir alandır.',
      'Yazdığın her umut, evrende parlayan bir yıldıza dönüşür. Aynı gezegende başkalarının umutlarını okumak, zor günlerde yalnız olmadığını ve herkesin bir şeyler beklediğini hatırlatır.',
    ],
    body_en: [
      'Putting our hopes into words makes them feel more real and within reach. The Hope planet of Emotion Universe is a space where you can share your wishes for the future anonymously.',
      'Every hope you write turns into a star shining in the universe. Reading other people’s hopes on the same planet reminds you that you are not alone on hard days and that everyone is waiting for something.',
    ],
    faqs: [
      {
        q: 'Umudumu yazmak gerçekten yardımcı olur mu?',
        a: 'Bir dileği ya da beklentiyi kelimelere dökmek onu daha somut ve ulaşılabilir hissettirir. Başkalarının umutlarını okumak da zor günlerde motivasyon verir.',
      },
      ...commonFaqs('Umut'),
    ],
    faqs_en: [
      {
        q: 'Does writing down my hope really help?',
        a: 'Putting a wish or expectation into words makes it feel more concrete and reachable. Reading other people’s hopes also gives motivation on difficult days.',
      },
      ...commonFaqsEn('Hope'),
    ],
    related: ['mutluluk', 'huzur', 'huzun'],
  },
  {
    slug: 'huzur',
    name_tr: 'Huzur',
    name_en: 'Peace',
    color: '#86EFAC',
    heading: 'Huzur: Sükunet Anlarını Paylaş',
    heading_en: 'Peace: Share Your Moments of Calm',
    metaTitle: 'Huzur ve İç Huzuru: Sükunet Anlarını Paylaş',
    metaDescription:
      'İç huzurunu ve sükunet anlarını paylaş. Duygu Evreni Huzur gezegeninde dinginlik hissini bir yıldıza dönüştür, başkalarının huzur veren paylaşımlarını oku.',
    keywords: ['huzur', 'sükunet', 'iç huzuru', 'huzur sözleri', 'dinginlik'],
    lead: 'Huzur, sessiz ama derin bir duygudur. Bazen bir manzara, bazen bir an, bazen de zihnin sakinleştiği o kısa süre bize huzur verir.',
    lead_en:
      'Peace is a quiet but deep feeling. Sometimes a view, sometimes a moment, sometimes that short while when the mind goes still gives us peace.',
    body: [
      'Huzur anlarını fark etmek ve onları yazıya dökmek, o dinginliği yeniden hatırlamamızı sağlar. Duygu Evreni Huzur gezegeni, bu sakin anları paylaşabileceğin bir alandır.',
      'Paylaştığın her huzur anı anonim bir yıldıza dönüşür. Aynı gezegende başkalarının dingin paylaşımlarını okumak, zihnini yavaşlatır ve sana iyi gelir.',
    ],
    body_en: [
      'Noticing moments of peace and writing them down helps us remember that calm again. The Peace planet of Emotion Universe is a space where you can share these quiet moments.',
      'Every moment of peace you share turns into an anonymous star. Reading other people’s serene posts on the same planet slows your mind and does you good.',
    ],
    faqs: [
      {
        q: 'Huzur anlarını paylaşmanın faydası ne?',
        a: 'Sakin bir anı fark edip yazıya dökmek, o dinginliği yeniden yaşamanı sağlar. Başkalarının huzur veren paylaşımlarını okumak da zihni yavaşlatır ve rahatlatır.',
      },
      ...commonFaqs('Huzur'),
    ],
    faqs_en: [
      {
        q: 'What is the benefit of sharing moments of peace?',
        a: 'Noticing a calm moment and writing it down lets you experience that stillness again. Reading other people’s peaceful posts also slows the mind and brings relief.',
      },
      ...commonFaqsEn('Peace'),
    ],
    related: ['mutluluk', 'umut', 'ask'],
  },
  {
    slug: 'ozlem',
    name_tr: 'Özlem',
    name_en: 'Longing',
    color: '#A855F7',
    heading: 'Özlem: Hasretini Anlat',
    heading_en: 'Longing: Tell Us What You Miss',
    metaTitle: 'Özlem ve Hasret Sözleri: Duygularını Paylaş',
    metaDescription:
      'Özlemini ve hasretini paylaş. Duygu Evreni Özlem gezegeninde içindeki hasreti bir yıldıza dönüştür, aynı duyguyu yaşayanların paylaşımlarını oku.',
    keywords: ['özlem sözleri', 'hasret sözleri', 'özlem mesajları', 'özlem', 'hasret'],
    lead: 'Özlem, sevdiğimiz birine, bir yere ya da geçmişe duyduğumuz derin bir hasrettir. Anlatması zor ama paylaşması rahatlatıcıdır.',
    lead_en:
      'Longing is a deep yearning for someone, somewhere, or the past. It is hard to describe, but sharing it brings relief.',
    body: [
      'Özlediğimiz şeyi yazıya dökmek, o duyguyu taşımayı kolaylaştırır. Duygu Evreni Özlem gezegeni, içindeki hasreti isim vermeden paylaşabileceğin bir alandır.',
      'Yazdığın her özlem anonim bir yıldıza dönüşür. Aynı gezegende başkalarının hasretlerini okumak, bu duygunun evrensel olduğunu ve yalnız olmadığını hatırlatır.',
    ],
    body_en: [
      'Writing down what we miss makes the feeling easier to carry. The Longing planet of Emotion Universe is a space where you can share the yearning inside you without giving your name.',
      'Every longing you write turns into an anonymous star. Reading other people’s yearnings on the same planet reminds you that this feeling is universal and that you are not alone.',
    ],
    faqs: [
      {
        q: 'Birini özlediğimde bunu nasıl ifade ederim?',
        a: 'Özlemini kelimelere dökmek o ağır hissi taşımayı kolaylaştırır. Özlem gezegeninde hasretini anonim bir yıldıza dönüştürebilir, aynı duyguyu yaşayanların yazdıklarını okuyabilirsin.',
      },
      ...commonFaqs('Özlem'),
    ],
    faqs_en: [
      {
        q: 'How do I express it when I miss someone?',
        a: 'Putting your longing into words makes that heavy feeling easier to carry. On the Longing planet you can turn your yearning into an anonymous star and read what others feeling the same have written.',
      },
      ...commonFaqsEn('Longing'),
    ],
    related: ['ask', 'huzun', 'pismanlik'],
  },
  {
    slug: 'huzun',
    name_tr: 'Hüzün',
    name_en: 'Sadness',
    color: '#4A5FDD',
    heading: 'Hüzün: İçindeki Kederi Paylaş',
    heading_en: 'Sadness: Share the Sorrow Inside You',
    metaTitle: 'Hüzünlü Sözler: Üzüntünü Paylaş',
    metaDescription:
      'Üzüntünü ve hüznünü paylaş. Duygu Evreni Hüzün gezegeninde içindeki kederi bir yıldıza dönüştür, aynı duyguyu yaşayanların yanında olduğunu hisset.',
    keywords: ['hüzünlü sözler', 'üzüntü', 'keder', 'hüzün mesajları', 'hüzün'],
    lead: 'Hüzün, herkesin zaman zaman yaşadığı doğal bir duygudur. Onu bastırmak yerine ifade etmek çoğu zaman daha iyi gelir.',
    lead_en:
      'Sadness is a natural feeling everyone experiences from time to time. Expressing it instead of suppressing it usually feels better.',
    body: [
      'Üzüntümüzü kelimelere dökmek, içimizdeki ağırlığı bir nebze hafifletir. Duygu Evreni Hüzün gezegeni, kederini yargılanmadan, isim vermeden paylaşabileceğin bir alandır.',
      'Yazdığın her his anonim bir yıldıza dönüşür. Aynı gezegende başkalarının hüzünlerini okumak, bu duygunun paylaşıldığını ve yalnız olmadığını hissettirir.',
    ],
    body_en: [
      'Putting our sorrow into words lightens the weight inside us a little. The Sadness planet of Emotion Universe is a space where you can share your sorrow without being judged and without giving your name.',
      'Every feeling you write turns into an anonymous star. Reading other people’s sorrows on the same planet shows that this feeling is shared and that you are not alone.',
    ],
    faqs: [
      {
        q: 'Üzüntümü paylaşmak içimi rahatlatır mı?',
        a: 'Evet, duyguları bastırmak yerine ifade etmek çoğu zaman iyi gelir. Kederini yargılanmadan yazabileceğin bir alanda paylaşmak, içindeki ağırlığı bir nebze hafifletir.',
      },
      ...commonFaqs('Hüzün'),
    ],
    faqs_en: [
      {
        q: 'Will sharing my sadness make me feel better?',
        a: 'Yes, expressing emotions instead of suppressing them usually helps. Sharing your sorrow in a space where you will not be judged lightens the weight inside you a little.',
      },
      ...commonFaqsEn('Sadness'),
    ],
    related: ['ozlem', 'depresyon', 'pismanlik'],
  },
  {
    slug: 'pismanlik',
    name_tr: 'Pişmanlık',
    name_en: 'Regret',
    color: '#8B4513',
    heading: 'Pişmanlık: Vicdanını Hafiflet',
    heading_en: 'Regret: Ease Your Conscience',
    metaTitle: 'Pişmanlık Sözleri: İçini Dök',
    metaDescription:
      'Pişmanlıklarını paylaş, içini dök. Duygu Evreni Pişmanlık gezegeninde geçmişe dair duygularını bir yıldıza dönüştür ve vicdanını hafiflet.',
    keywords: ['pişmanlık sözleri', 'pişmanlık', 'vicdan', 'keşke', 'geçmiş pişmanlıkları'],
    lead: 'Pişmanlık, geçmişe dair taşıdığımız ağır bir duygudur. Söyleyemediğimiz, yapamadığımız ya da keşke dediğimiz şeyler içimizde birikir.',
    lead_en:
      'Regret is a heavy feeling we carry about the past. The things we could not say, could not do, or wish we had pile up inside us.',
    body: [
      'Pişmanlıklarımızı bir yere yazmak, onlarla yüzleşmeyi ve yükü hafifletmeyi kolaylaştırır. Duygu Evreni Pişmanlık gezegeni, içini isim vermeden dökebileceğin bir alandır.',
      'Yazdığın her pişmanlık anonim bir yıldıza dönüşür. Aynı gezegende başkalarının paylaşımlarını okumak, herkesin geçmişiyle bir hesabı olduğunu ve yalnız olmadığını gösterir.',
    ],
    body_en: [
      'Writing our regrets down somewhere makes it easier to face them and lighten the load. The Regret planet of Emotion Universe is a space where you can pour out your heart without giving your name.',
      'Every regret you write turns into an anonymous star. Reading other people’s posts on the same planet shows that everyone has a reckoning with their past and that you are not alone.',
    ],
    faqs: [
      {
        q: 'Pişmanlıklarımı yazmak yardımcı olur mu?',
        a: 'Geçmişe dair “keşke” dediklerini bir yere yazmak, onlarla yüzleşmeyi ve yükü hafifletmeyi kolaylaştırır. Başkalarının pişmanlıklarını okumak da yalnız olmadığını hatırlatır.',
      },
      ...commonFaqs('Pişmanlık'),
    ],
    faqs_en: [
      {
        q: 'Does writing down my regrets help?',
        a: 'Writing down the “I wish I had” thoughts about your past makes it easier to face them and lighten the load. Reading other people’s regrets also reminds you that you are not alone.',
      },
      ...commonFaqsEn('Regret'),
    ],
    related: ['huzun', 'ofke', 'ozlem'],
  },
  {
    slug: 'korku',
    name_tr: 'Korku',
    name_en: 'Fear',
    color: '#9333EA',
    heading: 'Korku: Endişelerini Paylaş',
    heading_en: 'Fear: Share Your Worries',
    metaTitle: 'Korku ve Kaygı: Endişelerini Paylaş',
    metaDescription:
      'Korkularını ve kaygılarını paylaş. Duygu Evreni Korku gezegeninde içindeki endişeyi bir yıldıza dönüştür, aynı duyguyu yaşayanların yanında olduğunu hisset.',
    keywords: ['korku', 'kaygı', 'endişe', 'korku sözleri', 'kaygı paylaşımı'],
    lead: 'Korku ve kaygı, bilinmezlik karşısında hepimizin yaşadığı doğal tepkilerdir. Endişelerimizi içimizde tutmak çoğu zaman onları büyütür.',
    lead_en:
      'Fear and anxiety are natural reactions we all have in the face of the unknown. Keeping our worries inside often makes them grow.',
    body: [
      'Korkularımızı yazıya dökmek, onlara biraz uzaktan bakmamızı ve kontrol hissi kazanmamızı sağlar. Duygu Evreni Korku gezegeni, kaygılarını isim vermeden paylaşabileceğin bir alandır.',
      'Yazdığın her endişe anonim bir yıldıza dönüşür. Aynı gezegende başkalarının korkularını okumak, bu duyguyla yalnız savaşmadığını hatırlatır.',
    ],
    body_en: [
      'Putting our fears into words lets us look at them from a little distance and regain a sense of control. The Fear planet of Emotion Universe is a space where you can share your worries without giving your name.',
      'Every worry you write turns into an anonymous star. Reading other people’s fears on the same planet reminds you that you are not fighting this feeling alone.',
    ],
    faqs: [
      {
        q: 'Kaygılarımı yazmak korkumu azaltır mı?',
        a: 'Bir korkuyu kelimelere dökmek ona biraz uzaktan bakmanı ve kontrol hissi kazanmanı sağlar. Aynı endişeleri yaşayan başkalarını görmek de yalnız olmadığını hatırlatır.',
      },
      ...commonFaqs('Korku'),
    ],
    faqs_en: [
      {
        q: 'Will writing down my worries reduce my fear?',
        a: 'Putting a fear into words lets you look at it from a distance and regain a sense of control. Seeing others who share the same worries also reminds you that you are not alone.',
      },
      ...commonFaqsEn('Fear'),
    ],
    related: ['depresyon', 'huzun', 'umut'],
  },
  {
    slug: 'ofke',
    name_tr: 'Öfke',
    name_en: 'Anger',
    color: '#FF4444',
    heading: 'Öfke: Kızgınlığını Dışa Vur',
    heading_en: 'Anger: Let Out Your Frustration',
    metaTitle: 'Öfke ve Kızgınlık: Duygularını Boşalt',
    metaDescription:
      'Öfkeni ve kızgınlığını sağlıklı bir şekilde dışa vur. Duygu Evreni Öfke gezegeninde içindeki sinirini bir yıldıza dönüştür, birikmiş duygularını boşalt.',
    keywords: ['öfke sözleri', 'kızgınlık', 'sinir', 'öfke', 'hayal kırıklığı'],
    lead: 'Öfke, haksızlık ve hayal kırıklığı karşısında yükselen güçlü bir duygudur. Bastırıldığında birikir; ifade edildiğinde ise hafifler.',
    lead_en:
      'Anger is a powerful feeling that rises against injustice and disappointment. Suppressed, it builds up; expressed, it eases.',
    body: [
      'Kızgınlığımızı kimseye zarar vermeden bir yere yazmak, içimizdeki baskıyı boşaltmanın sağlıklı bir yoludur. Duygu Evreni Öfke gezegeni, sinirini isim vermeden dışa vurabileceğin bir alandır.',
      'Yazdığın her öfke anonim bir yıldıza dönüşür. Aynı gezegende başkalarının paylaşımlarını okumak, kızgınlığın insani ve paylaşılan bir duygu olduğunu hatırlatır.',
    ],
    body_en: [
      'Writing our anger down somewhere without harming anyone is a healthy way to release the pressure inside. The Anger planet of Emotion Universe is a space where you can let out your frustration without giving your name.',
      'Every anger you write turns into an anonymous star. Reading other people’s posts on the same planet reminds you that anger is a human, shared feeling.',
    ],
    faqs: [
      {
        q: 'Öfkemi nasıl sağlıklı şekilde boşaltabilirim?',
        a: 'Kızgınlığını kimseye zarar vermeden bir yere yazmak, içindeki baskıyı boşaltmanın sağlıklı yollarından biridir. Öfke gezegeninde sinirini anonim olarak dışa vurabilirsin.',
      },
      ...commonFaqs('Öfke'),
    ],
    faqs_en: [
      {
        q: 'How can I let out my anger in a healthy way?',
        a: 'Writing your anger down somewhere without harming anyone is one of the healthy ways to release the pressure inside. On the Anger planet you can let out your frustration anonymously.',
      },
      ...commonFaqsEn('Anger'),
    ],
    related: ['pismanlik', 'korku', 'huzun'],
  },
  {
    slug: 'depresyon',
    name_tr: 'Depresyon',
    name_en: 'Depression',
    color: '#64748B',
    heading: 'Depresyon: Yalnız Değilsin',
    heading_en: 'Depression: You Are Not Alone',
    metaTitle: 'Depresyon ve Ağır Ruh Halleri: Yalnız Değilsin',
    metaDescription:
      'Ağır ruh hâllerini paylaş, yalnız olmadığını hisset. Duygu Evreni Depresyon gezegeninde içindekileri anonim olarak yazabilir, başkalarının paylaşımlarından destek bulabilirsin.',
    keywords: ['depresyon', 'yalnızlık', 'ağır ruh hali', 'depresyondaki hisler', 'umutsuzluk'],
    lead: 'Depresyon ve ağır ruh hâlleri, anlatması en zor duygular arasındadır. Ama içinde tuttuğun her şeyi bir yere yazmak ilk adım olabilir.',
    lead_en:
      'Depression and heavy moods are among the hardest feelings to put into words. But writing down everything you are holding inside can be a first step.',
    body: [
      'Bazen sadece duygularını ifade edebileceğin, yargılanmayacağın bir alana ihtiyaç duyarız. Duygu Evreni Depresyon gezegeni, içindekileri isim vermeden paylaşabileceğin böyle bir alan sunar. Yazdığın her şey anonim bir yıldıza dönüşür.',
      'Aynı gezegende başkalarının paylaşımlarını okumak, bu yolda yalnız olmadığını hissettirir. Yine de unutma: paylaşmak iyi gelir ama profesyonel desteğin yerini tutmaz.',
    ],
    body_en: [
      'Sometimes we just need a space where we can express our feelings and will not be judged. The Depression planet of Emotion Universe offers such a space, where you can share what is inside you without giving your name. Everything you write becomes an anonymous star.',
      'Reading other people’s posts on the same planet helps you feel that you are not alone on this path. Still, remember: sharing helps, but it is not a substitute for professional support.',
    ],
    faqs: [
      {
        q: 'Kendimi kötü hissediyorum, burada içimi dökebilir miyim?',
        a: 'Evet, içindekileri yargılanmadan ve isim vermeden yazabilirsin. Bu rahatlatabilir; ancak unutma ki paylaşmak profesyonel desteğin yerini tutmaz. Zorlanıyorsan bir uzmana başvurmanı öneririz.',
      },
      ...commonFaqs('Depresyon'),
    ],
    faqs_en: [
      {
        q: 'I feel terrible, can I pour my heart out here?',
        a: 'Yes, you can write what is inside you without being judged and without giving your name. It may bring relief; but remember that sharing is not a substitute for professional support. If you are struggling, we encourage you to reach out to a professional.',
      },
      ...commonFaqsEn('Depression'),
    ],
    supportNote:
      'Kendine zarar verme düşüncelerin varsa lütfen yalnız kalma. Türkiye’de 7/24 ulaşabileceğin destek için ALO 182 Sağlık Danışma Hattı’nı arayabilir veya bir uzmana başvurabilirsin.',
    supportNote_en:
      'If you are having thoughts of harming yourself, please do not stay alone. In Turkey you can reach the ALO 182 Health Counseling Line 24/7; wherever you are, please reach out to a mental-health professional or your local emergency services.',
    related: ['huzun', 'korku', 'umut'],
  },
]

export const EMOTION_SLUGS = EMOTIONS.map((e) => e.slug)

export function getEmotionBySlug(slug: string): EmotionContent | undefined {
  return EMOTIONS.find((e) => e.slug === slug)
}

// name_tr → slug (DB planet kaydını içerik sayfasıyla eşlemek için)
export function getSlugByNameTr(nameTr: string): string | undefined {
  const normalized = nameTr.trim().toLocaleLowerCase('tr-TR')
  return EMOTIONS.find(
    (e) => e.name_tr.toLocaleLowerCase('tr-TR') === normalized
  )?.slug
}
