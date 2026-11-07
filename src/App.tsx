import { Button } from "@/components/ui/button"
import { ArrowUpRight } from "lucide-react"

export default function App() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-6 text-foreground">
      <section className="flex max-w-md flex-col items-center gap-5 text-center">
        <div className="grid size-14 place-items-center rounded-2xl border bg-card text-primary shadow-sm">
          <span className="text-2xl font-semibold">H</span>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">A fresh start</p>
          <h1 className="text-4xl font-semibold tracking-tight">Hello, world.</h1>
          <p className="text-sm leading-6 text-muted-foreground">A clean foundation. Ready for something new.</p>
        </div>
        <Button onClick={() => window.alert("Hello, world!")}>Say hello <ArrowUpRight /></Button>
      </section>
    </main>
  )
}
