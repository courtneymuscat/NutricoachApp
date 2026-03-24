'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

// ── Types ──────────────────────────────────────────────────────────────────
type PhaseName = 'Menstrual' | 'Follicular' | 'Ovulation' | 'Luteal'

type Phase = {
  name: PhaseName
  day: number
  tagline: string
  description: string
  gradient: string
  text: string
  muted: string
  segment: string
}

// ── Nutrition config ───────────────────────────────────────────────────────
type NutritionGuide = {
  appetite: string
  focus: string[]
  nutrients: { label: string; note: string }[]
  foods: string[]
  tip: string
  accentBg: string
  accentText: string
  tagBg: string
}

const NUTRITION: Record<PhaseName, NutritionGuide> = {
  Menstrual: {
    appetite: 'Appetite often lower — honour it',
    focus: ['Iron replenishment', 'Anti-inflammatory foods', 'Hydration'],
    nutrients: [
      { label: 'Iron', note: 'Lost through bleeding — prioritise daily' },
      { label: 'Vitamin C', note: 'Enhances iron absorption — pair with iron sources' },
      { label: 'Magnesium', note: 'Reduces cramps and supports sleep' },
      { label: 'Omega-3', note: 'Lowers prostaglandins and reduces cramping' },
    ],
    foods: ['Red meat or lentils', 'Leafy greens', 'Salmon', 'Dark chocolate', 'Warm soups'],
    tip: 'Eat warm, cooked foods. Avoid excess caffeine and alcohol — both worsen cramps and iron absorption.',
    accentBg: 'bg-rose-50', accentText: 'text-rose-700', tagBg: 'bg-rose-100',
  },
  Follicular: {
    appetite: 'Appetite moderate — great insulin sensitivity',
    focus: ['Balanced macros', 'Lean protein for muscle', 'Light carbs'],
    nutrients: [
      { label: 'Protein', note: 'Supports muscle repair and rising oestrogen metabolism' },
      { label: 'B vitamins', note: 'Fuel energy production as oestrogen climbs' },
      { label: 'Zinc', note: 'Supports follicle development' },
      { label: 'Probiotics', note: 'Gut health influences oestrogen clearance' },
    ],
    foods: ['Eggs', 'Fermented foods', 'Spring vegetables', 'Quinoa', 'Berries'],
    tip: 'Best phase for intermittent fasting if that suits you — insulin sensitivity is at its highest.',
    accentBg: 'bg-amber-50', accentText: 'text-amber-700', tagBg: 'bg-amber-100',
  },
  Ovulation: {
    appetite: 'Appetite steady — peak performance window',
    focus: ['Higher carbohydrates', 'Antioxidant-rich foods', 'Anti-inflammatory support'],
    nutrients: [
      { label: 'Complex carbs', note: 'Fuel high-intensity output — your body can handle them well' },
      { label: 'Antioxidants', note: 'Protect the follicle and support egg quality' },
      { label: 'Fibre', note: 'Supports oestrogen clearance via the gut' },
      { label: 'Zinc', note: 'Supports the LH surge and ovulation' },
    ],
    foods: ['Colourful vegetables', 'Whole grains', 'Berries', 'Flaxseeds', 'Nuts'],
    tip: 'Your highest energy window — match your nutrition to your output. Great time for carb-focused meals around training.',
    accentBg: 'bg-teal-50', accentText: 'text-teal-700', tagBg: 'bg-teal-100',
  },
  Luteal: {
    appetite: 'Appetite increases — cravings are hormonal',
    focus: ['Slightly higher calories', 'Complex carbs + healthy fats', 'Blood sugar stability'],
    nutrients: [
      { label: 'Magnesium', note: 'Reduces PMS, cravings and supports sleep — chocolate cravings signal deficiency' },
      { label: 'Calcium', note: 'Reduces PMS mood symptoms and bloating' },
      { label: 'Vitamin B6', note: 'Supports progesterone production and mood' },
      { label: 'Healthy fats', note: 'Support progesterone and reduce inflammation' },
    ],
    foods: ['Sweet potato', 'Avocado', 'Dark chocolate', 'Oats', 'Legumes', 'Salmon'],
    tip: 'Add ~100–200 kcal extra if hunger is elevated — this is physiological, not a lack of willpower. Prioritise stable blood sugar to manage mood and cravings.',
    accentBg: 'bg-purple-50', accentText: 'text-purple-700', tagBg: 'bg-purple-100',
  },
}

// ── Training config ────────────────────────────────────────────────────────
type TrainingGuide = {
  intensity: string
  types: string[]
  best: string[]
  reduce: string[]
  why: string
  tip: string
}

const TRAINING: Record<PhaseName, TrainingGuide> = {
  Menstrual: {
    intensity: 'Low — listen to your body',
    types: ['Restorative yoga', 'Walking', 'Gentle stretching', 'Swimming'],
    best: ['Short walks', 'Yoga & mobility', 'Breathwork', 'Light stretching'],
    reduce: ['Heavy lifting', 'HIIT', 'High-volume training'],
    why: 'Energy and iron are lower from bleeding. The body is in a repair state — pushing hard extends recovery time and can worsen cramps and fatigue.',
    tip: 'Movement is still beneficial — gentle exercise reduces prostaglandins and eases cramps. Follow your energy, not a programme.',
  },
  Follicular: {
    intensity: 'Moderate to high — build progressively',
    types: ['Strength training', 'HIIT', 'Running', 'Cycling'],
    best: ['Heavy compound lifts', 'Sprint intervals', 'New skills & PRs', 'High-volume training'],
    reduce: ['Excessive rest days', 'Only low-intensity work'],
    why: 'Rising oestrogen improves muscle repair, coordination and pain tolerance. Your body responds best to training stimulus right now — adaptations are faster in this phase.',
    tip: 'This is your best window to increase load or try something new. Your strength, endurance and motivation are all peaking.',
  },
  Ovulation: {
    intensity: 'Peak — max effort sessions',
    types: ['Max lifts', 'HIIT', 'Competitive sport', 'High-intensity cardio'],
    best: ['Personal bests', 'Competitions', 'Explosive power work', 'High-intensity intervals'],
    reduce: ['Passive rest (if energy allows)'],
    why: 'Peak oestrogen and a surge in testosterone create your highest strength, power and coordination window of the month. This is your athletic peak.',
    tip: 'Warm up thoroughly — oestrogen increases ligament laxity slightly, raising injury risk (especially ACL). Great time for PRs, poor time to skip the warm-up.',
  },
  Luteal: {
    intensity: 'Moderate — reduce volume progressively',
    types: ['Moderate weights', 'Pilates', 'Hiking', 'Cycling', 'Yoga'],
    best: ['Moderate-intensity steady state', 'Pilates & barre', 'Technique work', 'Hiking'],
    reduce: ['Max effort lifts', 'High-volume HIIT', 'Intense cardio in final days'],
    why: 'Progesterone raises resting body temperature and increases perceived effort — the same workout feels harder. Carbohydrate availability also drops, reducing endurance capacity.',
    tip: 'Your heart rate runs ~2–5 bpm higher at the same effort in the luteal phase. Train by feel, not pace or load. In the final 3–4 days, prioritise recovery.',
  },
}

// ── Phase config ───────────────────────────────────────────────────────────
const PHASES: Record<PhaseName, Omit<Phase, 'name' | 'day'>> = {
  Menstrual: {
    tagline: 'Rest & restore',
    description: 'Your body is shedding and renewing. Prioritise sleep, warmth, iron-rich foods and gentle movement. This is a time of release — physically and emotionally.',
    gradient: 'from-rose-500 to-rose-400',
    text: 'text-white',
    muted: 'text-rose-100',
    segment: 'bg-rose-400',
  },
  Follicular: {
    tagline: 'Energy is building',
    description: 'Rising oestrogen brings mental clarity, confidence and social energy. A great window for new goals, higher-intensity training and creative work.',
    gradient: 'from-amber-400 to-orange-400',
    text: 'text-white',
    muted: 'text-amber-100',
    segment: 'bg-amber-400',
  },
  Ovulation: {
    tagline: 'Peak energy & fertility',
    description: 'Oestrogen peaks and LH surges — you are at your most magnetic, communicative and energetic. The main event of your cycle.',
    gradient: 'from-teal-500 to-emerald-400',
    text: 'text-white',
    muted: 'text-teal-100',
    segment: 'bg-teal-400',
  },
  Luteal: {
    tagline: 'Turn inward & recover',
    description: 'Progesterone rises, slowing you down. Focus on recovery, nourishing meals and lower-intensity movement. Cravings and emotional sensitivity may increase as progesterone drops.',
    gradient: 'from-purple-500 to-violet-400',
    text: 'text-white',
    muted: 'text-purple-100',
    segment: 'bg-purple-400',
  },
}

const PHASE_ORDER: PhaseName[] = ['Menstrual', 'Follicular', 'Ovulation', 'Luteal']

// ── Helpers ────────────────────────────────────────────────────────────────
function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d + days)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number)
  const [by, bm, bd] = b.split('-').map(Number)
  return Math.round((new Date(by, bm - 1, bd).getTime() - new Date(ay, am - 1, ad).getTime()) / 86400000)
}

function todayString() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function calcPhase(logs: Record<string, boolean>, todayStr: string, avgCycle = 28): Phase | null {
  const periodDays = Object.keys(logs).filter(d => d <= todayStr && logs[d]).sort()
  if (periodDays.length === 0) return null

  // Find most recent period start
  let lastStart = periodDays[periodDays.length - 1]
  while (logs[addDays(lastStart, -1)]) lastStart = addDays(lastStart, -1)

  const dayOfCycle = daysBetween(lastStart, todayStr) + 1
  if (dayOfCycle > avgCycle + 7) return null

  let name: PhaseName
  if (dayOfCycle <= 5) name = 'Menstrual'
  else if (dayOfCycle <= 13) name = 'Follicular'
  else if (dayOfCycle <= 16) name = 'Ovulation'
  else name = 'Luteal'

  return { name, day: dayOfCycle, ...PHASES[name] }
}

function calcAvgCycle(logs: Record<string, boolean>, todayStr: string): number {
  const allDates = Object.keys(logs).filter(d => d <= todayStr && logs[d]).sort()
  const starts: string[] = []
  for (const d of allDates) {
    if (!logs[addDays(d, -1)]) starts.push(d)
  }
  if (starts.length < 2) return 28
  const lengths = []
  for (let i = 1; i < starts.length; i++) {
    const l = daysBetween(starts[i - 1], starts[i])
    if (l >= 18 && l <= 45) lengths.push(l)
  }
  if (lengths.length === 0) return 28
  const recent = lengths.slice(-3)
  return Math.round(recent.reduce((a, b) => a + b, 0) / recent.length)
}

// ── Component ──────────────────────────────────────────────────────────────
export default function CyclePhaseBar() {
  const [phase, setPhase] = useState<Phase | null>(null)
  const [avgCycle, setAvgCycle] = useState(28)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const today = todayString()
      const from = addDays(today, -180)

      const { data } = await supabase
        .from('cycle_logs')
        .select('log_date, period')
        .eq('user_id', session.user.id)
        .gte('log_date', from)
        .order('log_date', { ascending: true })

      const logs: Record<string, boolean> = {}
      for (const row of data ?? []) logs[row.log_date] = row.period

      const avg = calcAvgCycle(logs, today)
      setAvgCycle(avg)
      setPhase(calcPhase(logs, today, avg))
    }
    load()
  }, [])

  if (!phase) return null

  const nutrition = NUTRITION[phase.name]
  const training = TRAINING[phase.name]

  // Approximate phase day ranges for the progress segments
  const phaseRanges: Record<PhaseName, [number, number]> = {
    Menstrual:  [1, 5],
    Follicular: [6, 13],
    Ovulation:  [14, 16],
    Luteal:     [17, avgCycle],
  }
  const config = PHASES[phase.name]
  const [, end] = phaseRanges[phase.name]
  const daysLeft = Math.max(0, end - phase.day + 1)

  return (
    <>
    <div className={`rounded-2xl bg-gradient-to-br ${config.gradient} p-5 shadow-lg`}>
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-widest ${config.muted}`}>
            Current Phase · Day {phase.day}
          </p>
          <h2 className={`text-2xl font-bold mt-0.5 ${config.text}`}>
            {phase.name} Phase
          </h2>
          <p className={`text-sm font-semibold mt-0.5 ${config.muted}`}>
            {config.tagline}
          </p>
        </div>
        {daysLeft > 0 && (
          <div className={`flex-shrink-0 text-center px-3 py-2 rounded-xl bg-white/20`}>
            <p className={`text-lg font-bold ${config.text}`}>{daysLeft}</p>
            <p className={`text-xs ${config.muted}`}>days left</p>
          </div>
        )}
      </div>

      {/* Description */}
      <p className={`text-sm mt-3 leading-relaxed ${config.muted}`}>
        {config.description}
      </p>

      {/* Phase progress segments */}
      <div className="mt-4 flex gap-1.5">
        {PHASE_ORDER.map((p) => {
          const isActive = p === phase.name
          const isPast = PHASE_ORDER.indexOf(p) < PHASE_ORDER.indexOf(phase.name)
          return (
            <div key={p} className="flex-1 flex flex-col gap-1">
              <div
                className={`h-1.5 rounded-full transition-all ${
                  isActive ? 'bg-white' : isPast ? 'bg-white/40' : 'bg-white/20'
                }`}
              />
              <p className={`text-xs text-center hidden sm:block ${
                isActive ? `font-bold ${config.text}` : config.muted
              }`} style={{ fontSize: '10px' }}>
                {p}
              </p>
            </div>
          )
        })}
      </div>
    </div>

    {/* Nutrition card */}
    <div className={`rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm`}>
      {/* Header */}
      <div className={`px-4 py-3 ${nutrition.accentBg} flex items-center justify-between`}>
        <div>
          <p className={`text-xs font-bold uppercase tracking-widest ${nutrition.accentText}`}>
            Nutrition · {phase.name} Phase
          </p>
          <p className={`text-sm font-semibold mt-0.5 text-gray-700`}>{nutrition.appetite}</p>
        </div>
        <span className="text-xl">🥗</span>
      </div>

      <div className="p-4 space-y-4">
        {/* Focus areas */}
        <div className="flex flex-wrap gap-2">
          {nutrition.focus.map((f) => (
            <span key={f} className={`text-xs font-semibold px-2.5 py-1 rounded-full ${nutrition.tagBg} ${nutrition.accentText}`}>
              {f}
            </span>
          ))}
        </div>

        {/* Key nutrients */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Key Nutrients</p>
          <div className="space-y-2">
            {nutrition.nutrients.map(({ label, note }) => (
              <div key={label} className="flex items-start gap-2">
                <span className={`mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${nutrition.tagBg.replace('bg-', 'bg-').replace('-100', '-400')}`} />
                <div>
                  <span className="text-sm font-semibold text-gray-800">{label} </span>
                  <span className="text-xs text-gray-400">{note}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Foods */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Eat More Of</p>
          <div className="flex flex-wrap gap-1.5">
            {nutrition.foods.map((food) => (
              <span key={food} className="text-xs px-2.5 py-1 rounded-full bg-gray-50 border border-gray-100 text-gray-600 font-medium">
                {food}
              </span>
            ))}
          </div>
        </div>

        {/* Tip */}
        <div className={`rounded-xl px-3 py-2.5 ${nutrition.accentBg}`}>
          <p className={`text-xs leading-relaxed ${nutrition.accentText}`}>
            <span className="font-bold">Tip: </span>{nutrition.tip}
          </p>
        </div>
      </div>
    </div>

    {/* Training card */}
    <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm">
      {/* Header */}
      <div className={`px-4 py-3 ${nutrition.accentBg} flex items-center justify-between`}>
        <div>
          <p className={`text-xs font-bold uppercase tracking-widest ${nutrition.accentText}`}>
            Training · {phase.name} Phase
          </p>
          <p className="text-sm font-semibold mt-0.5 text-gray-700">{training.intensity}</p>
        </div>
        <span className="text-xl">🏋️</span>
      </div>

      <div className="p-4 space-y-4">
        {/* Training types */}
        <div className="flex flex-wrap gap-1.5">
          {training.types.map((t) => (
            <span key={t} className={`text-xs font-semibold px-2.5 py-1 rounded-full ${nutrition.tagBg} ${nutrition.accentText}`}>
              {t}
            </span>
          ))}
        </div>

        {/* Best for / Reduce */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Focus On</p>
            <ul className="space-y-1.5">
              {training.best.map((b) => (
                <li key={b} className="flex items-start gap-1.5">
                  <span className="text-green-400 mt-0.5 flex-shrink-0 text-xs">✓</span>
                  <span className="text-xs text-gray-600">{b}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Reduce</p>
            <ul className="space-y-1.5">
              {training.reduce.map((r) => (
                <li key={r} className="flex items-start gap-1.5">
                  <span className="text-rose-400 mt-0.5 flex-shrink-0 text-xs">↓</span>
                  <span className="text-xs text-gray-600">{r}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Why */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5">Why</p>
          <p className="text-xs text-gray-500 leading-relaxed">{training.why}</p>
        </div>

        {/* Tip */}
        <div className={`rounded-xl px-3 py-2.5 ${nutrition.accentBg}`}>
          <p className={`text-xs leading-relaxed ${nutrition.accentText}`}>
            <span className="font-bold">Tip: </span>{training.tip}
          </p>
        </div>
      </div>
    </div>
  </>
  )
}
