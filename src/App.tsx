import {
  Activity, ChevronDown, Command, Compass, FolderKanban, LayoutDashboard,
  Moon, Plus, Search, Settings, Sun, UserRound, Waves,
} from "lucide-react"
import RipplesPage from "@/features/ripples/RipplesPage"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

type Theme = "dark" | "light"

const navigation = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Planner", icon: Command },
  { label: "Projects", icon: FolderKanban },
  { label: "Goals", icon: Compass },
  { label: "Ripples", icon: Waves },
  { label: "Activity", icon: Activity },
]

export default function App() {
  const [theme, setTheme] = useState<Theme>("dark")
  const [activeSection, setActiveSection] = useState("Ripples")

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("dashboard-theme") as Theme | null
    if (savedTheme === "light" || savedTheme === "dark") setTheme(savedTheme)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
    document.documentElement.classList.toggle("light", theme === "light")
    window.localStorage.setItem("dashboard-theme", theme)
  }, [theme])

  return (
    <div className="workspace-shell">
      <main className="workspace-main">
        <header className="workspace-topbar">
          <a href="#" className="workspace-brand" aria-label="Pappmilan workspace home">
            <span className="workspace-brand-mark"><Waves size={21} /></span>
            <span className="workspace-brand-word">P<span>·</span></span>
          </a>
          <nav className="workspace-primary-nav" aria-label="Main navigation">
            {navigation.map(({ label, icon: Icon }) => (
              <button key={label} type="button" onClick={() => setActiveSection(label)}
                className={`workspace-nav-item ${activeSection === label ? "active" : ""}`}
                aria-current={activeSection === label ? "page" : undefined}>
                <Icon size={15} strokeWidth={1.7} /><span>{label}</span>
              </button>
            ))}
          </nav>
          <div className="workspace-topbar-actions">
            <Button variant="outline" size="icon" className="workspace-theme-toggle"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </Button>
            <button className="workspace-user-button" type="button" aria-label="Account"><UserRound size={16} /></button>
            <button className="workspace-account" type="button"><span className="workspace-avatar">MP</span><span>Milán Papp</span><ChevronDown size={14} /></button>
          </div>
        </header>

        {activeSection === "Ripples" ? (
          <section className="workspace-content"><RipplesPage /></section>
        ) : (
          <section className="workspace-placeholder">
            <div className="workspace-placeholder-icon"><Command size={22} /></div>
            <span className="workspace-overline">YOUR WORKSPACE</span>
            <h1>{activeSection}</h1>
            <p>This area is ready for the next part of your workspace.</p>
          </section>
        )}
        <footer className="workspace-footer"><span>RIPPLES</span><i /> A QUIETER WAY TO BUILD MOMENTUM <span className="workspace-footer-year">© 2026</span></footer>
      </main>
    </div>
  )
}
