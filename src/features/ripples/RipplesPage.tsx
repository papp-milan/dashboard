import {
  Activity, BookOpen, Check, ChevronDown, Code2, Dumbbell, Droplets, Footprints,
  Heart, Moon, NotebookPen, Plus, Sparkles, X,
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

function RippleOrb({
  habit, category, completed, onSelect, onToggle, index,
}: {
  habit: RippleHabit
  category?: RippleCategory
  completed: boolean
  onSelect: () => void
  onToggle: () => void
  index: number
}) {
  const Icon = habit.icon && habit.icon in iconMap
    ? iconMap[habit.icon as keyof typeof iconMap]
    : Sparkles
  const color = category?.color ?? "#A995E8"
  return (
    <article className={`ripple-orb-wrap ripple-offset-${index % 4}`}>
      <button
        type="button"
        className={`ripple-orb ${completed ? "is-complete" : ""}`}
        style={{ "--ripple-color": color } as CSSProperties}
        onClick={onSelect}
        aria-label={`${habit.name}, ${completed ? "completed today" : "not completed today"}. Open details.`}
      >
        <span className="ripple-orb-shine" />
        <span className="ripple-orb-icon"><Icon size={21} strokeWidth={1.8} /></span>
        <span className="ripple-orb-name">{habit.name}</span>
        <span className="ripple-orb-category">{category?.name ?? "Unsorted"}</span>
        {completed && <span className="ripple-orb-check"><Check size={13} strokeWidth={2.7} /></span>}
      </button>
      <button
        type="button"
        className={`ripple-complete-control ${completed ? "done" : ""}`}
        onClick={onToggle}
        aria-label={completed ? `Undo completion for ${habit.name}` : `Complete ${habit.name}`}
      >
        {completed ? <Check size={13} /> : <span />}
      </button>
    </article>
  )
}

export default function RipplesPage() {
  const [categories, setCategories] = useState<RippleCategory[]>(demoCategories)
  const [habits, setHabits] = useState<RippleHabit[]>(demoHabits)
  const [completions, setCompletions] = useState<RippleCompletion[]>(demoCompletions)
  const [period, setPeriod] = useState<RipplePeriod>("week")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [showCategories, setShowCategories] = useState(false)
  const [habitName, setHabitName] = useState("")
  const [habitCategory, setHabitCategory] = useState(demoCategories[0].id)
  const [categoryName, setCategoryName] = useState("")
  const [categoryColor, setCategoryColor] = useState(palettes[0])

  const sorted = useMemo(() => sortNewestFirst(habits.filter(habit => !habit.archivedAt)), [habits])
  const visible = sorted.filter(habit => categoryFilter === "all" || habit.categoryId === categoryFilter)
  const selected = habits.find(habit => habit.id === selectedHabitId)
  const selectedCategory = selected && categories.find(category => category.id === selected.categoryId)
  const todayCompletions = new Set(completions.filter(item => item.completedOn === today()).map(item => item.habitId))
  const rate = getCompletionRate(habits, completions, period)
  const bestStreak = Math.max(0, ...habits.map(habit => getCurrentStreak(habit, completions)))

  function toggleCompletion(habitId: string) {
    if (todayCompletions.has(habitId)) {
      setCompletions(current => current.filter(item => !(item.habitId === habitId && item.completedOn === today())))
      return
    }
    const completedAt = new Date().toISOString()
    setCompletions(current => [...current, { id: `${habitId}-${today()}`, habitId, completedOn: today(), completedAt }])
  }

  function createHabit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = habitName.trim()
    if (!name || !habitCategory) return
    const habit: RippleHabit = {
      id: crypto.randomUUID(),
      name,
      categoryId: habitCategory,
      icon: "sparkles",
      schedule: { kind: "daily" },
      createdAt: new Date().toISOString(),
    }
    setHabits(current => [habit, ...current])
    setHabitName("")
    setShowCreate(false)
    setSelectedHabitId(habit.id)
  }

  function createCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = categoryName.trim()
    if (!name) return
    const now = new Date().toISOString()
    const category: RippleCategory = {
      id: crypto.randomUUID(), name, color: categoryColor, createdAt: now, updatedAt: now,
    }
    setCategories(current => [...current, category])
    setHabitCategory(category.id)
    setCategoryName("")
  }

  return (
    <div className="ripples-page">
      <div className="ripples-heading">
        <div>
          <div className="ripples-eyebrow"><span /> PERSONAL MOMENTUM</div>
          <h1>Your Ripples</h1>
          <p>Small actions. Lasting momentum.</p>
        </div>
        <button type="button" className="ripple-primary-action" onClick={() => setShowCreate(true)}>
          <Plus size={17} /> New ripple
        </button>
      </div>

      <section className="ripple-stats" aria-label="Habit progress">
        <div className="ripple-stat-card">
          <span className="ripple-stat-icon violet"><Activity size={17} /></span>
          <div><strong>{habits.filter(habit => !habit.archivedAt).length}</strong><span>Active habits</span></div>
        </div>
        <div className="ripple-stat-card">
          <span className="ripple-stat-icon peach"><Heart size={17} /></span>
          <div><strong>{bestStreak}<small> days</small></strong><span>Best current streak</span></div>
        </div>
        <div className="ripple-stat-card">
          <span className="ripple-stat-icon mint"><Sparkles size={17} /></span>
          <div><strong>{rate}<small>%</small></strong><span>Completion rate</span></div>
        </div>
      </section>

      <div className="ripple-toolbar">
        <div className="ripple-filters" role="group" aria-label="Filter by category">
          <button className={categoryFilter === "all" ? "active" : ""} onClick={() => setCategoryFilter("all")}>All habits</button>
          {categories.filter(category => !category.archivedAt).map(category => (
            <button key={category.id} className={categoryFilter === category.id ? "active" : ""} onClick={() => setCategoryFilter(category.id)}>
              <i style={{ background: category.color }} />{category.name}
            </button>
          ))}
        </div>
        <div className="ripple-toolbar-actions">
          <label className="ripple-period-select">
            <span className="sr-only">Progress period</span>
            <select value={period} onChange={event => setPeriod(event.target.value as RipplePeriod)}>
              <option value="week">This week</option><option value="month">This month</option><option value="year">This year</option>
            </select>
            <ChevronDown size={14} />
          </label>
          <button type="button" className="ripple-quiet-action" onClick={() => setShowCategories(true)}>Manage categories</button>
        </div>
      </div>

      <div className="ripple-flow-heading">
        <div><h2>Your flow</h2><p>Newest habits begin at the source.</p></div>
        <span>{visible.length} {visible.length === 1 ? "ripple" : "ripples"}</span>
      </div>

      {visible.length ? (
        <section className="ripple-flow" aria-label="Your habits, newest first">
          {visible.map((habit, index) => (
            <RippleOrb
              key={habit.id}
              habit={habit}
              category={categories.find(category => category.id === habit.categoryId)}
              completed={todayCompletions.has(habit.id)}
              onSelect={() => setSelectedHabitId(habit.id)}
              onToggle={() => toggleCompletion(habit.id)}
              index={index}
            />
          ))}
          <button type="button" className="ripple-add-orb" onClick={() => setShowCreate(true)} aria-label="Add a new ripple">
            <Plus size={22} /><span>Add a ripple</span>
          </button>
        </section>
      ) : (
        <div className="ripple-empty"><Sparkles size={24} /><h3>No ripples here yet</h3><p>Create a habit or choose another category filter.</p><button onClick={() => setShowCreate(true)}>Create your first ripple</button></div>
      )}

      {selected && (
        <div className="ripple-overlay" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setSelectedHabitId(null) }}>
          <aside className="ripple-detail-panel" role="dialog" aria-modal="true" aria-labelledby="ripple-detail-title">
            <button className="ripple-modal-close" onClick={() => setSelectedHabitId(null)} aria-label="Close details"><X size={18} /></button>
            <div className="ripple-detail-orb" style={{ "--ripple-color": selectedCategory?.color ?? "#A995E8" } as CSSProperties}><Sparkles size={27} /></div>
            <span className="ripple-detail-kicker">{selectedCategory?.name ?? "Unsorted"}</span>
            <h2 id="ripple-detail-title">{selected.name}</h2>
            <p>{selected.description ?? "A small action, repeated consistently, creates meaningful momentum."}</p>
            <div className="ripple-detail-row"><span>Schedule</span><strong>{selected.schedule.kind === "weekdays" ? "Weekdays" : selected.schedule.kind[0].toUpperCase() + selected.schedule.kind.slice(1)}</strong></div>
            <div className="ripple-detail-row"><span>Current streak</span><strong>{getCurrentStreak(selected, completions)} days</strong></div>
            <div className="ripple-detail-row"><span>Completed today</span><strong>{todayCompletions.has(selected.id) ? "Yes" : "Not yet"}</strong></div>
            <button className="ripple-primary-action detail-complete" onClick={() => toggleCompletion(selected.id)}>
              {todayCompletions.has(selected.id) ? <><Check size={16} /> Completed today · Undo</> : <><Check size={16} /> Mark as complete</>}
            </button>
          </aside>
        </div>
      )}

      {(showCreate || showCategories) && (
        <div className="ripple-overlay" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) { setShowCreate(false); setShowCategories(false) } }}>
          <section className="ripple-form-panel" role="dialog" aria-modal="true" aria-labelledby="ripple-form-title">
            <div className="ripple-form-header"><div><span className="ripple-detail-kicker">MAKE IT A HABIT</span><h2 id="ripple-form-title">{showCreate ? "Create a ripple" : "Your categories"}</h2></div><button className="ripple-modal-close" onClick={() => { setShowCreate(false); setShowCategories(false) }} aria-label="Close"><X size={18} /></button></div>
            {showCreate ? (
              <form onSubmit={createHabit} className="ripple-form">
                <label>Habit name<input autoFocus value={habitName} onChange={event => setHabitName(event.target.value)} placeholder="e.g. Read 20 pages" maxLength={60} required /></label>
                <label>Category<select value={habitCategory} onChange={event => setHabitCategory(event.target.value)} required>{categories.filter(category => !category.archivedAt).map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
                <p className="ripple-form-note">New habits start as daily habits. Scheduling options will be added in the next interaction milestone.</p>
                <button className="ripple-primary-action" type="submit"><Plus size={16} /> Create ripple</button>
              </form>
            ) : (
              <div className="ripple-category-manager">
                <div className="ripple-category-list">{categories.map(category => <div key={category.id} className="ripple-category-item"><i style={{ background: category.color }} /><span>{category.name}</span><small>{habits.filter(habit => habit.categoryId === category.id).length} habits</small></div>)}</div>
                <form onSubmit={createCategory} className="ripple-form">
                  <label>New category<input autoFocus value={categoryName} onChange={event => setCategoryName(event.target.value)} placeholder="e.g. Creativity" maxLength={30} required /></label>
                  <div className="ripple-palette" role="group" aria-label="Choose category color">{palettes.map(color => <button key={color} type="button" className={categoryColor === color ? "selected" : ""} style={{ background: color }} onClick={() => setCategoryColor(color)} aria-label={`Choose ${color}`} />)}</div>
                  <button className="ripple-primary-action" type="submit"><Plus size={16} /> Add category</button>
                </form>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
