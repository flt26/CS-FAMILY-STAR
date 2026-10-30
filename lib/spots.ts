// The curated list of food spots around FUE.
//
// `id` is the key stored in `reviews.restaurant_id` in Supabase, so an id must
// never be renamed or removed — the reviews written against it would vanish.
// Coordinates were entered by hand and are approximate: the UI never shows
// distances, and map links search by name instead of by lat/lng.

export type AreaId =
  | 'fue'
  | 'dreams'
  | 'around'
  | '90th'
  | 'concord'
  | 'the-spot'
  | 'point-90'
  | 'silver-star'
  | 'waterway'
  | 'further';

export type CravingId =
  | 'coffee'
  | 'bakery'
  | 'sweets'
  | 'burgers'
  | 'chicken'
  | 'pizza'
  | 'italian'
  | 'sandwiches'
  | 'egyptian'
  | 'asian'
  | 'grill'
  | 'dining';

/** Kept for the public JSON API, which predates cravings. */
export type LegacyCategory = 'Cafe' | 'Restaurant' | 'Fast Food';

export interface Spot {
  id: string;
  /** Name as originally listed, e.g. "Starbucks - Point 90". */
  name: string;
  /** Name without the branch suffix, e.g. "Starbucks". */
  brand: string;
  vicinity: string;
  area: AreaId;
  craving: CravingId;
  category: LegacyCategory;
  lat: number;
  lng: number;
}

export const AREAS: Record<AreaId, { en: string; ar: string }> = {
  fue: { en: 'Inside FUE', ar: 'جوه الجامعة' },
  dreams: { en: 'Dreams Mall', ar: 'دريمز مول' },
  around: { en: 'Around campus', ar: 'جنب الجامعة' },
  '90th': { en: '90th Street', ar: 'شارع التسعين' },
  concord: { en: 'Concord Plaza', ar: 'كونكورد بلازا' },
  'the-spot': { en: 'The Spot Mall', ar: 'ذا سبوت' },
  'point-90': { en: 'Point 90', ar: 'بوينت ٩٠' },
  'silver-star': { en: 'Silver Star Mall', ar: 'سيلفر ستار' },
  waterway: { en: 'The Waterway', ar: 'الووتر واي' },
  further: { en: 'Further out', ar: 'أبعد شوية' },
};

/** Campus first, then roughly outward along 90th Street. */
export const AREA_ORDER: readonly AreaId[] = [
  'fue',
  'dreams',
  'around',
  '90th',
  'concord',
  'the-spot',
  'silver-star',
  'point-90',
  'waterway',
  'further',
];

export const CRAVINGS: Record<CravingId, { en: string; ar: string }> = {
  coffee: { en: 'Coffee', ar: 'قهوة' },
  bakery: { en: 'Bakery', ar: 'مخبوزات' },
  sweets: { en: 'Sweets', ar: 'حلويات' },
  burgers: { en: 'Burgers', ar: 'برجر' },
  chicken: { en: 'Fried chicken', ar: 'فراخ' },
  pizza: { en: 'Pizza', ar: 'بيتزا' },
  italian: { en: 'Pasta', ar: 'باستا' },
  sandwiches: { en: 'Sandwiches', ar: 'سندوتشات' },
  egyptian: { en: 'Egyptian food', ar: 'أكل مصري' },
  asian: { en: 'Sushi & Asian', ar: 'سوشي' },
  grill: { en: 'Grill', ar: 'مشويات' },
  dining: { en: 'Restaurant', ar: 'مطعم' },
};

export const SPOTS: readonly Spot[] = [
  { id: 'fue-cilantro', name: 'Cilantro - FUE Campus', brand: 'Cilantro', vicinity: 'FUE Food Court, End of 90th St', area: 'fue', craving: 'coffee', category: 'Cafe', lat: 30.0260, lng: 31.4911 },
  { id: 'fue-pasta2go', name: 'Pasta 2Go', brand: 'Pasta 2Go', vicinity: 'FUE Food Court, New Cairo', area: 'fue', craving: 'italian', category: 'Fast Food', lat: 30.0262, lng: 31.4913 },
  { id: 'fue-gad', name: 'GAD - Dreams Mall 2', brand: 'GAD', vicinity: 'Dreams Mall 2, Next to FUE', area: 'dreams', craving: 'egyptian', category: 'Restaurant', lat: 30.0255, lng: 31.4905 },
  { id: 'fue-seven-days', name: 'Seven Days Cafe', brand: 'Seven Days', vicinity: 'FUE Campus, New Cairo', area: 'fue', craving: 'coffee', category: 'Cafe', lat: 30.0261, lng: 31.4908 },
  { id: 'fue-point90-starbucks', name: 'Starbucks - Point 90', brand: 'Starbucks', vicinity: 'Point 90 Mall, New Cairo', area: 'point-90', craving: 'coffee', category: 'Cafe', lat: 30.0175, lng: 31.4998 },
  { id: 'fue-crave', name: 'Crave - Point 90', brand: 'Crave', vicinity: 'Point 90 Mall, New Cairo', area: 'point-90', craving: 'dining', category: 'Restaurant', lat: 30.0178, lng: 31.5002 },
  { id: 'fue-tbs', name: 'TBS (The Bakery Shop)', brand: 'TBS', vicinity: 'Point 90 Mall, New Cairo', area: 'point-90', craving: 'bakery', category: 'Cafe', lat: 30.0173, lng: 31.4995 },
  { id: 'fue-mcdonalds', name: "McDonald's - Point 90", brand: "McDonald's", vicinity: 'Point 90 Mall, New Cairo', area: 'point-90', craving: 'burgers', category: 'Fast Food', lat: 30.0170, lng: 31.5000 },
  { id: 'fue-cinnabon', name: 'Cinnabon - Point 90', brand: 'Cinnabon', vicinity: 'Point 90 Mall, New Cairo', area: 'point-90', craving: 'sweets', category: 'Cafe', lat: 30.0172, lng: 31.4991 },
  { id: 'fue-caribou', name: 'Caribou Coffee', brand: 'Caribou', vicinity: 'The Spot Mall, Near FUE', area: 'the-spot', craving: 'coffee', category: 'Cafe', lat: 30.0220, lng: 31.4970 },
  { id: 'fue-bufalo-burger', name: 'Buffalo Burger', brand: 'Buffalo Burger', vicinity: 'The Spot Mall, New Cairo', area: 'the-spot', craving: 'burgers', category: 'Fast Food', lat: 30.0222, lng: 31.4975 },
  { id: 'fue-costa', name: 'Costa Coffee - Concord Plaza', brand: 'Costa', vicinity: 'Concord Plaza, 90th Street', area: 'concord', craving: 'coffee', category: 'Cafe', lat: 30.0240, lng: 31.4880 },
  { id: 'fue-second-cup', name: 'Second Cup', brand: 'Second Cup', vicinity: 'Concord Plaza, 90th Street', area: 'concord', craving: 'coffee', category: 'Cafe', lat: 30.0242, lng: 31.4885 },
  { id: 'fue-dunkin', name: "Dunkin' - Dreams Mall", brand: "Dunkin'", vicinity: 'Dreams Mall, Next to FUE', area: 'dreams', craving: 'sweets', category: 'Cafe', lat: 30.0257, lng: 31.4902 },
  { id: 'fue-bazooka', name: 'Bazooka Fried Chicken', brand: 'Bazooka', vicinity: '90th Street East, New Cairo', area: '90th', craving: 'chicken', category: 'Fast Food', lat: 30.0280, lng: 31.4930 },
  { id: 'fue-kfc-p90', name: 'KFC - Point 90', brand: 'KFC', vicinity: 'Point 90 Mall, New Cairo', area: 'point-90', craving: 'chicken', category: 'Fast Food', lat: 30.0171, lng: 31.5001 },
  { id: 'fue-pizza-hut', name: 'Pizza Hut - Point 90', brand: 'Pizza Hut', vicinity: 'Point 90 Mall, New Cairo', area: 'point-90', craving: 'pizza', category: 'Fast Food', lat: 30.0174, lng: 31.5003 },
  { id: 'fue-hardees', name: "Hardee's - Point 90", brand: "Hardee's", vicinity: 'Point 90 Mall, New Cairo', area: 'point-90', craving: 'burgers', category: 'Fast Food', lat: 30.0176, lng: 31.4999 },
  { id: 'fue-paul', name: 'Paul Bakery & Restaurant', brand: 'Paul', vicinity: 'Point 90 Mall, New Cairo', area: 'point-90', craving: 'bakery', category: 'Restaurant', lat: 30.0180, lng: 31.5005 },
  { id: 'fue-casper', name: "Casper & Gambini's", brand: "Casper & Gambini's", vicinity: 'Point 90 Mall, New Cairo', area: 'point-90', craving: 'dining', category: 'Restaurant', lat: 30.0181, lng: 31.5008 },
  { id: 'fue-espresso-lab', name: 'Espresso Lab', brand: 'Espresso Lab', vicinity: 'Point 90 Mall, New Cairo', area: 'point-90', craving: 'coffee', category: 'Cafe', lat: 30.0177, lng: 31.4993 },
  { id: 'fue-beanos', name: "Beano's Cafe", brand: "Beano's", vicinity: 'Concord Plaza, 90th Street', area: 'concord', craving: 'coffee', category: 'Cafe', lat: 30.0245, lng: 31.4882 },
  { id: 'fue-maine', name: 'Maine Burgers', brand: 'Maine', vicinity: 'The Spot Mall, New Cairo', area: 'the-spot', craving: 'burgers', category: 'Fast Food', lat: 30.0225, lng: 31.4972 },
  { id: 'fue-papa-johns', name: "Papa John's Pizza", brand: "Papa John's", vicinity: 'Concord Plaza, New Cairo', area: 'concord', craving: 'pizza', category: 'Fast Food', lat: 30.0241, lng: 31.4889 },
  { id: 'fue-heart-attack', name: 'Heart Attack Chicken', brand: 'Heart Attack', vicinity: '90th Street East, New Cairo', area: '90th', craving: 'chicken', category: 'Fast Food', lat: 30.0283, lng: 31.4932 },
  { id: 'fue-tbs-waterway', name: 'TBS - The Waterway', brand: 'TBS', vicinity: 'The Waterway, New Cairo', area: 'waterway', craving: 'bakery', category: 'Cafe', lat: 30.0310, lng: 31.4780 },
  { id: 'fue-starbucks-waterway', name: 'Starbucks - The Waterway', brand: 'Starbucks', vicinity: 'The Waterway, New Cairo', area: 'waterway', craving: 'coffee', category: 'Cafe', lat: 30.0312, lng: 31.4785 },
  { id: 'fue-mince', name: 'Mince Burger', brand: 'Mince', vicinity: 'The Waterway, New Cairo', area: 'waterway', craving: 'burgers', category: 'Fast Food', lat: 30.0315, lng: 31.4788 },
  { id: 'fue-mori-sushi', name: 'Mori Sushi', brand: 'Mori Sushi', vicinity: 'The Waterway, New Cairo', area: 'waterway', craving: 'asian', category: 'Restaurant', lat: 30.0318, lng: 31.4791 },
  { id: 'fue-willows', name: "Willow's", brand: "Willow's", vicinity: 'The Waterway, New Cairo', area: 'waterway', craving: 'dining', category: 'Restaurant', lat: 30.0320, lng: 31.4793 },
  { id: 'fue-dipndip', name: 'dipndip', brand: 'dipndip', vicinity: 'Point 90 Mall, New Cairo', area: 'point-90', craving: 'sweets', category: 'Cafe', lat: 30.0179, lng: 31.4996 },
  { id: 'fue-kansas', name: 'Kansas Fried Chicken', brand: 'Kansas', vicinity: '90th Street, New Cairo', area: '90th', craving: 'chicken', category: 'Fast Food', lat: 30.0275, lng: 31.4918 },
  { id: 'fue-willys', name: "Willy's Kitchen", brand: "Willy's Kitchen", vicinity: 'Concord Plaza, New Cairo', area: 'concord', craving: 'sandwiches', category: 'Fast Food', lat: 30.0248, lng: 31.4886 },
  { id: 'fue-shaghaf', name: 'Shaghaf Co-working Cafe', brand: 'Shaghaf', vicinity: 'Near FUE Campus, New Cairo', area: 'around', craving: 'coffee', category: 'Cafe', lat: 30.0258, lng: 31.4901 },
  { id: 'fue-mocha', name: 'Mocha Cafe', brand: 'Mocha Cafe', vicinity: 'Concord Plaza, New Cairo', area: 'concord', craving: 'coffee', category: 'Cafe', lat: 30.0244, lng: 31.4881 },
  { id: 'fue-spectra', name: 'Spectra Restaurant', brand: 'Spectra', vicinity: 'Concord Plaza, New Cairo', area: 'concord', craving: 'dining', category: 'Restaurant', lat: 30.0246, lng: 31.4884 },
  { id: 'fue-chickndip', name: "Chick 'N Dip", brand: "Chick 'N Dip", vicinity: 'The Spot Mall, New Cairo', area: 'the-spot', craving: 'chicken', category: 'Fast Food', lat: 30.0223, lng: 31.4971 },
  { id: 'fue-butchers', name: "Butcher's Burger", brand: "Butcher's", vicinity: 'Concord Plaza, New Cairo', area: 'concord', craving: 'burgers', category: 'Fast Food', lat: 30.0243, lng: 31.4887 },
  { id: 'fue-cortigiano', name: 'Cortigiano Restaurant', brand: 'Cortigiano', vicinity: 'Concord Plaza, New Cairo', area: 'concord', craving: 'italian', category: 'Restaurant', lat: 30.0247, lng: 31.4883 },
  { id: 'fue-tap-east', name: 'The Tap East', brand: 'The Tap East', vicinity: 'Stella Di Mare, New Cairo', area: 'further', craving: 'grill', category: 'Restaurant', lat: 30.0290, lng: 31.4820 },
  { id: 'fue-one-oak', name: 'One Oak - Steak & Sushi', brand: 'One Oak', vicinity: 'Point 90 Mall, New Cairo', area: 'point-90', craving: 'asian', category: 'Restaurant', lat: 30.0182, lng: 31.5001 },
  { id: 'fue-tbs-express', name: 'TBS Express', brand: 'TBS Express', vicinity: 'Dreams Mall, Next to FUE', area: 'dreams', craving: 'bakery', category: 'Cafe', lat: 30.0256, lng: 31.4904 },
  { id: 'fue-container', name: 'Container Cafe', brand: 'Container Cafe', vicinity: 'Near FUE, New Cairo', area: 'around', craving: 'coffee', category: 'Cafe', lat: 30.0265, lng: 31.4920 },
  { id: 'fue-qahwa', name: 'Qahwa Cafe', brand: 'Qahwa Cafe', vicinity: 'The Waterway, New Cairo', area: 'waterway', craving: 'coffee', category: 'Cafe', lat: 30.0314, lng: 31.4782 },
  { id: 'fue-teds', name: "Ted's Restaurant", brand: "Ted's", vicinity: 'Point 90 Mall, New Cairo', area: 'point-90', craving: 'dining', category: 'Restaurant', lat: 30.0183, lng: 31.5004 },
  { id: 'fue-burger-king', name: 'Burger King', brand: 'Burger King', vicinity: 'Point 90 Mall, New Cairo', area: 'point-90', craving: 'burgers', category: 'Fast Food', lat: 30.0171, lng: 31.4997 },
  { id: 'fue-tabio', name: 'TABiO Tea & Coffee', brand: 'TABiO', vicinity: 'Near FUE, New Cairo', area: 'around', craving: 'coffee', category: 'Cafe', lat: 30.0263, lng: 31.4915 },
  { id: 'fue-ashley', name: 'Ashley Cafe', brand: 'Ashley Cafe', vicinity: 'Concord Plaza, New Cairo', area: 'concord', craving: 'coffee', category: 'Cafe', lat: 30.0249, lng: 31.4888 },
  { id: 'fue-texas', name: 'Texas Chicken', brand: 'Texas Chicken', vicinity: 'Point 90 Mall, New Cairo', area: 'point-90', craving: 'chicken', category: 'Fast Food', lat: 30.0172, lng: 31.5002 },
  { id: 'fue-cinnabon-concord', name: 'Cinnabon - Concord Plaza', brand: 'Cinnabon', vicinity: 'Concord Plaza, 90th Street', area: 'concord', craving: 'sweets', category: 'Cafe', lat: 30.0241, lng: 31.4882 },
  { id: 'fue-dunkin-concord', name: "Dunkin' - Concord Plaza", brand: "Dunkin'", vicinity: 'Concord Plaza, New Cairo', area: 'concord', craving: 'sweets', category: 'Cafe', lat: 30.0243, lng: 31.4881 },
  { id: 'fue-tbs-concord', name: 'TBS - Concord Plaza', brand: 'TBS', vicinity: 'Concord Plaza, New Cairo', area: 'concord', craving: 'bakery', category: 'Cafe', lat: 30.0242, lng: 31.4884 },
  { id: 'fue-starbucks-concord', name: 'Starbucks - Concord Plaza', brand: 'Starbucks', vicinity: 'Concord Plaza, New Cairo', area: 'concord', craving: 'coffee', category: 'Cafe', lat: 30.0240, lng: 31.4886 },
  { id: 'fue-caribou-waterway', name: 'Caribou Coffee - Waterway', brand: 'Caribou', vicinity: 'The Waterway, New Cairo', area: 'waterway', craving: 'coffee', category: 'Cafe', lat: 30.0311, lng: 31.4784 },
  { id: 'fue-krispy-p90', name: 'Krispy Kreme - Point 90', brand: 'Krispy Kreme', vicinity: 'Point 90 Mall, New Cairo', area: 'point-90', craving: 'sweets', category: 'Cafe', lat: 30.0174, lng: 31.4994 },
  { id: 'fue-baskin-p90', name: 'Baskin Robbins - Point 90', brand: 'Baskin Robbins', vicinity: 'Point 90 Mall, New Cairo', area: 'point-90', craving: 'sweets', category: 'Cafe', lat: 30.0176, lng: 31.4992 },
  { id: 'fue-greco-waterway', name: 'Caffe Greco - Waterway', brand: 'Caffe Greco', vicinity: 'The Waterway, New Cairo', area: 'waterway', craving: 'coffee', category: 'Cafe', lat: 30.0313, lng: 31.4786 },
  { id: 'fue-eatery', name: 'The Eatery', brand: 'The Eatery', vicinity: 'Festival City Mall Area', area: 'further', craving: 'dining', category: 'Restaurant', lat: 30.0285, lng: 31.4810 },
  { id: 'fue-fuddruckers', name: 'Fuddruckers - Point 90', brand: 'Fuddruckers', vicinity: 'Point 90 Mall, New Cairo', area: 'point-90', craving: 'burgers', category: 'Restaurant', lat: 30.0184, lng: 31.5002 },
  { id: 'fue-chilis', name: "Chili's - Point 90", brand: "Chili's", vicinity: 'Point 90 Mall, New Cairo', area: 'point-90', craving: 'dining', category: 'Restaurant', lat: 30.0185, lng: 31.5006 },
  { id: 'fue-studio-misr', name: 'Studio Misr', brand: 'Studio Misr', vicinity: 'Point 90 Mall, New Cairo', area: 'point-90', craving: 'egyptian', category: 'Restaurant', lat: 30.0186, lng: 31.5007 },
  { id: 'fue-abo-elsid', name: 'Abo El Sid', brand: 'Abo El Sid', vicinity: 'Point 90 Mall, New Cairo', area: 'point-90', craving: 'egyptian', category: 'Restaurant', lat: 30.0187, lng: 31.5009 },
  { id: 'fue-tamara', name: 'Tamara Lebanese Bistro', brand: 'Tamara', vicinity: 'Point 90 Mall, New Cairo', area: 'point-90', craving: 'grill', category: 'Restaurant', lat: 30.0188, lng: 31.5010 },
  { id: 'fue-ovio', name: 'Ovio - Waterway', brand: 'Ovio', vicinity: 'The Waterway, New Cairo', area: 'waterway', craving: 'dining', category: 'Restaurant', lat: 30.0316, lng: 31.4789 },
  { id: 'fue-tableette', name: 'Tableette Cafe', brand: 'Tableette Cafe', vicinity: 'The Waterway, New Cairo', area: 'waterway', craving: 'coffee', category: 'Cafe', lat: 30.0317, lng: 31.4787 },
  { id: 'fue-lyra', name: 'Lyra Cafe', brand: 'Lyra Cafe', vicinity: 'The Waterway, New Cairo', area: 'waterway', craving: 'coffee', category: 'Cafe', lat: 30.0319, lng: 31.4785 },
  { id: 'fue-smokery', name: 'The Smokery', brand: 'The Smokery', vicinity: 'The Waterway, New Cairo', area: 'waterway', craving: 'grill', category: 'Restaurant', lat: 30.0321, lng: 31.4794 },
  { id: 'fue-zooba', name: 'Zooba - Waterway', brand: 'Zooba', vicinity: 'The Waterway, New Cairo', area: 'waterway', craving: 'egyptian', category: 'Fast Food', lat: 30.0322, lng: 31.4795 },
  { id: 'fue-kazoku', name: 'Kazoku Japanese Grill', brand: 'Kazoku', vicinity: 'Swanlake, New Cairo', area: 'further', craving: 'asian', category: 'Restaurant', lat: 30.0340, lng: 31.4750 },
  { id: 'fue-gigi', name: 'Gigi Burger Bar', brand: 'Gigi', vicinity: 'The Spot Mall, New Cairo', area: 'the-spot', craving: 'burgers', category: 'Fast Food', lat: 30.0224, lng: 31.4974 },
  { id: 'fue-zakuski', name: 'Zakuski Cafe', brand: 'Zakuski Cafe', vicinity: 'Concord Plaza, New Cairo', area: 'concord', craving: 'coffee', category: 'Cafe', lat: 30.0247, lng: 31.4889 },
  { id: 'fue-beanos-waterway', name: "Beano's - Waterway", brand: "Beano's", vicinity: 'The Waterway, New Cairo', area: 'waterway', craving: 'coffee', category: 'Cafe', lat: 30.0315, lng: 31.4781 },
  { id: 'fue-costa-p90', name: 'Costa Coffee - Point 90', brand: 'Costa', vicinity: 'Point 90 Mall, New Cairo', area: 'point-90', craving: 'coffee', category: 'Cafe', lat: 30.0176, lng: 31.4997 },
  { id: 'fue-cinnabon-spot', name: 'Cinnabon - The Spot Mall', brand: 'Cinnabon', vicinity: 'The Spot Mall, New Cairo', area: 'the-spot', craving: 'sweets', category: 'Cafe', lat: 30.0221, lng: 31.4972 },
  { id: 'fue-dunkin-spot', name: "Dunkin' - The Spot Mall", brand: "Dunkin'", vicinity: 'The Spot Mall, New Cairo', area: 'the-spot', craving: 'sweets', category: 'Cafe', lat: 30.0223, lng: 31.4973 },
  { id: 'fue-starbucks-spot', name: 'Starbucks - The Spot Mall', brand: 'Starbucks', vicinity: 'The Spot Mall, New Cairo', area: 'the-spot', craving: 'coffee', category: 'Cafe', lat: 30.0226, lng: 31.4976 },
  { id: 'fue-cinnabon-waterway', name: 'Cinnabon - The Waterway', brand: 'Cinnabon', vicinity: 'The Waterway, New Cairo', area: 'waterway', craving: 'sweets', category: 'Cafe', lat: 30.0312, lng: 31.4783 },
  { id: 'fue-krispy-concord', name: 'Krispy Kreme - Concord Plaza', brand: 'Krispy Kreme', vicinity: 'Concord Plaza, New Cairo', area: 'concord', craving: 'sweets', category: 'Cafe', lat: 30.0241, lng: 31.4883 },
  { id: 'fue-cilantro-concord', name: 'Cilantro - Concord Plaza', brand: 'Cilantro', vicinity: 'Concord Plaza, New Cairo', area: 'concord', craving: 'coffee', category: 'Cafe', lat: 30.0245, lng: 31.4885 },
  { id: 'fue-prezzo', name: 'Prezzo Pizza & Pasta', brand: 'Prezzo', vicinity: 'Point 90 Mall, New Cairo', area: 'point-90', craving: 'italian', category: 'Restaurant', lat: 30.0181, lng: 31.4999 },
  { id: 'fue-lord-wings', name: 'Lord of the Wings', brand: 'Lord of the Wings', vicinity: 'Point 90 Mall, New Cairo', area: 'point-90', craving: 'chicken', category: 'Fast Food', lat: 30.0183, lng: 31.5001 },
  { id: 'fue-max-burger', name: 'Max Burger', brand: 'Max Burger', vicinity: '90th Street East, New Cairo', area: '90th', craving: 'burgers', category: 'Fast Food', lat: 30.0278, lng: 31.4922 },
  { id: 'fue-smash-burger', name: 'Smash Burger', brand: 'Smash Burger', vicinity: 'Concord Plaza, New Cairo', area: 'concord', craving: 'burgers', category: 'Fast Food', lat: 30.0246, lng: 31.4886 },
  { id: 'fue-bunster', name: 'Bunster Burger', brand: 'Bunster', vicinity: 'The Spot Mall, New Cairo', area: 'the-spot', craving: 'burgers', category: 'Fast Food', lat: 30.0227, lng: 31.4978 },
  { id: 'fue-arbys', name: "Arby's", brand: "Arby's", vicinity: 'Point 90 Mall, New Cairo', area: 'point-90', craving: 'sandwiches', category: 'Fast Food', lat: 30.0173, lng: 31.5001 },
  { id: 'fue-pizza-king', name: 'Pizza King', brand: 'Pizza King', vicinity: 'Dreams Mall, Next to FUE', area: 'dreams', craving: 'pizza', category: 'Fast Food', lat: 30.0259, lng: 31.4906 },
  { id: 'fue-dominos', name: "Domino's Pizza", brand: "Domino's", vicinity: '90th Street, New Cairo', area: '90th', craving: 'pizza', category: 'Fast Food', lat: 30.0270, lng: 31.4910 },
  { id: 'fue-pascucci', name: 'Caffe Pascucci', brand: 'Caffe Pascucci', vicinity: 'Concord Plaza, New Cairo', area: 'concord', craving: 'coffee', category: 'Cafe', lat: 30.0248, lng: 31.4884 },
  { id: 'fue-beanos-p90', name: "Beano's - Point 90", brand: "Beano's", vicinity: 'Point 90 Mall, New Cairo', area: 'point-90', craving: 'coffee', category: 'Cafe', lat: 30.0178, lng: 31.4994 },
  { id: 'fue-brioche', name: 'Brioche Doree', brand: 'Brioche Doree', vicinity: 'Point 90 Mall, New Cairo', area: 'point-90', craving: 'bakery', category: 'Cafe', lat: 30.0179, lng: 31.4995 },
  { id: 'fue-costa-waterway', name: 'Costa Coffee - Waterway', brand: 'Costa', vicinity: 'The Waterway, New Cairo', area: 'waterway', craving: 'coffee', category: 'Cafe', lat: 30.0314, lng: 31.4787 },
  { id: 'fue-dunkin-waterway', name: "Dunkin' - Waterway", brand: "Dunkin'", vicinity: 'The Waterway, New Cairo', area: 'waterway', craving: 'sweets', category: 'Cafe', lat: 30.0315, lng: 31.4788 },
  { id: 'fue-tbs-silverstar', name: 'TBS - Silver Star Mall', brand: 'TBS', vicinity: 'Silver Star Mall, New Cairo', area: 'silver-star', craving: 'bakery', category: 'Cafe', lat: 30.0210, lng: 31.4850 },
  { id: 'fue-cilantro-silverstar', name: 'Cilantro - Silver Star Mall', brand: 'Cilantro', vicinity: 'Silver Star Mall, New Cairo', area: 'silver-star', craving: 'coffee', category: 'Cafe', lat: 30.0212, lng: 31.4852 },
  { id: 'fue-starbucks-silverstar', name: 'Starbucks - Silver Star Mall', brand: 'Starbucks', vicinity: 'Silver Star Mall, New Cairo', area: 'silver-star', craving: 'coffee', category: 'Cafe', lat: 30.0214, lng: 31.4854 },
  { id: 'fue-costa-silverstar', name: 'Costa Coffee - Silver Star', brand: 'Costa', vicinity: 'Silver Star Mall, New Cairo', area: 'silver-star', craving: 'coffee', category: 'Cafe', lat: 30.0215, lng: 31.4855 },
  { id: 'fue-gad-concord', name: 'GAD - Concord Plaza', brand: 'GAD', vicinity: 'Concord Plaza, New Cairo', area: 'concord', craving: 'egyptian', category: 'Restaurant', lat: 30.0249, lng: 31.4889 },
  { id: 'fue-cookdoor', name: 'Cook Door', brand: 'Cook Door', vicinity: 'Dreams Mall, Next to FUE', area: 'dreams', craving: 'sandwiches', category: 'Fast Food', lat: 30.0254, lng: 31.4907 },
  { id: 'fue-momen', name: "Mo'men Fast Food", brand: "Mo'men", vicinity: 'Dreams Mall, Next to FUE', area: 'dreams', craving: 'sandwiches', category: 'Fast Food', lat: 30.0253, lng: 31.4908 },
  { id: 'fue-koshary-tahrir', name: 'Koshary El Tahrir', brand: 'Koshary El Tahrir', vicinity: 'Dreams Mall, Next to FUE', area: 'dreams', craving: 'egyptian', category: 'Restaurant', lat: 30.0252, lng: 31.4909 },
];

const BY_ID = new Map(SPOTS.map((spot) => [spot.id, spot]));

const BRANCHES = new Map<string, number>();
for (const spot of SPOTS) BRANCHES.set(spot.brand, (BRANCHES.get(spot.brand) ?? 0) + 1);

/** The area, for a brand with more than one branch on the list (four Cinnabons); otherwise null. */
export function branchOf(spot: Spot): string | null {
  return (BRANCHES.get(spot.brand) ?? 0) > 1 ? AREAS[spot.area].en : null;
}

export function getSpot(id: string): Spot | undefined {
  return BY_ID.get(id);
}

export function isSpotId(id: unknown): id is string {
  return typeof id === 'string' && BY_ID.has(id);
}

/** Google Maps search link; searching by name beats our approximate coordinates. */
export function mapsUrl(spot: Spot): string {
  const query = `${spot.name}, ${AREAS[spot.area].en}, New Cairo`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
