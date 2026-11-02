import {
  Activity,
  ChevronDown,
  Command,
  Compass,
  FolderKanban,
  LayoutDashboard,
  Menu,
  Moon,
  PanelLeftClose,
  Plus,
  Search,
  Settings,
  Sun,
  UserRound,
  Waves,
} from "lucide-react"
import RipplesPage from "@/features/ripples/RipplesPage"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

type Theme = "dark" | "light"

const navigation = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Projects", icon: FolderKanban },
  { label: "Ripples", icon: Waves },
  { label: "Activity", icon: Activity },
  { label: "Explore", icon: Compass },
]

export default function App() {
  const [theme, setTheme] = useState<Theme>("dark")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeSection, setActiveSection] = useState("Ripples")

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("dashboard-theme") as Theme | null
    if (savedTheme === "light" || savedTheme === "dark") setTheme(savedTheme)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
    window.localStorage.setItem("dashboard-theme", theme)
  }, [theme])

  return (
    <div className={`workspace-shell ${sidebarOpen ? "" : "sidebar-collapsed"}`}>
      <aside className={`workspace-sidebar ${sidebarOpen ? "is-open" : "is-closed"}`}>
        <div className="workspace-brand-row">
          <a href="#" className="workspace-brand" aria-label="Pappmilan home">
            <span className="workspace-brand-mark"><Waves size={19} /></span>
            <span><strong>pappmilan</strong><small>PERSONAL WORKSPACE</small></span>
          </a>
          <Button variant="ghost" size="icon" className="workspace-sidebar-toggle" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar">
            <PanelLeftClose className="size-4" />
          </Button>
        </div>

        <button className="workspace-create" type="button">
          <span><Plus size={16} /></span> New workspace <kbd>⌘ K</kbd>
        </button>
        <button className="workspace-search" type="button">
          <Search size={15} /> <span>Search workspace</span><kbd>⌘ /</kbd>
        </button>

        <div className="workspace-nav-group">
          <p className="workspace-nav-label">WORKSPACE</p>
          <nav aria-label="Workspace navigation">
            {navigation.map(({ label, icon: Icon }) => (
              <button key={label} type="button" onClick={() => setActiveSection(label)}
                className={`workspace-nav-item ${activeSection === label ? "active" : ""}`}
                aria-current={activeSection === label ? "page" : undefined}>
                <Icon size={17} strokeWidth={1.8} /><span>{label}</span>
                {activeSection === label && <i />}
              </button>
            ))}
          </nav>
        </div>

        <div className="workspace-sidebar-bottom">
          <button className="workspace-nav-item" type="button"><Settings size={17} /><span>Settings</span></button>
          <div className="workspace-profile">
            <div className="workspace-avatar">MP</div>
            <div className="workspace-profile-copy"><strong>Milán Papp</strong><span>Personal workspace</span></div>
            <ChevronDown size={15} />
          </div>
        </div>
      </aside>

      <main className="workspace-main">
        <header className="workspace-topbar">
          <div className="workspace-topbar-left">
            {!sidebarOpen && <Button variant="ghost" size="icon" className="workspace-open-sidebar" onClick={() => setSidebarOpen(true)} aria-label="Open sidebar"><Menu size={17} /></Button>}
            <div className="workspace-breadcrumb"><span>Workspace</span><ChevronDown size={14} /><strong>{activeSection}</strong></div>
          </div>
          <div className="workspace-topbar-actions">
            <span className="workspace-live-indicator"><i /> ALL SYSTEMS NORMAL</span>
            <Button variant="outline" size="icon" className="workspace-theme-toggle" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </Button>
            <button className="workspace-user-button" type="button" aria-label="Account"><UserRound size={16} /></button>
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
