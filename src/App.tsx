import { Button } from "@/components/ui/button"

export default function App() {
    return (
        <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-background px-6 text-foreground">

            {/* Background GIF */}
            <div
                className="pointer-events-none absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage: "url('/backgrounds/1.gif')",
                }}
            />

            {/* Top left logo */}
            <img
                src="/logos/globe-white.svg"
                alt="Globe logo"
                className="absolute left-6 top-6 z-10 h-8 w-8 md:h-12 md:w-12"
            />

            {/* Foreground content */}
            <section className="relative z-10 flex flex-col items-center gap-6 text-center">
                <div className="space-y-2">
                    <h1 className="text-5xl font-semibold tracking-tight text-popover">
                        Life Is Peak
                    </h1>
                </div>

                <Button>Does nothing.</Button>
            </section>
        </main>
    )
}