
import { useCallback, useEffect, useRef, useState } from "react"
import {
    Play,
    Pause,
    Volume2,
    VolumeX,
    ExternalLink,
    Radio,
    ChevronDown,
} from "lucide-react"

const STREAM_URL = "https://ice1.somafm.com/groovesalad-128-mp3"
const METADATA_URL = "https://somafm.com/songs/groovesalad.json"

type Track = {
    title: string
    artist: string
}

const BAR_COUNT = 20

function getTrack(data: unknown): Track | null {
    if (!data || typeof data !== "object") return null

    const payload = data as Record<string, unknown>
    const songs = Array.isArray(payload.songs) ? payload.songs : []
    const current = (songs[0] ?? payload) as Record<string, unknown>

    const title = current.title ?? current.Song ?? current.song
    const artist = current.artist ?? current.Artist

    if (typeof title !== "string") return null

    return {
        title,
        artist: typeof artist === "string" ? artist : "SomaFM",
    }
}

export function RadioPlayer() {
    const audioRef = useRef<HTMLAudioElement>(null)
    const audioContextRef = useRef<AudioContext | null>(null)
    const analyserRef = useRef<AnalyserNode | null>(null)
    const animationFrameRef = useRef<number | null>(null)
    const barRefs = useRef<(HTMLDivElement | null)[]>([])
    const frameRef = useRef(0)

    const [isPlaying, setIsPlaying] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isMobileOpen, setIsMobileOpen] = useState(false)
    const [volume, setVolume] = useState(25)
    const [error, setError] = useState<string | null>(null)

    const [track, setTrack] = useState<Track>({
        title: "Groove Salad",
        artist: "SomaFM",
    })

    // Metadata
    const fetchMetadata = useCallback(async () => {
        try {
            const response = await fetch(METADATA_URL, {
                cache: "no-store",
            })

            if (!response.ok) return

            const data: unknown = await response.json()
            const currentTrack = getTrack(data)

            if (currentTrack) setTrack(currentTrack)
        } catch {
            // Metadata is optional.
        }
    }, [])

    useEffect(() => {
        void fetchMetadata()
        const interval = window.setInterval(fetchMetadata, 30_000)

        return () => window.clearInterval(interval)
    }, [fetchMetadata])

    // Volume
    const handleVolumeChange = (value: number) => {
        const nextVolume = Math.max(0, Math.min(100, value))

        setVolume(nextVolume)

        if (audioRef.current) {
            audioRef.current.volume = nextVolume / 100
        }
    }

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume / 100
        }
    }, [volume])

    // Audio analyser
    const initializeAudioAnalyser = async () => {
        const audio = audioRef.current
        if (!audio) return

        if (!audioContextRef.current) {
            const context = new AudioContext()
            const analyser = context.createAnalyser()

            analyser.fftSize = 512
            analyser.smoothingTimeConstant = 0.78
            analyser.minDecibels = -85
            analyser.maxDecibels = -20

            const source = context.createMediaElementSource(audio)

            source.connect(analyser)
            analyser.connect(context.destination)

            audioContextRef.current = context
            analyserRef.current = analyser
        }

        if (audioContextRef.current.state !== "running") {
            await audioContextRef.current.resume()
        }
    }

    // Stop visualizer
    const stopVisualizer = useCallback(() => {
        if (animationFrameRef.current !== null) {
            cancelAnimationFrame(animationFrameRef.current)
            animationFrameRef.current = null
        }

        barRefs.current.forEach((bar) => {
            if (!bar) return

            bar.style.transition =
                "height 850ms cubic-bezier(0.22, 1, 0.36, 1), opacity 850ms ease"

            bar.style.height = getComputedStyle(bar).height
        })

        requestAnimationFrame(() => {
            barRefs.current.forEach((bar) => {
                if (!bar) return

                bar.style.height = "3px"
                bar.style.opacity = "0.35"
            })
        })
    }, [])

    // Visualizer with mobile fallback
    const startVisualizer = useCallback(() => {
        const analyser = analyserRef.current
        if (!analyser) return

        if (animationFrameRef.current !== null) {
            cancelAnimationFrame(animationFrameRef.current)
        }

        const frequencyData = new Uint8Array(analyser.frequencyBinCount)

        frameRef.current = 0

        const update = () => {
            analyser.getByteFrequencyData(frequencyData)

            const hasAudioData = frequencyData.some((value) => value > 3)

            frameRef.current++

            for (let index = 0; index < BAR_COUNT; index++) {
                const bar = barRefs.current[index]
                if (!bar) continue

                let normalized = 0

                if (hasAudioData) {
                    const start = Math.floor(
                        Math.pow(index / BAR_COUNT, 2) *
                        frequencyData.length
                    )

                    const end = Math.max(
                        start + 1,
                        Math.floor(
                            Math.pow((index + 1) / BAR_COUNT, 2) *
                            frequencyData.length
                        )
                    )

                    let sum = 0

                    for (let i = start; i < end; i++) {
                        sum += frequencyData[i]
                    }

                    normalized = (sum / (end - start)) / 255
                } else {
                    const time = frameRef.current * 0.11
                    normalized =
                        0.12 +
                        Math.abs(
                            Math.sin(time + index * 0.65) *
                            Math.cos(time * 0.7 + index * 0.3)
                        ) * 0.65
                }

                const height = 3 + Math.pow(normalized, 1.15) * 34

                bar.style.transition = "height 90ms linear, opacity 90ms linear"
                bar.style.height = `${height}px`
                bar.style.opacity = `${0.4 + normalized * 0.6}`
            }

            animationFrameRef.current = requestAnimationFrame(update)
        }

        update()
    }, [])

    // Playback
    const togglePlayback = async () => {
        const audio = audioRef.current
        if (!audio) return

        if (!audio.paused) {
            audio.pause()
            return
        }

        setIsLoading(true)
        setError(null)

        try {
            await initializeAudioAnalyser()
            await audio.play()
        } catch (err) {
            console.error("Radio playback failed:", err)

            setError(
                err instanceof Error
                    ? err.message
                    : "Wiedergabe fehlgeschlagen"
            )

            setIsPlaying(false)
            setIsLoading(false)
            stopVisualizer()
        }
    }

    // Cleanup
    useEffect(() => {
        return () => {
            if (animationFrameRef.current !== null) {
                cancelAnimationFrame(animationFrameRef.current)
            }

            if (audioContextRef.current) {
                void audioContextRef.current.close()
            }
        }
    }, [])

    return (
        <div className="
            fixed bottom-5 right-5 z-50
            sm:bottom-5 sm:left-1/2 sm:right-auto
            sm:w-[min(96vw,780px)] sm:-translate-x-1/2
        ">

            <audio
                ref={audioRef}
                crossOrigin="anonymous"
                src={STREAM_URL}
                preload="none"
                onPlay={() => {
                    setIsPlaying(true)
                    setIsLoading(false)
                    setError(null)
                    startVisualizer()
                }}
                onPause={() => {
                    setIsPlaying(false)
                    setIsLoading(false)
                    stopVisualizer()
                }}
                onWaiting={() => setIsLoading(true)}
                onPlaying={() => {
                    setIsPlaying(true)
                    setIsLoading(false)
                    startVisualizer()
                }}
                onError={(event) => {
                    const mediaError = event.currentTarget.error

                    console.error("Radio error:", mediaError)

                    setIsPlaying(false)
                    setIsLoading(false)
                    stopVisualizer()

                    setError(
                        `Fehler ${mediaError?.code ?? "unbekannt"}: ${
                            mediaError?.message ?? "Audio konnte nicht geladen werden."
                        }`
                    )
                }}
            />

            {/* Mobile radio launcher */}
            <button
                type="button"
                onClick={() => setIsMobileOpen(true)}
                aria-label="Radio-Player öffnen"
                aria-expanded={isMobileOpen}
                className={`
                    flex sm:hidden
                    h-14 w-14 items-center justify-center
                    rounded-full border border-[#E8B47F]/40
                    bg-[#211a16]/90 text-[#E8B47F]
                    shadow-[0_8px_30px_rgba(0,0,0,0.4),0_0_20px_rgba(217,154,97,0.12)]
                    backdrop-blur-2xl
                    transition-all duration-300
                    hover:bg-[#30241D]
                    active:scale-95
                    ${isMobileOpen
                    ? "pointer-events-none scale-75 opacity-0"
                    : "scale-100 opacity-100"
                }
                `}
            >
                <span className="relative">
                    <Radio className="h-6 w-6" />
                    {isPlaying && (
                        <span className="
                            absolute -right-1 -top-1
                            h-2.5 w-2.5 rounded-full
                            border-2 border-[#211a16]
                            bg-[#E69A56]
                            shadow-[0_0_8px_rgba(230,154,86,0.8)]
                        " />
                    )}
                </span>
            </button>

            {/* Animated player panel */}
            <div
                className={`
                    absolute bottom-0 right-0 w-[min(92vw,380px)]
                    origin-bottom-right
                    transition-[transform,visibility] duration-300
                    ease-[cubic-bezier(0.22,1,0.36,1)]
                    sm:static sm:w-full sm:origin-center
                    ${isMobileOpen
                    ? "visible translate-y-0 scale-100"
                    : "invisible pointer-events-none translate-y-5 scale-95"
                }
                    sm:!visible sm:!pointer-events-auto
                    sm:!translate-y-0 sm:!scale-100
                `}
                aria-hidden={!isMobileOpen}
            >
                <div className="
                    relative overflow-hidden rounded-2xl
                    border border-white/[0.13]
                    bg-[#211a16]/85
                    shadow-[0_12px_45px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.09)]
                    backdrop-blur-2xl
                ">

                    {/* Glass reflections */}
                    <div className="
                        pointer-events-none absolute inset-0
                        bg-gradient-to-br from-white/[0.09]
                        via-transparent to-[#D68A4D]/[0.06]
                    " />

                    <div className="
                        pointer-events-none absolute -left-16 -top-24
                        h-40 w-64 rounded-full
                        bg-[#D68A4D]/[0.08] blur-3xl
                    " />

                    {/* Main content */}
                    <div className="
                        relative flex flex-col gap-4 p-4
                        sm:flex-row sm:items-center sm:gap-5 sm:px-6
                    ">

                        {/* Track information */}
                        <div className="flex min-w-0 items-start justify-between gap-3 sm:flex-[1.15]">
                            <div className="min-w-0">
                                <h3 className="
                                    truncate font-serif text-lg font-medium
                                    tracking-wide text-[#F4E5D2]
                                ">
                                    {track.title}
                                </h3>

                                <p className="
                                    mt-1 truncate text-xs tracking-wide
                                    text-[#BBA995]
                                ">
                                    {track.artist}
                                </p>
                            </div>

                            {/* Mobile close */}
                            <button
                                type="button"
                                onClick={() => setIsMobileOpen(false)}
                                aria-label="Radio-Player minimieren"
                                className="
                                    flex h-9 w-9 shrink-0 items-center
                                    justify-center rounded-full
                                    text-[#BBA995] transition
                                    hover:bg-white/10 hover:text-[#F2C69A]
                                    sm:hidden
                                "
                            >
                                <ChevronDown className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Controls */}
                        <div className="
                            flex min-w-0 items-center justify-between gap-3
                            sm:contents
                        ">

                            {/* Equalizer */}
                            <div
                                className="radio-equalizer flex flex-1 sm:flex-initial"
                                aria-label="Audio visualizer"
                            >
                                {Array.from({ length: BAR_COUNT }, (_, index) => (
                                    <div
                                        key={index}
                                        ref={(element) => {
                                            barRefs.current[index] = element
                                        }}
                                        className="radio-equalizer-bar"
                                    />
                                ))}
                            </div>

                            {/* Play / Pause */}
                            <button
                                type="button"
                                onClick={togglePlayback}
                                disabled={isLoading}
                                aria-label={isPlaying ? "Pause" : "Play"}
                                className="
                                    flex h-11 w-11 shrink-0 items-center
                                    justify-center rounded-full
                                    border border-[#E8B47F]/60
                                    bg-[#D99A61]/15 text-[#F2C69A]
                                    transition-all duration-300
                                    hover:border-[#F1BD88]
                                    hover:bg-[#D99A61]/25
                                    active:scale-95 disabled:opacity-50
                                "
                            >
                                {isLoading ? (
                                    <span className="
                                        h-4 w-4 animate-spin rounded-full
                                        border-2 border-[#E8B47F]/30
                                        border-t-[#F2C69A]
                                    " />
                                ) : isPlaying ? (
                                    <Pause className="h-4 w-4 fill-current" />
                                ) : (
                                    <Play className="ml-0.5 h-4 w-4 fill-current" />
                                )}
                            </button>

                            {/* Volume */}
                            <div className="
                                flex shrink-0 items-center gap-2
                                border-l border-white/[0.12] pl-3
                                sm:pl-4
                            ">
                                <button
                                    type="button"
                                    onClick={() =>
                                        handleVolumeChange(volume === 0 ? 65 : 0)
                                    }
                                    aria-label={volume === 0 ? "Unmute" : "Mute"}
                                    className="
                                        flex h-10 w-9 items-center justify-center
                                        text-[#BBA995] transition
                                        hover:text-[#F2C69A]
                                    "
                                >
                                    {volume === 0 ? (
                                        <VolumeX className="h-4 w-4" />
                                    ) : (
                                        <Volume2 className="h-4 w-4" />
                                    )}
                                </button>

                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    step="1"
                                    value={volume}
                                    onChange={(event) =>
                                        handleVolumeChange(Number(event.target.value))
                                    }
                                    onInput={(event) =>
                                        handleVolumeChange(Number(event.currentTarget.value))
                                    }
                                    aria-label="Volume"
                                    className="
                                        radio-volume-slider
                                        relative z-10 w-24 cursor-pointer
                                        sm:w-16
                                    "
                                />
                            </div>

                            {/* External link */}
                            <a
                                href="https://somafm.com/groovesalad/"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Open SomaFM Groove Salad"
                                className="
                                    hidden border-l border-white/[0.12]
                                    pl-4 text-[#BBA995]
                                    transition hover:text-[#F2C69A]
                                    sm:block
                                "
                            >
                                <ExternalLink className="h-4 w-4" />
                            </a>
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="
                            relative border-t border-red-300/15
                            bg-red-950/20 px-5 py-2
                        ">
                            <p className="text-xs text-red-300">{error}</p>
                        </div>
                    )}

                    {/* SomaFM footer */}
                    <div className="
                        relative flex items-center justify-center
                        border-t border-white/[0.10]
                        bg-black/[0.08] px-4 py-2
                    ">
                        <a
                            href="https://somafm.com/groovesalad/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2"
                        >
                            <span className="
                                font-sans text-[8px] font-medium
                                tracking-[0.2em] text-[#BBA995]/65
                            ">
                                POWERED BY
                            </span>

                            <span className="
                                font-serif text-[11px] tracking-[0.18em]
                                text-[#E8C49F]
                            ">
                                SOMAFM
                            </span>

                            <ExternalLink className="
                                h-2.5 w-2.5 text-[#BBA995]/60
                            " />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    )
}
