import {
  Activity, BookOpen, Check, ChevronDown, Code2, Dumbbell, Droplets, Footprints,
  Heart, Moon, NotebookPen, Plus, Sparkles, X, Target,
} from "lucide-react"
import { useMemo, useState } from "react"
import type { CSSProperties, FormEvent } from "react"
import { demoCategories, demoCompletions, demoHabits } from "./ripple-demo-data"
import { getCompletionRate, getCurrentStreak, localDateKey, sortNewestFirst } from "./ripple-utils"
import type { RippleCategory, RippleCompletion, RippleHabit, RipplePeriod } from "./types"
import "./ripples.css"

const iconMap = {
  book: BookOpen, dumbbell: Dumbbell, droplets: Droplets, code: Code2,
  footprints: Footprints, "notebook-pen": NotebookPen, moon: Moon,
} as const
const palettes = ["#E79A86", "#A995E8", "#79BFAE", "#7EAED8", "#E6B96E", "#D98FB4"]
const today = () => localDateKey()
const readSaved = <T,>(key: string, fallback: T): T => {
  try { const value = localStorage.getItem(key); return value ? JSON.parse(value) as T : fallback } catch { return fallback }
}
const monthLabel = (date: Date) => date.toLocaleDateString(undefined, { month: "long", year: "numeric" })
const dayLabel = (date: Date) => date.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })

function RippleOrb({ habit, category, completed, onSelect, onToggle, index }: {
  habit: RippleHabit; category?: RippleCategory; completed: boolean; onSelect: () => void; onToggle: () => void; index: number
}) {
  const Icon = habit.icon && habit.icon in iconMap ? iconMap[habit.icon as keyof typeof iconMap] : Sparkles
  const color = category?.color ?? "#A995E8"
  return (
    <article className={`ripple-orb-wrap ripple-offset-${index % 4}`}>
      <button type="button" className={`ripple-orb ${completed ? "is-complete" : ""}`}
        style={{ "--ripple-color": color } as CSSProperties} onClick={onSelect}
        aria-label={`${habit.name}. Open habit history.`}>
        <span className="ripple-orb-shine" /><span className="ripple-orb-icon"><Icon size={21} /></span>
        <span className="ripple-orb-name">{habit.name}</span><span className="ripple-orb-category">{category?.name ?? "Unsorted"}</span>
        {completed && <span className="ripple-orb-check"><Check size={13} /></span>}
      </button>
      <button type="button" className={`ripple-complete-control ${completed ? "done" : ""}`} onClick={onToggle}
        aria-label={completed ? `Undo ${habit.name}` : `Complete ${habit.name}`}>{completed ? <Check size={13} /> : <span />}</button>
    </article>
  )
}

function HistoryDots({ dates, completed, color }: { dates: Date[]; completed: Set<string>; color: string }) {
  return <div className="ripple-history-dots">{dates.map(date => {
    const key = localDateKey(date); const done = completed.has(key)
    return <span key={key} className={`ripple-history-dot ${done ? "filled" : ""}`}
      style={done ? { "--history-color": color } as CSSProperties : undefined}
      title={`${dayLabel(date)} · ${done ? "Tracked" : "Not tracked"}`} aria-label={`${key}: ${done ? "tracked" : "not tracked"}`} />
  })}</div>
}

export default function RipplesPage() {
  const [categories, setCategories] = useState<RippleCategory[]>(() => readSaved("ripples.categories", demoCategories))
  const [habits, setHabits] = useState<RippleHabit[]>(() => readSaved("ripples.habits", demoHabits))
  const [completions, setCompletions] = useState<RippleCompletion[]>(() => readSaved("ripples.completions", demoCompletions))
  const [mainGoalId, setMainGoalId] = useState<string | null>(() => readSaved("ripples.mainGoal", null))
  const [period, setPeriod] = useState<RipplePeriod>("week")
  const [historyPeriod, setHistoryPeriod] = useState<"week" | "month" | "year">("month")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [showCategories, setShowCategories] = useState(false)
  const [habitName, setHabitName] = useState("")
  const [habitCategory, setHabitCategory] = useState(demoCategories[0].id)
  const [categoryName, setCategoryName] = useState("")
  const [categoryColor, setCategoryColor] = useState(palettes[0])

  const persist = <T,>(key: string, value: T) => { try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* storage may be unavailable */ } }
  const saveHabits = (value: RippleHabit[]) => { setHabits(value); persist("ripples.habits", value) }
  const saveCategories = (value: RippleCategory[]) => { setCategories(value); persist("ripples.categories", value) }
  const saveCompletions = (value: RippleCompletion[]) => { setCompletions(value); persist("ripples.completions", value) }
  const activeHabits = useMemo(() => sortNewestFirst(habits.filter(h => !h.archivedAt)), [habits])
  const visible = activeHabits.filter(h => categoryFilter === "all" || h.categoryId === categoryFilter)
  const selected = habits.find(h => h.id === selectedHabitId)
  const selectedCategory = selected && categories.find(c => c.id === selected.categoryId)
  const todayCompletions = new Set(completions.filter(c => c.completedOn === today()).map(c => c.habitId))
  const completedDates = new Set(completions.filter(c => c.habitId === selected?.id).map(c => c.completedOn))
  const rate = getCompletionRate(activeHabits, completions, period)
  const bestStreak = Math.max(0, ...activeHabits.map(h => getCurrentStreak(h, completions)))
  const goal = activeHabits.find(h => h.id === mainGoalId)

  function chooseMainGoal(value: string) {
    const next = value || null; setMainGoalId(next); persist("ripples.mainGoal", next)
  }
  function toggleCompletion(habitId: string) {
    const next = todayCompletions.has(habitId)
      ? completions.filter(c => !(c.habitId === habitId && c.completedOn === today()))
      : [...completions, { id: `${habitId}-${today()}`, habitId, completedOn: today(), completedAt: new Date().toISOString() }]
    saveCompletions(next)
  }
  function createHabit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const name = habitName.trim(); if (!name || !habitCategory) return
    const habit: RippleHabit = { id: crypto.randomUUID(), name, categoryId: habitCategory, icon: "sparkles", schedule: { kind: "daily" }, createdAt: new Date().toISOString() }
    saveHabits([habit, ...habits]); setHabitName(""); setShowCreate(false); setSelectedHabitId(habit.id)
  }
  function createCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const name = categoryName.trim(); if (!name) return
    const now = new Date().toISOString(); const category: RippleCategory = { id: crypto.randomUUID(), name, color: categoryColor, createdAt: now, updatedAt: now }
    saveCategories([...categories, category]); setHabitCategory(category.id); setCategoryName("")
  }

  const now = new Date()
  const historyDates = (() => {
    if (historyPeriod === "week") {
      const start = new Date(now); start.setDate(start.getDate() - ((start.getDay() + 6) % 7))
      return Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d })
    }
    if (historyPeriod === "month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      return Array.from({ length: new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() }, (_, i) => new Date(start.getFullYear(), start.getMonth(), i + 1))
    }
    return []
  })()

  return (
    <div className="ripples-page ripples-focus">
      <div className="ripples-heading">
        <div><div className="ripples-eyebrow"><span /> PERSONAL MOMENTUM</div><h1>Your Ripples</h1><p>Small actions. Lasting momentum.</p></div>
        <button type="button" className="ripple-primary-action" onClick={() => setShowCreate(true)}><Plus size={17} /> New ripple</button>
      </div>

      <section className="ripple-focus-card" aria-label="Main goal">
        <div className="ripple-focus-top"><div><span className="ripple-focus-kicker"><Target size={14} /> YOUR FOCUS</span><h2>{goal ? goal.name : "Choose what matters most"}</h2>
          <p>{goal ? "One meaningful action to keep in sight. Your other habits remain just as important." : "Set an optional Main Goal. Without one, every habit has equal importance."}</p></div>
          {goal && <span className="ripple-focus-symbol"><Target size={25} /></span>}
        </div>
        <div className="ripple-focus-controls">
          <label htmlFor="ripple-main-goal">Main Goal</label>
          <select id="ripple-main-goal" value={mainGoalId ?? ""} onChange={e => chooseMainGoal(e.target.value)}>
            <option value="">No main goal · equal importance</option>
            {activeHabits.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
          {goal && <button type="button" className="ripple-focus-check" onClick={() => toggleCompletion(goal.id)}>{todayCompletions.has(goal.id) ? <><Check size={15} /> Tracked today</> : <><Plus size={15} /> Track today</>}</button>}
        </div>
      </section>

      <section className="ripple-stats" aria-label="Habit progress">
        <div className="ripple-stat-card"><span className="ripple-stat-icon violet"><Activity size={17} /></span><div><strong>{activeHabits.length}</strong><span>Active habits</span></div></div>
        <div className="ripple-stat-card"><span className="ripple-stat-icon peach"><Heart size={17} /></span><div><strong>{bestStreak}<small> days</small></strong><span>Best current streak</span></div></div>
        <div className="ripple-stat-card"><span className="ripple-stat-icon mint"><Sparkles size={17} /></span><div><strong>{rate}<small>%</small></strong><span>Completion rate</span></div></div>
      </section>

      <div className="ripple-toolbar">
        <div className="ripple-filters" role="group" aria-label="Filter by category">
          <button className={categoryFilter === "all" ? "active" : ""} onClick={() => setCategoryFilter("all")}>All habits</button>
          {categories.filter(c => !c.archivedAt).map(c => <button key={c.id} className={categoryFilter === c.id ? "active" : ""} onClick={() => setCategoryFilter(c.id)}><i style={{ background: c.color }} />{c.name}</button>)}
        </div>
        <div className="ripple-toolbar-actions"><label className="ripple-period-select"><span className="sr-only">Progress period</span><select value={period} onChange={e => setPeriod(e.target.value as RipplePeriod)}><option value="week">This week</option><option value="month">This month</option><option value="year">This year</option></select><ChevronDown size={14} /></label><button type="button" className="ripple-quiet-action" onClick={() => setShowCategories(true)}>Manage categories</button></div>
      </div>

      <div className="ripple-flow-heading"><div><h2>All habits</h2><p>Every ripple has room to grow.</p></div><span>{visible.length} {visible.length === 1 ? "habit" : "habits"}</span></div>
      {visible.length ? <section className="ripple-flow" aria-label="All habits">{visible.map((habit, index) => <RippleOrb key={habit.id} habit={habit} category={categories.find(c => c.id === habit.categoryId)} completed={todayCompletions.has(habit.id)} onSelect={() => { setHistoryPeriod("month"); setSelectedHabitId(habit.id) }} onToggle={() => toggleCompletion(habit.id)} index={index} />)}<button type="button" className="ripple-add-orb" onClick={() => setShowCreate(true)}><Plus size={22} /><span>Add a ripple</span></button></section> : <div className="ripple-empty"><Sparkles size={24} /><h3>No ripples here yet</h3><p>Create a habit or choose another category filter.</p><button onClick={() => setShowCreate(true)}>Create your first ripple</button></div>}

      {selected && <div className="ripple-overlay" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setSelectedHabitId(null) }}>
        <aside className="ripple-detail-panel ripple-history-panel" role="dialog" aria-modal="true" aria-labelledby="ripple-detail-title">
          <button className="ripple-modal-close" onClick={() => setSelectedHabitId(null)} aria-label="Close details"><X size={18} /></button>
          <div className="ripple-detail-orb" style={{ "--ripple-color": selectedCategory?.color ?? "#A995E8" } as CSSProperties}><Sparkles size={27} /></div>
          <span className="ripple-detail-kicker">{selectedCategory?.name ?? "Unsorted"} · HABIT HISTORY</span><h2 id="ripple-detail-title">{selected.name}</h2>
          <p>{selected.description ?? "A record of the days you chose to track this habit. Empty days are simply untracked — not failures."}</p>
          <div className="ripple-history-switch" role="group" aria-label="History range">
            {(["week", "month", "year"] as const).map(p => <button key={p} className={historyPeriod === p ? "active" : ""} onClick={() => setHistoryPeriod(p)}>{p[0].toUpperCase() + p.slice(1)}</button>)}
          </div>
          {historyPeriod !== "year" ? <section className="ripple-history-section"><div className="ripple-history-title"><strong>{historyPeriod === "week" ? "This week" : monthLabel(now)}</strong><span>{historyDates.filter(d => completedDates.has(localDateKey(d))).length} tracked</span></div>
            <HistoryDots dates={historyDates} completed={completedDates} color={selectedCategory?.color ?? "#A995E8"} />
            <div className="ripple-history-legend"><span><i className="tracked" /> Tracked</span><span><i /> Not tracked</span></div>
            <div className="ripple-history-day-list">{historyDates.map(d => <div key={localDateKey(d)}><span>{dayLabel(d)}</span><strong className={completedDates.has(localDateKey(d)) ? "tracked" : ""}>{completedDates.has(localDateKey(d)) ? "Tracked" : "—"}</strong></div>)}</div>
          </section> : <section className="ripple-year-grid">{Array.from({ length: 12 }, (_, i) => { const start = new Date(now.getFullYear(), i, 1); const dates = Array.from({ length: new Date(now.getFullYear(), i + 1, 0).getDate() }, (_, day) => new Date(now.getFullYear(), i, day + 1)); const count = dates.filter(d => completedDates.has(localDateKey(d))).length; return <div className="ripple-year-month" key={i}><div><strong>{start.toLocaleDateString(undefined, { month: "short" })}</strong><small>{count}/{dates.length}</small></div><HistoryDots dates={dates} completed={completedDates} color={selectedCategory?.color ?? "#A995E8"} /></div> })}</section>}
          <div className="ripple-detail-row"><span>Current streak</span><strong>{getCurrentStreak(selected, completions)} days</strong></div>
          <div className="ripple-detail-row"><span>Tracked today</span><strong>{todayCompletions.has(selected.id) ? "Yes" : "No"}</strong></div>
          <button className="ripple-primary-action detail-complete" onClick={() => toggleCompletion(selected.id)}>{todayCompletions.has(selected.id) ? <><Check size={16} /> Tracked today · Undo</> : <><Check size={16} /> Track today</>}</button>
        </aside>
      </div>}

      {(showCreate || showCategories) && <div className="ripple-overlay" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) { setShowCreate(false); setShowCategories(false) } }}>
        <section className="ripple-form-panel" role="dialog" aria-modal="true" aria-labelledby="ripple-form-title">
          <div className="ripple-form-header"><div><span className="ripple-detail-kicker">MAKE IT A HABIT</span><h2 id="ripple-form-title">{showCreate ? "Create a ripple" : "Your categories"}</h2></div><button className="ripple-modal-close" onClick={() => { setShowCreate(false); setShowCategories(false) }} aria-label="Close"><X size={18} /></button></div>
          {showCreate ? <form onSubmit={createHabit} className="ripple-form"><label>Habit name<input autoFocus value={habitName} onChange={e => setHabitName(e.target.value)} placeholder="e.g. Read 20 pages" maxLength={60} required /></label><label>Category<select value={habitCategory} onChange={e => setHabitCategory(e.target.value)} required>{categories.filter(c => !c.archivedAt).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label><p className="ripple-form-note">New habits start as daily habits.</p><button className="ripple-primary-action" type="submit"><Plus size={16} /> Create ripple</button></form> :
            <div className="ripple-category-manager"><div className="ripple-category-list">{categories.map(c => <div key={c.id} className="ripple-category-item"><i style={{ background: c.color }} /><span>{c.name}</span><small>{habits.filter(h => h.categoryId === c.id).length} habits</small></div>)}</div><form onSubmit={createCategory} className="ripple-form"><label>New category<input autoFocus value={categoryName} onChange={e => setCategoryName(e.target.value)} placeholder="e.g. Creativity" maxLength={30} required /></label><div className="ripple-palette" role="group" aria-label="Choose category color">{palettes.map(color => <button key={color} type="button" className={categoryColor === color ? "selected" : ""} style={{ background: color }} onClick={() => setCategoryColor(color)} aria-label={`Choose ${color}`} />)}</div><button className="ripple-primary-action" type="submit"><Plus size={16} /> Add category</button></form></div>}
        </section>
      </div>}
    </div>
  )
}
