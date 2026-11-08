
import { useCallback, useEffect, useRef, useState } from "react"
import {
    Play,
    Pause,
    Volume2,
    VolumeX,
    ExternalLink,
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
    const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)

    const animationFrameRef = useRef<number | null>(null)
    const barRefs = useRef<(HTMLDivElement | null)[]>([])

    const [isPlaying, setIsPlaying] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [volume, setVolume] = useState(25)
    const [error, setError] = useState<string | null>(null)

    const [track, setTrack] = useState<Track>({
        title: "Groove Salad",
        artist: "SomaFM",
    })

    // Fetch current track metadata
    const fetchMetadata = useCallback(async () => {
        try {
            const response = await fetch(METADATA_URL, {
                cache: "no-store",
            })

            if (!response.ok) return

            const data: unknown = await response.json()
            const currentTrack = getTrack(data)

            if (currentTrack) {
                setTrack(currentTrack)
            }
        } catch {
            // Metadata is optional.
        }
    }, [])

    useEffect(() => {
        void fetchMetadata()

        const interval = window.setInterval(fetchMetadata, 30_000)

        return () => window.clearInterval(interval)
    }, [fetchMetadata])

    // Apply volume
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume / 100
        }
    }, [volume])

    // Initialize Web Audio API
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
            sourceRef.current = source
        }

        if (audioContextRef.current.state === "suspended") {
            await audioContextRef.current.resume()
        }
    }

    // Stop visualizer and smoothly return all bars to rest.
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

    // Read actual audio frequencies and update bars.
    const startVisualizer = useCallback(() => {
        const analyser = analyserRef.current

        if (!analyser) return

        if (animationFrameRef.current !== null) {
            cancelAnimationFrame(animationFrameRef.current)
            animationFrameRef.current = null
        }

        const frequencyData = new Uint8Array(analyser.frequencyBinCount)

        barRefs.current.forEach((bar) => {
            if (!bar) return

            bar.style.transition = "height 80ms linear, opacity 80ms linear"
        })

        const update = () => {
            analyser.getByteFrequencyData(frequencyData)

            for (let index = 0; index < BAR_COUNT; index++) {
                const bar = barRefs.current[index]

                if (!bar) continue

                // Logarithmic frequency distribution
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

                const average = sum / (end - start)
                const normalized = average / 255
                const height = 3 + Math.pow(normalized, 1.15) * 34

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

    // Volume
    const handleVolumeChange = (value: number) => {
        setVolume(value)

        if (audioRef.current) {
            audioRef.current.volume = value / 100
        }
    }

    // Clean up animation and audio context
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
        <div className="fixed bottom-5 left-1/2 z-50 w-[min(96vw,780px)] -translate-x-1/2">

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
                    setIsLoading(false)
                    setIsPlaying(true)
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
                            mediaError?.message ??
                            "Audio konnte nicht geladen werden."
                        }`
                    )
                }}
            />

            {/* Soft Glass Player */}
            <div className="
                relative overflow-hidden rounded-2xl
                border border-white/[0.13]
                bg-[#211a16]/65
                shadow-[0_12px_45px_rgba(0,0,0,0.32),inset_0_1px_0_rgba(255,255,255,0.09)]
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
                    relative flex flex-col gap-4
                    p-4 sm:flex-row sm:items-center sm:gap-5 sm:px-6
                ">

                    {/* Track information */}
                    <div className="min-w-0 sm:flex-[1.15]">
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
                                shadow-[0_0_18px_rgba(217,154,97,0.08)]
                                transition-all duration-300
                                hover:border-[#F1BD88]
                                hover:bg-[#D99A61]/25
                                hover:shadow-[0_0_22px_rgba(217,154,97,0.2)]
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
                                value={volume}
                                onChange={(event) =>
                                    handleVolumeChange(Number(event.target.value))
                                }
                                aria-label="Volume"
                                className="radio-volume-slider w-14 cursor-pointer sm:w-16"
                            />
                        </div>

                        {/* External link - desktop only */}
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
                        <p className="text-xs text-red-300">
                            {error}
                        </p>
                    </div>
                )}

                {/* Always-bottom SomaFM branding */}
                <div className="
                    relative flex items-center justify-center
                    border-t border-white/[0.10]
                    bg-black/[0.08] px-4 py-2
                ">
                    <a
                        href="https://somafm.com/groovesalad/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="
                            flex items-center gap-2
                            transition-opacity hover:opacity-100
                        "
                    >
                        <span className="
                            font-sans text-[8px] font-medium
                            tracking-[0.2em] text-[#BBA995]/65
                        ">
                            Powered by
                        </span>

                        <span className="
                            font-serif text-[11px] tracking-[0.18em]
                            text-[#E8C49F]
                        ">
                            SomaFM
                        </span>

                        <ExternalLink className="
                            h-2.5 w-2.5 text-[#BBA995]/60
                        " />
                    </a>
                </div>
            </div>
        </div>
    )
}
