import { ArrowUpRight, LayoutDashboard } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function App() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-6 py-12 text-foreground">
      <section className="w-full max-w-xl space-y-6 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border bg-card shadow-sm">
          <LayoutDashboard className="size-7" />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium tracking-wide text-muted-foreground">PAPPMILAN / DASHBOARD</p>
          <h1 className="text-4xl font-semibold tracking-tight">Hello, world.</h1>
          <p className="text-muted-foreground">
            Your dashboard foundation is ready. More to come.
          </p>
        </div>
        <Button>
          It works <ArrowUpRight data-icon="inline-end" />
        </Button>
      </section>
    </main>
  )
}