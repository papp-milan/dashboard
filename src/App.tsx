import { Button } from "@/components/ui/button"

export default function App() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-6 text-foreground">
      <section className="flex flex-col items-center gap-6 text-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Hello, world.</h1>
          <p className="text-sm text-muted-foreground">A clean starting point.</p>
        </div>
        <Button>Get started</Button>
      </section>
    </main>
  )
}
