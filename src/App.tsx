import {Button} from "@/components/ui/button"
import {Globe} from "@/components/globe/Globe.tsx"
import {RadioPlayer} from "@/components/radio-player/RadioPlayer.tsx"
import {Popover, PopoverContent, PopoverTrigger,} from "@/components/ui/popover"
import {ExternalLink} from "lucide-react"

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
            <a
                href="https://pappmilan.com"
                target="_blank"
                rel="noopener noreferrer"
                className="group absolute top-6 right-6 z-10 h-12 w-12 md:left-6 md:h-20 md:w-20"
            >
                <Globe />
            </a>

            {/* Bottom left links */}
            <div className="absolute bottom-6 left-6 z-[100] flex items-center gap-5 pointer-events-auto">

                {/* GitHub */}
                <a
                    href="https://github.com/papp-milan/dashboard"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="GitHub Repository"
                    className="group block h-8 w-8 touch-manipulation md:h-12 md:w-12"
                >
                    <img
                        src="/icons/github/github-white.svg"
                        alt=""
                        draggable={false}
                        className="pointer-events-none h-full w-full select-none transition-transform duration-300 group-hover:scale-110"
                    />
                </a>

                {/* Quick Links */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Quick Links öffnen"
                            className="block h-8 w-8 touch-manipulation rounded-full bg-transparent p-0 hover:bg-transparent md:h-12 md:w-12"
                        >
                            <img
                                src="/icons/links/links.svg"
                                alt=""
                                draggable={false}
                                className="pointer-events-none h-full w-full select-none"
                            />
                        </Button>
                    </PopoverTrigger>

                    <PopoverContent
                        side="top"
                        align="start"
                        className="z-[110] w-52 border-[#493E35] bg-[#211D1A]/95 text-[#F0E8DC] backdrop-blur-xl"
                    >
                        <div className="flex flex-col gap-1">
                            <p className="mb-2 px-2 text-xs font-medium uppercase tracking-widest text-[#A89B8D]">
                                Quick Links
                            </p>

                            {[
                                { label: "Sandbox", url: "https://sandbox.pappmilan.com" },
                                { label: "Forge", url: "https://forge.pappmilan.com" },
                                { label: "Halyard", url: "https://halyard.pappmilan.com" },
                            ].map((link) => (
                                <a
                                    key={link.label}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-between rounded-md px-2 py-2 text-sm transition-colors hover:bg-white/10"
                                >
                                    {link.label}
                                    <ExternalLink className="h-3.5 w-3.5 opacity-50" />
                                </a>
                            ))}
                        </div>
                    </PopoverContent>
                </Popover>
            </div>

            <div className="
                absolute z-10
                hidden sm:grid
                left-[7.4%] top-[47.5%]
                h-[24%] w-[22%]
                grid-cols-2 grid-rows-2
                gap-3 md:gap-4
            ">
                {/* GIF 1 */}
                <div className="
                    relative col-start-1 row-start-1
                    overflow-hidden rounded-sm
                ">
                    <img
                        src='gifs/boxing.gif'
                        alt=""
                        className="
                            h-full w-full object-cover
                            transition-transform duration-500
                            hover:scale-105
                        "
                    />
                </div>

                {/* GIF 2 */}
                <div className="
                    relative col-start-2 row-start-1
                    translate-y-6
                    overflow-hidden rounded-sm
                ">
                    <img
                        src='gifs/coffee.gif'
                        alt=""
                        className="
                            h-full w-full object-cover
                            transition-transform duration-500
                            hover:scale-105
                        "
                    />
                </div>

                {/* GIF 3 */}
                <div className="
                    relative col-start-1 row-start-2
                    translate-x-8 -translate-y-2
                    overflow-hidden rounded-sm
                ">
                    <img
                        src='gifs/dogs.gif'
                        alt=""
                        className="
                            h-full w-full object-cover
                            transition-transform duration-500
                            hover:scale-105
                        "
                    />
                </div>
                {/* GIF 4 */}
                <div className="
                    relative col-start-2 row-start-2
                    translate-x-8 translate-y-4
                    overflow-hidden rounded-sm
                ">
                    <img
                        src='gifs/music.gif'
                        alt=""
                        className="
                            h-full w-full object-cover
                            transition-transform duration-500
                            hover:scale-105
                        "
                    />
                </div>
            </div>

            <RadioPlayer />

            {/* Foreground content */}
            <section className="relative z-10 flex flex-col items-center gap-6 text-center">
                <div className="space-y-2">
                    <h1 className="text-5xl font-semibold tracking-tight text-[#F0E8DC]">
                        Life Is Peak
                    </h1>
                </div>

                <Button
                    className="
                        border border-[#493E35]
                        bg-[#211D1A]
                        text-[#F0E8DC]
                        hover:bg-[#2D2722]
                    "
                >
                    Does nothing.
                </Button>


            </section>
        </main>
    )
}
