import {
  Activity,
  ChevronDown,
  ChevronsUpDown,
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
  const [activeSection, setActiveSection] = useState("Overview")

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("dashboard-theme") as Theme | null
    if (savedTheme === "light" || savedTheme === "dark") setTheme(savedTheme)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
    window.localStorage.setItem("dashboard-theme", theme)
  }, [theme])

  return (
    <div className="flex min-h-svh bg-background text-foreground">
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-[260px] flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-200 md:relative md:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:hidden"}`}
      >
        <div className="flex h-16 items-center justify-between px-4">
          <a href="#" className="flex items-center gap-2.5 font-semibold tracking-tight">
            <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Command className="size-4" />
            </span>
            <span>Pappmilan</span>
          </a>
          <Button variant="ghost" size="icon" className="size-8 text-muted-foreground" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar">
            <PanelLeftClose className="size-4" />
          </Button>
        </div>

        <div className="px-3 pb-3">
          <Button variant="outline" className="h-10 w-full justify-start gap-2 border-sidebar-border bg-sidebar-accent/50 text-sidebar-foreground hover:bg-sidebar-accent">
            <Plus className="size-4" />
            New workspace
            <span className="ml-auto text-xs text-muted-foreground">⌘ K</span>
          </Button>
        </div>

        <div className="px-3 pb-2">
          <button className="flex h-9 w-full items-center gap-2 rounded-lg px-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground">
            <Search className="size-4" />
            Search
            <span className="ml-auto text-xs">⌘ /</span>
          </button>
        </div>

        <div className="px-3 pt-4">
          <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">Workspace</p>
          <nav className="space-y-1">
            {navigation.map(({ label, icon: Icon }) => (
              <button
                key={label}
                onClick={() => setActiveSection(label)}
                className={`flex h-9 w-full items-center gap-3 rounded-lg px-2.5 text-sm transition-colors ${activeSection === label ? "bg-sidebar-accent font-medium text-sidebar-foreground" : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"}`}
              >
                <Icon className="size-[17px]" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto space-y-2 p-3">
          <button className="flex h-9 w-full items-center gap-3 rounded-lg px-2.5 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground">
            <Settings className="size-[17px]" />
            Settings
          </button>
          <div className="flex items-center gap-3 rounded-xl border border-sidebar-border p-2.5">
            <div className="flex size-8 items-center justify-center rounded-full bg-sidebar-accent text-xs font-semibold">MP</div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">Milán Papp</p>
              <p className="text-xs text-muted-foreground">Personal workspace</p>
            </div>
            <ChevronsUpDown className="size-4 text-muted-foreground" />
          </div>
        </div>
      </aside>

      <main className="flex min-h-svh min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border/70 px-4 md:px-6">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <Button variant="ghost" size="icon" className="size-9" onClick={() => setSidebarOpen(true)} aria-label="Open sidebar">
                <Menu className="size-4" />
              </Button>
            )}
            <button className="flex items-center gap-1.5 text-sm font-semibold tracking-tight hover:text-muted-foreground">
              Dashboard <ChevronDown className="size-4 text-muted-foreground" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-muted-foreground sm:inline">Appearance</span>
            <Button
              variant="outline"
              size="icon"
              className="size-9 rounded-full"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
            <Button variant="ghost" size="icon" className="size-9 rounded-full" aria-label="Account">
              <UserRound className="size-4" />
            </Button>
          </div>
        </header>

        {activeSection === "Ripples" ? (
          <section className="min-w-0 flex-1"><RipplesPage /></section>
        ) : (
        <section className="flex flex-1 items-center justify-center px-5 py-16">
          <div className="w-full max-w-3xl">
            <div className="mx-auto mb-10 max-w-xl text-center">
              <div className="mx-auto mb-5 flex size-12 items-center justify-center rounded-2xl border border-border bg-card shadow-sm">
                <Command className="size-5" />
              </div>
              <p className="mb-3 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Your workspace</p>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">What are we working on?</h1>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">Your dashboard is ready. Pick a place to start — more tools and insights will appear here.</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { title: "Create a project", description: "Start something new and keep everything organized.", icon: FolderKanban },
                { title: "Review activity", description: "Catch up on recent updates across your workspace.", icon: Activity },
              ].map(({ title, description, icon: Icon }) => (
                <button key={title} className="group flex items-start gap-4 rounded-2xl border border-border bg-card p-5 text-left transition-all hover:border-ring/50 hover:bg-accent/50">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                    <Icon className="size-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{title}</span>
                    <span className="mt-1 block text-sm leading-5 text-muted-foreground">{description}</span>
                  </span>
                  <span className="ml-auto text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">↗</span>
                </button>
              ))}
            </div>
          </div>
        </section>
        )}
        <footer className="px-6 pb-5 text-center text-[11px] text-muted-foreground/60">PAPPMILAN DASHBOARD · WORKSPACE</footer>
      </main>
    </div>
  )
}
