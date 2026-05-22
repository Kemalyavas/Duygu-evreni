// Duygu içerik sayfaları için statik kaynak (SEO).
// Her duygu, /gezegen/<slug> içerik sayfasının kaynağıdır.
// DB'deki planet kaydıyla `name_tr` üzerinden eşleşir (UUID gerekmez).
// ÖNEMLI: Burada kullanıcı yıldızları (kişisel itiraflar) YOK — sadece editoryal,
// kalıcı (evergreen) içerik. Kişisel/hassas içerik Google'a açılmaz.

export interface EmotionContent {
  slug: string
  name_tr: string
  name_en: string
  color: string
  /** Sayfa H1 başlığı */
  heading: string
  /** <title> için (kök şablon "| Duygu Evreni" ekler) */
  metaTitle: string
  metaDescription: string
  keywords: string[]
  /** Giriş paragrafı */
  lead: string
  /** Gövde paragrafları */
  body: string[]
  /** İlgili duygu slug'ları (iç linkleme) */
  related: string[]
  /** Hassas duygular için destekleyici not (opsiyonel) */
  supportNote?: string
}

export const EMOTIONS: EmotionContent[] = [
  {
    slug: 'mutluluk',
    name_tr: 'Mutluluk',
    name_en: 'Happiness',
    color: '#FFD700',
    heading: 'Mutluluk — Sevincini Paylaş',
    metaTitle: 'Mutluluk Duyguları — Sevincini Yıldızlara Dönüştür',
    metaDescription:
      'Mutluluk anlarını paylaş, sevincini bir yıldıza dönüştür. Duygu Evreni Mutluluk gezegeninde neşeni anonim olarak yaz ve başkalarının mutluluklarını oku.',
    keywords: ['mutluluk sözleri', 'mutluluk paylaşımı', 'sevinç', 'mutlu anlar', 'neşe'],
    lead: 'Mutluluk, paylaştıkça çoğalan bir duygudur. Küçük bir an, beklenmedik bir haber ya da uzun süredir beklenen bir başarı; hepsi yazıya döküldüğünde daha kalıcı hâle gelir.',
    body: [
      'Sevincimizi anlatmak, o anı yeniden yaşamamızı ve başkalarına da iyi gelmesini sağlar. Araştırmalar, olumlu deneyimleri paylaşmanın iyi oluş hâlini artırdığını gösterir. Duygu Evreni Mutluluk gezegeni, tam da bunun için bir alan sunar.',
      'Burada mutluluğunu birkaç cümleyle yazarsın ve paylaşımın evrende parlayan bir yıldıza dönüşür. İsim vermene gerek yok; her paylaşım anonimdir. Aynı gezegende başkalarının mutluluk anlarını da okuyabilir, onların sevincine ortak olabilirsin.',
    ],
    related: ['huzur', 'ask', 'umut'],
  },
  {
    slug: 'ask',
    name_tr: 'Aşk',
    name_en: 'Love',
    color: '#FF69B4',
    heading: 'Aşk — Sevgini Yıldızlara Yaz',
    metaTitle: 'Aşk ve Sevgi Sözleri — Duygularını Paylaş',
    metaDescription:
      'Aşk ve sevgi duygularını anonim olarak paylaş. Duygu Evreni Aşk gezegeninde kalbindekileri yıldıza dönüştür, başkalarının aşk dolu paylaşımlarını oku.',
    keywords: ['aşk sözleri', 'sevgi sözleri', 'aşk duyguları', 'romantik sözler', 'aşk mesajları'],
    lead: 'Aşk, çoğu zaman söze dökülmeyi bekleyen bir duygudur. İçimizde büyüyen sevgiyi anlatmak hem rahatlatır hem de o bağı güçlendirir.',
    body: [
      'Bazen sevdiğimize söyleyemediklerimizi bir yere yazmak isteriz. Duygu Evreni Aşk gezegeni, bu sözleri kimseyi rahatsız etmeden, isim vermeden paylaşabileceğin bir alan sunar. Yazdığın her şey anonim bir yıldıza dönüşür.',
      'İster karşılıksız bir sevgi, ister yıllara dayanan bir bağ olsun; duygularını yazıya dökmek onları görünür kılar. Aynı gezegende başkalarının aşk dolu yıldızlarını okuyarak yalnız olmadığını hatırlarsın.',
    ],
    related: ['ozlem', 'mutluluk', 'huzur'],
  },
  {
    slug: 'umut',
    name_tr: 'Umut',
    name_en: 'Hope',
    color: '#20D9D2',
    heading: 'Umut — Geleceğe Dair Dileklerini Paylaş',
    metaTitle: 'Umut Sözleri ve Mesajları — Dileklerini Paylaş',
    metaDescription:
      'Umutlarını ve geleceğe dair dileklerini paylaş. Duygu Evreni Umut gezegeninde beklentilerini bir yıldıza dönüştür, başkalarının umutlarından güç al.',
    keywords: ['umut sözleri', 'umut mesajları', 'gelecek', 'dilek', 'umutlu sözler'],
    lead: 'Umut, en zor anlarda bile bizi ayakta tutan duygudur. Geleceğe dair bir dilek, küçük bir beklenti ya da içten bir temenni; hepsi paylaşıldığında güç kazanır.',
    body: [
      'Umutlarımızı yazıya dökmek, onları daha gerçek ve ulaşılabilir hissettirir. Duygu Evreni Umut gezegeni, geleceğe dair dileklerini anonim olarak paylaşabileceğin bir alandır.',
      'Yazdığın her umut, evrende parlayan bir yıldıza dönüşür. Aynı gezegende başkalarının umutlarını okumak, zor günlerde yalnız olmadığını ve herkesin bir şeyler beklediğini hatırlatır.',
    ],
    related: ['mutluluk', 'huzur', 'huzun'],
  },
  {
    slug: 'huzur',
    name_tr: 'Huzur',
    name_en: 'Peace',
    color: '#86EFAC',
    heading: 'Huzur — Sükunet Anlarını Paylaş',
    metaTitle: 'Huzur ve İç Huzuru — Sükunet Anlarını Paylaş',
    metaDescription:
      'İç huzurunu ve sükunet anlarını paylaş. Duygu Evreni Huzur gezegeninde dinginlik hissini bir yıldıza dönüştür, başkalarının huzur veren paylaşımlarını oku.',
    keywords: ['huzur', 'sükunet', 'iç huzuru', 'huzur sözleri', 'dinginlik'],
    lead: 'Huzur, sessiz ama derin bir duygudur. Bazen bir manzara, bazen bir an, bazen de zihnin sakinleştiği o kısa süre bize huzur verir.',
    body: [
      'Huzur anlarını fark etmek ve onları yazıya dökmek, o dinginliği yeniden hatırlamamızı sağlar. Duygu Evreni Huzur gezegeni, bu sakin anları paylaşabileceğin bir alandır.',
      'Paylaştığın her huzur anı anonim bir yıldıza dönüşür. Aynı gezegende başkalarının dingin paylaşımlarını okumak, zihnini yavaşlatır ve sana iyi gelir.',
    ],
    related: ['mutluluk', 'umut', 'ask'],
  },
  {
    slug: 'ozlem',
    name_tr: 'Özlem',
    name_en: 'Longing',
    color: '#A855F7',
    heading: 'Özlem — Hasretini Anlat',
    metaTitle: 'Özlem ve Hasret Sözleri — Duygularını Paylaş',
    metaDescription:
      'Özlemini ve hasretini paylaş. Duygu Evreni Özlem gezegeninde içindeki hasreti bir yıldıza dönüştür, aynı duyguyu yaşayanların paylaşımlarını oku.',
    keywords: ['özlem sözleri', 'hasret sözleri', 'özlem mesajları', 'özlem', 'hasret'],
    lead: 'Özlem, sevdiğimiz birine, bir yere ya da geçmişe duyduğumuz derin bir hasrettir. Anlatması zor ama paylaşması rahatlatıcıdır.',
    body: [
      'Özlediğimiz şeyi yazıya dökmek, o duyguyu taşımayı kolaylaştırır. Duygu Evreni Özlem gezegeni, içindeki hasreti isim vermeden paylaşabileceğin bir alandır.',
      'Yazdığın her özlem anonim bir yıldıza dönüşür. Aynı gezegende başkalarının hasretlerini okumak, bu duygunun evrensel olduğunu ve yalnız olmadığını hatırlatır.',
    ],
    related: ['ask', 'huzun', 'pismanlik'],
  },
  {
    slug: 'huzun',
    name_tr: 'Hüzün',
    name_en: 'Sadness',
    color: '#4A5FDD',
    heading: 'Hüzün — İçindeki Kederi Paylaş',
    metaTitle: 'Hüzünlü Sözler — Üzüntünü Paylaş',
    metaDescription:
      'Üzüntünü ve hüznünü paylaş. Duygu Evreni Hüzün gezegeninde içindeki kederi bir yıldıza dönüştür, aynı duyguyu yaşayanların yanında olduğunu hisset.',
    keywords: ['hüzünlü sözler', 'üzüntü', 'keder', 'hüzün mesajları', 'hüzün'],
    lead: 'Hüzün, herkesin zaman zaman yaşadığı doğal bir duygudur. Onu bastırmak yerine ifade etmek çoğu zaman daha iyi gelir.',
    body: [
      'Üzüntümüzü kelimelere dökmek, içimizdeki ağırlığı bir nebze hafifletir. Duygu Evreni Hüzün gezegeni, kederini yargılanmadan, isim vermeden paylaşabileceğin bir alandır.',
      'Yazdığın her his anonim bir yıldıza dönüşür. Aynı gezegende başkalarının hüzünlerini okumak, bu duygunun paylaşıldığını ve yalnız olmadığını hissettirir.',
    ],
    related: ['ozlem', 'depresyon', 'pismanlik'],
  },
  {
    slug: 'pismanlik',
    name_tr: 'Pişmanlık',
    name_en: 'Regret',
    color: '#8B4513',
    heading: 'Pişmanlık — Vicdanını Hafiflet',
    metaTitle: 'Pişmanlık Sözleri — İçini Dök',
    metaDescription:
      'Pişmanlıklarını paylaş, içini dök. Duygu Evreni Pişmanlık gezegeninde geçmişe dair duygularını bir yıldıza dönüştür ve vicdanını hafiflet.',
    keywords: ['pişmanlık sözleri', 'pişmanlık', 'vicdan', 'keşke', 'geçmiş pişmanlıkları'],
    lead: 'Pişmanlık, geçmişe dair taşıdığımız ağır bir duygudur. Söyleyemediğimiz, yapamadığımız ya da keşke dediğimiz şeyler içimizde birikir.',
    body: [
      'Pişmanlıklarımızı bir yere yazmak, onlarla yüzleşmeyi ve yükü hafifletmeyi kolaylaştırır. Duygu Evreni Pişmanlık gezegeni, içini isim vermeden dökebileceğin bir alandır.',
      'Yazdığın her pişmanlık anonim bir yıldıza dönüşür. Aynı gezegende başkalarının paylaşımlarını okumak, herkesin geçmişiyle bir hesabı olduğunu ve yalnız olmadığını gösterir.',
    ],
    related: ['huzun', 'ofke', 'ozlem'],
  },
  {
    slug: 'korku',
    name_tr: 'Korku',
    name_en: 'Fear',
    color: '#9333EA',
    heading: 'Korku — Endişelerini Paylaş',
    metaTitle: 'Korku ve Kaygı — Endişelerini Paylaş',
    metaDescription:
      'Korkularını ve kaygılarını paylaş. Duygu Evreni Korku gezegeninde içindeki endişeyi bir yıldıza dönüştür, aynı duyguyu yaşayanların yanında olduğunu hisset.',
    keywords: ['korku', 'kaygı', 'endişe', 'korku sözleri', 'kaygı paylaşımı'],
    lead: 'Korku ve kaygı, bilinmezlik karşısında hepimizin yaşadığı doğal tepkilerdir. Endişelerimizi içimizde tutmak çoğu zaman onları büyütür.',
    body: [
      'Korkularımızı yazıya dökmek, onlara biraz uzaktan bakmamızı ve kontrol hissi kazanmamızı sağlar. Duygu Evreni Korku gezegeni, kaygılarını isim vermeden paylaşabileceğin bir alandır.',
      'Yazdığın her endişe anonim bir yıldıza dönüşür. Aynı gezegende başkalarının korkularını okumak, bu duyguyla yalnız savaşmadığını hatırlatır.',
    ],
    related: ['depresyon', 'huzun', 'umut'],
  },
  {
    slug: 'ofke',
    name_tr: 'Öfke',
    name_en: 'Anger',
    color: '#FF4444',
    heading: 'Öfke — Kızgınlığını Dışa Vur',
    metaTitle: 'Öfke ve Kızgınlık — Duygularını Boşalt',
    metaDescription:
      'Öfkeni ve kızgınlığını sağlıklı bir şekilde dışa vur. Duygu Evreni Öfke gezegeninde içindeki sinirini bir yıldıza dönüştür, birikmiş duygularını boşalt.',
    keywords: ['öfke sözleri', 'kızgınlık', 'sinir', 'öfke', 'hayal kırıklığı'],
    lead: 'Öfke, haksızlık ve hayal kırıklığı karşısında yükselen güçlü bir duygudur. Bastırıldığında birikir; ifade edildiğinde ise hafifler.',
    body: [
      'Kızgınlığımızı kimseye zarar vermeden bir yere yazmak, içimizdeki baskıyı boşaltmanın sağlıklı bir yoludur. Duygu Evreni Öfke gezegeni, sinirini isim vermeden dışa vurabileceğin bir alandır.',
      'Yazdığın her öfke anonim bir yıldıza dönüşür. Aynı gezegende başkalarının paylaşımlarını okumak, kızgınlığın insani ve paylaşılan bir duygu olduğunu hatırlatır.',
    ],
    related: ['pismanlik', 'korku', 'huzun'],
  },
  {
    slug: 'depresyon',
    name_tr: 'Depresyon',
    name_en: 'Depression',
    color: '#64748B',
    heading: 'Depresyon — Yalnız Değilsin',
    metaTitle: 'Depresyon ve Ağır Ruh Halleri — Yalnız Değilsin',
    metaDescription:
      'Ağır ruh hâllerini paylaş, yalnız olmadığını hisset. Duygu Evreni Depresyon gezegeninde içindekileri anonim olarak yazabilir, başkalarının paylaşımlarından destek bulabilirsin.',
    keywords: ['depresyon', 'yalnızlık', 'ağır ruh hali', 'depresyondaki hisler', 'umutsuzluk'],
    lead: 'Depresyon ve ağır ruh hâlleri, anlatması en zor duygular arasındadır. Ama içinde tuttuğun her şeyi bir yere yazmak ilk adım olabilir.',
    body: [
      'Bazen sadece duygularını ifade edebileceğin, yargılanmayacağın bir alana ihtiyaç duyarız. Duygu Evreni Depresyon gezegeni, içindekileri isim vermeden paylaşabileceğin böyle bir alan sunar. Yazdığın her şey anonim bir yıldıza dönüşür.',
      'Aynı gezegende başkalarının paylaşımlarını okumak, bu yolda yalnız olmadığını hissettirir. Yine de unutma: paylaşmak iyi gelir ama profesyonel desteğin yerini tutmaz.',
    ],
    supportNote:
      'Kendine zarar verme düşüncelerin varsa lütfen yalnız kalma. Türkiye’de 7/24 ulaşabileceğin destek için ALO 182 Sağlık Danışma Hattı’nı arayabilir veya bir uzmana başvurabilirsin.',
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
