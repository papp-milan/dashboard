import { ChevronDown, Moon, Sun, UserRound, Waves } from "lucide-react"
import RipplesPage from "@/features/ripples/RipplesPage"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

type Theme = "dark" | "light"
const navigation = ["Overview", "Planner", "Projects", "Goals", "Ripples"]

export default function App() {
  const [theme, setTheme] = useState<Theme>("dark")
  const [activeSection, setActiveSection] = useState("Ripples")
  const [showWelcome, setShowWelcome] = useState(() => {
    try { return window.localStorage.getItem("ripples.welcome-seen.v1") !== "true" } catch { return false }
  })
  const dismissWelcome = () => {
    try { window.localStorage.setItem("ripples.welcome-seen.v1", "true") } catch { /* storage may be unavailable */ }
    setShowWelcome(false)
  }
  useEffect(() => {
    const saved = window.localStorage.getItem("dashboard-theme") as Theme | null
    if (saved === "light" || saved === "dark") setTheme(saved)
  }, [])
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
    document.documentElement.classList.toggle("light", theme === "light")
    window.localStorage.setItem("dashboard-theme", theme)
  }, [theme])
  return <div className="workspace-shell"><main className="workspace-main">
    <header className="workspace-topbar">
      <a href="#" className="workspace-brand" aria-label="Workspace home"><span className="workspace-brand-mark"><Waves size={23}/></span><span className="workspace-brand-word">R<span>.</span></span></a>
      <nav className="workspace-primary-nav" aria-label="Main navigation">
        {navigation.map(label => <button key={label} type="button" onClick={() => setActiveSection(label)} className={`workspace-nav-item ${activeSection === label ? "active" : ""}`} aria-current={activeSection === label ? "page" : undefined}>{label}</button>)}
      </nav>
      <div className="workspace-topbar-actions">
        <Button variant="outline" size="icon" className="workspace-theme-toggle" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}>{theme === "dark" ? <Sun size={16}/> : <Moon size={16}/>}</Button>
        <button className="workspace-user-button" type="button" aria-label="Account"><UserRound size={16}/></button>
        <button className="workspace-account" type="button"><span className="workspace-avatar">MP</span><span>Milán Papp</span><ChevronDown size={14}/></button>
      </div>
    </header>
    {activeSection === "Ripples" || activeSection === "Overview" ? <section className="workspace-content"><RipplesPage/></section> : <section className="workspace-placeholder"><span className="workspace-overline">YOUR WORKSPACE</span><h1>{activeSection}</h1><p>This area is ready for the next part of your workspace.</p></section>}\n    {showWelcome && <div className="welcome-overlay" role="dialog" aria-label="Welcome to Ripples" onClick={dismissWelcome}><div className="welcome-glow" /><div className="welcome-content"><span className="welcome-mark"><Waves size={27}/></span><p className="welcome-kicker">A LITTLE SPACE FOR GROWTH</p><h1>Welcome to <span>Ripples.</span></h1><p className="welcome-subtitle">Small actions. Lasting momentum.</p></div><button className="welcome-skip" type="button" onClick={e => { e.stopPropagation(); dismissWelcome() }}>Skip intro</button></div>}
  </main></div>
}
