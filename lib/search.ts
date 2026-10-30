import { AREAS, CRAVINGS, type CravingId, type Spot } from './spots';

// Fold case, Latin accents, apostrophes ("McDonald's" = "mcdonalds"),
// Arabic-Indic digits and the Arabic letter variants people type
// interchangeably (أ/إ/آ → ا, ة → ه, ى → ي, tashkeel dropped).
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ًͯ-ٰٟ]/g, '')
    .replace(/['’`]/g, '')
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0))
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

// How people type the big names in Arabic, so "ماك" finds McDonald's.
// Search-only: they are never displayed.
const ARABIC_ALIASES: Record<string, string> = {
  Cilantro: 'سيلانترو',
  GAD: 'جاد',
  Starbucks: 'ستاربكس',
  TBS: 'تي بي اس',
  'TBS Express': 'تي بي اس',
  "McDonald's": 'ماكدونالدز ماك',
  Cinnabon: 'سينابون',
  Caribou: 'كاريبو',
  'Buffalo Burger': 'بافلو برجر',
  Costa: 'كوستا',
  'Second Cup': 'سكند كب',
  "Dunkin'": 'دانكن',
  Bazooka: 'بازوكا',
  KFC: 'كنتاكي',
  'Pizza Hut': 'بيتزا هت',
  "Hardee's": 'هارديز',
  Paul: 'بول',
  'Espresso Lab': 'اسبريسو لاب',
  "Beano's": 'بينوز',
  "Papa John's": 'بابا جونز',
  'Heart Attack': 'هارت اتاك',
  Mince: 'مينس',
  'Mori Sushi': 'موري سوشي',
  dipndip: 'ديب اند ديب',
  Kansas: 'كانساس',
  'Burger King': 'برجر كينج',
  'Texas Chicken': 'تكساس',
  'Krispy Kreme': 'كريسبي كريم',
  'Baskin Robbins': 'باسكن روبنز',
  "Chili's": 'تشيليز',
  Fuddruckers: 'فادركرز',
  'Studio Misr': 'ستوديو مصر',
  'Abo El Sid': 'ابو السيد',
  Tamara: 'تمارا',
  Zooba: 'زوبا زووبا',
  'Smash Burger': 'سماش برجر',
  "Arby's": 'اربيز',
  'Pizza King': 'بيتزا كينج',
  "Domino's": 'دومينوز',
  'Cook Door': 'كوك دور',
  "Mo'men": 'مؤمن',
  'Koshary El Tahrir': 'كشري التحرير',
};

// Everyday words for each craving, in both scripts, so "مكرونة" or "cafe"
// finds something. Search-only, like the names above.
const CRAVING_ALIASES: Partial<Record<CravingId, string>> = {
  coffee: 'cafe café coffee shop كافيه كوفي قهوة',
  bakery: 'bread croissant مخبز بيكري عيش',
  sweets: 'dessert desserts ice cream donut donuts حلو حلويات ايس كريم دونتس',
  burgers: 'burger',
  chicken: 'chicken broasted wings بروستد',
  sandwiches: 'sandwich shawarma شاورما سندوتش',
  italian: 'pasta macaroni مكرونة',
  egyptian: 'koshari kushari koshary foul ful falafel taameya فول طعمية كشري',
  asian: 'sushi japanese chinese ياباني صيني',
  grill: 'kebab kofta grill كباب كفتة',
  dining: 'restaurant dinner مطعم عشا قعدة',
};

const HAYSTACKS = new Map<string, string>();

function haystack(spot: Spot): string {
  let text = HAYSTACKS.get(spot.id);
  if (text === undefined) {
    const area = AREAS[spot.area];
    const craving = CRAVINGS[spot.craving];
    text = normalize(
      [
        spot.name,
        spot.vicinity,
        ARABIC_ALIASES[spot.brand] ?? '',
        area.en,
        area.ar,
        craving.en,
        craving.ar,
        CRAVING_ALIASES[spot.craving] ?? '',
      ].join(' '),
    );
    HAYSTACKS.set(spot.id, text);
  }
  return text;
}

/** Every word of the query has to appear somewhere in the spot's text. */
export function matches(spot: Spot, query: string): boolean {
  const words = normalize(query).split(' ').filter(Boolean);
  if (words.length === 0) return true;
  const text = haystack(spot);
  return words.every((word) => text.includes(word));
}
