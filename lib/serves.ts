// Serve exchange system
// 1 protein serve = 30g protein  (half serve threshold: 15g)
// 1 carb serve    = 20g carbs    (half serve threshold: 10g)
// 1 fat serve     = 10g fat      (half serve threshold: 5g)
// 1 fruit serve   = 20g carbs    (same as carb — category determines bucket)

export type Serves = {
  protein: number
  carb: number
  fruit: number
  fat: number
}

export type ServeTargets = {
  protein_serves: number
  carb_serves: number
  fat_serves: number
  fruit_serves: number
  veg_unlimited: boolean
  notes: string | null
}

function toHalfServes(grams: number, perServe: number, halfThreshold: number): number {
  if (grams < halfThreshold) return 0
  const full = Math.floor(grams / perServe)
  const remainder = grams % perServe
  return full + (remainder >= halfThreshold ? 0.5 : 0)
}

export function calcServes(
  protein_g: number,
  carbs_g: number,
  fat_g: number,
  category?: string | null
): Serves {
  const isFruit = category === 'fruit'
  const carbVal = toHalfServes(carbs_g, 20, 10)
  return {
    protein: toHalfServes(protein_g, 30, 15),
    carb: isFruit ? 0 : carbVal,
    fruit: isFruit ? carbVal : 0,
    fat: toHalfServes(fat_g, 10, 5),
  }
}

export function sumServes(
  logs: Array<{ protein: number; carbs: number; fat: number; serve_category?: string | null }>
): Serves {
  return logs.reduce(
    (acc, l) => {
      const s = calcServes(l.protein, l.carbs, l.fat, l.serve_category)
      return {
        protein: acc.protein + s.protein,
        carb: acc.carb + s.carb,
        fruit: acc.fruit + s.fruit,
        fat: acc.fat + s.fat,
      }
    },
    { protein: 0, carb: 0, fruit: 0, fat: 0 }
  )
}

export function fmt(n: number): string {
  return n % 1 === 0 ? String(n) : n.toFixed(1)
}

// Keyword-based fruit detection fallback when no coach tag exists
const FRUIT_KEYWORDS = [
  'apple', 'banana', 'orange', 'mango', 'pear', 'peach', 'plum', 'cherry',
  'apricot', 'kiwi', 'grape', 'watermelon', 'melon', 'rockmelon', 'honeydew',
  'pineapple', 'strawberry', 'raspberry', 'blueberry', 'blackberry', 'berry',
  'mandarin', 'tangerine', 'lemon', 'lime', 'grapefruit', 'fig', 'date',
  'passionfruit', 'guava', 'papaya', 'lychee', 'pomegranate', 'nectarine',
]

export function isFruitByName(name: string): boolean {
  const lower = name.toLowerCase()
  return FRUIT_KEYWORDS.some((k) => lower.includes(k))
}
