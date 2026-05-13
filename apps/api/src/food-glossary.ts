// =============================================================================
// Curated EN ⇄ ZH grocery terms (whole-string match, case-insensitive for EN).
// Machine translation is weak on very short / ambiguous English food words.
// =============================================================================

export interface GlossaryPair {
  /** Canonical English for storage / display title-case upstream */
  en: string;
  /** Simplified Chinese */
  zh: string;
}

/** English key → pair (key is lowercased ASCII). */
const BY_EN: Record<string, GlossaryPair> = {
  ham: { en: "Ham", zh: "火腿" },
  bacon: { en: "Bacon", zh: "培根" },
  sausage: { en: "Sausage", zh: "香肠" },
  chicken: { en: "Chicken", zh: "鸡肉" },
  beef: { en: "Beef", zh: "牛肉" },
  pork: { en: "Pork", zh: "猪肉" },
  turkey: { en: "Turkey", zh: "火鸡肉" },
  fish: { en: "Fish", zh: "鱼" },
  salmon: { en: "Salmon", zh: "三文鱼" },
  shrimp: { en: "Shrimp", zh: "虾" },
  egg: { en: "Egg", zh: "鸡蛋" },
  eggs: { en: "Eggs", zh: "鸡蛋" },
  milk: { en: "Milk", zh: "牛奶" },
  butter: { en: "Butter", zh: "黄油" },
  cheese: { en: "Cheese", zh: "奶酪" },
  yogurt: { en: "Yogurt", zh: "酸奶" },
  cream: { en: "Cream", zh: "奶油" },
  bread: { en: "Bread", zh: "面包" },
  rice: { en: "Rice", zh: "大米" },
  pasta: { en: "Pasta", zh: "意大利面" },
  noodles: { en: "Noodles", zh: "面条" },
  flour: { en: "Flour", zh: "面粉" },
  sugar: { en: "Sugar", zh: "糖" },
  salt: { en: "Salt", zh: "盐" },
  oil: { en: "Oil", zh: "油" },
  "olive oil": { en: "Olive oil", zh: "橄榄油" },
  onion: { en: "Onion", zh: "洋葱" },
  garlic: { en: "Garlic", zh: "大蒜" },
  potato: { en: "Potato", zh: "土豆" },
  potatoes: { en: "Potatoes", zh: "土豆" },
  tomato: { en: "Tomato", zh: "番茄" },
  tomatoes: { en: "Tomatoes", zh: "番茄" },
  carrot: { en: "Carrot", zh: "胡萝卜" },
  carrots: { en: "Carrots", zh: "胡萝卜" },
  broccoli: { en: "Broccoli", zh: "西兰花" },
  spinach: { en: "Spinach", zh: "菠菜" },
  lettuce: { en: "Lettuce", zh: "生菜" },
  cabbage: { en: "Cabbage", zh: "卷心菜" },
  mushroom: { en: "Mushroom", zh: "蘑菇" },
  mushrooms: { en: "Mushrooms", zh: "蘑菇" },
  apple: { en: "Apple", zh: "苹果" },
  apples: { en: "Apples", zh: "苹果" },
  banana: { en: "Banana", zh: "香蕉" },
  bananas: { en: "Bananas", zh: "香蕉" },
  orange: { en: "Orange", zh: "橙子" },
  oranges: { en: "Oranges", zh: "橙子" },
  lemon: { en: "Lemon", zh: "柠檬" },
  lime: { en: "Lime", zh: "青柠" },
  grape: { en: "Grape", zh: "葡萄" },
  grapes: { en: "Grapes", zh: "葡萄" },
  strawberry: { en: "Strawberry", zh: "草莓" },
  strawberries: { en: "Strawberries", zh: "草莓" },
  watermelon: { en: "Watermelon", zh: "西瓜" },
  tofu: { en: "Tofu", zh: "豆腐" },
  beans: { en: "Beans", zh: "豆子" },
  "green beans": { en: "Green beans", zh: "四季豆" },
  corn: { en: "Corn", zh: "玉米" },
  peas: { en: "Peas", zh: "豌豆" },
  cucumber: { en: "Cucumber", zh: "黄瓜" },
  pepper: { en: "Pepper", zh: "甜椒" },
  "bell pepper": { en: "Bell pepper", zh: "甜椒" },
  chili: { en: "Chili", zh: "辣椒" },
  ginger: { en: "Ginger", zh: "姜" },
  cilantro: { en: "Cilantro", zh: "香菜" },
  basil: { en: "Basil", zh: "罗勒" },
  honey: { en: "Honey", zh: "蜂蜜" },
  jam: { en: "Jam", zh: "果酱" },
  peanuts: { en: "Peanuts", zh: "花生" },
  "peanut butter": { en: "Peanut butter", zh: "花生酱" },
  water: { en: "Water", zh: "水" },
  juice: { en: "Juice", zh: "果汁" },
  coffee: { en: "Coffee", zh: "咖啡" },
  tea: { en: "Tea", zh: "茶" },
};

const BY_ZH = new Map<string, GlossaryPair>();
for (const pair of Object.values(BY_EN)) {
  BY_ZH.set(pair.zh, pair);
}

/** Exact match for Latin input (after trim + lower case whole string). */
export function glossaryMatchEnglish(raw: string): GlossaryPair | null {
  const key = raw.trim().toLowerCase();
  if (!key) return null;
  return BY_EN[key] ?? null;
}

/** Exact match when user typed simplified Chinese for a known term. */
export function glossaryMatchChinese(raw: string): GlossaryPair | null {
  const key = raw.trim();
  if (!key) return null;
  return BY_ZH.get(key) ?? null;
}
